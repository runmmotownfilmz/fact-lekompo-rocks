import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import CryptoJS from "npm:crypto-js@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateSignature(data: Record<string, string>, passphrase: string): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === null || value === undefined) continue;
    parts.push(`${key}=${encodeURIComponent(value.toString().trim()).replace(/%20/g, "+")}`);
  }
  let queryString = parts.join("&");
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }
  return CryptoJS.MD5(queryString).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const { event_id, tiers } = await req.json();
    if (!event_id || !Array.isArray(tiers) || tiers.length === 0) {
      throw new Error("Missing event_id or tiers");
    }

    const { data: event } = await supabaseClient
      .from("events").select("id, title").eq("id", event_id).single();
    if (!event) throw new Error("Event not found");

    const tierIds = tiers.map((t: any) => t.tier_id);
    const { data: tierData } = await supabaseClient
      .from("ticket_tiers").select("*").in("id", tierIds);
    if (!tierData?.length) throw new Error("Invalid tiers");

    const tierMap = new Map(tierData.map((t) => [t.id, t]));
    let totalAmount = 0;
    const itemNames: string[] = [];
    for (const item of tiers) {
      const tier = tierMap.get(item.tier_id);
      if (!tier) throw new Error(`Tier ${item.tier_id} not found`);
      const available = tier.quantity_total - tier.quantity_sold;
      if (item.quantity > available) throw new Error(`Only ${available} ${tier.name} left`);
      totalAmount += Number(tier.price) * item.quantity;
      itemNames.push(`${item.quantity}x ${tier.name}`);
    }

    // Create order (pending)
    const { data: order, error: orderError } = await supabaseClient
      .from("ticket_orders")
      .insert({
        user_id: user.id,
        event_id,
        total_amount: totalAmount,
        currency: tierData[0].currency,
        status: "pending",
        customer_email: user.email,
        customer_name: user.user_metadata?.display_name || user.email,
        payment_provider: "payfast",
      })
      .select().single();
    if (orderError) throw new Error("Failed to create order: " + orderError.message);

    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID")!;
    const merchantKey = Deno.env.get("PAYFAST_MERCHANT_KEY")!;
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const origin = req.headers.get("origin") || "";
    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
    const itnUrl = `https://${projectId}.supabase.co/functions/v1/payfast-itn`;

    // Sandbox vs live: sandbox by default. Detect via merchant_id (sandbox is 10000100).
    const isSandbox = merchantId === "10000100" || Deno.env.get("PAYFAST_SANDBOX") === "true";
    const payfastUrl = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    // Build PayFast form data — ORDER MATTERS for signature
    const [firstName, ...rest] = (user.user_metadata?.display_name || user.email).split(" ");
    const data: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/ticket-success?order_id=${order.id}&provider=payfast`,
      cancel_url: `${origin}/?ticket_cancelled=true`,
      notify_url: itnUrl,
      name_first: firstName || "Customer",
      name_last: rest.join(" ") || "User",
      email_address: user.email,
      m_payment_id: order.id,
      amount: totalAmount.toFixed(2),
      item_name: `${event.title} — Tickets`.slice(0, 100),
      item_description: itemNames.join(", ").slice(0, 255),
      custom_str1: event_id,
      custom_str2: JSON.stringify(tiers).slice(0, 255),
    };

    const signature = await generateSignature(data, passphrase);
    data.signature = signature;

    return new Response(
      JSON.stringify({ payfast_url: payfastUrl, fields: data, order_id: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
