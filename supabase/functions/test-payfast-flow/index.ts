import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import CryptoJS from "npm:crypto-js@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sign(data: Record<string, string>, passphrase: string): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === "signature" || v === "" || v === null || v === undefined) continue;
    parts.push(`${k}=${encodeURIComponent(v.toString().trim()).replace(/%20/g, "+")}`);
  }
  let qs = parts.join("&");
  if (passphrase) qs += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  return CryptoJS.MD5(qs).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const steps: { step: string; ok: boolean; detail?: any }[] = [];
  const log = (step: string, ok: boolean, detail?: any) => steps.push({ step, ok, detail });

  try {
    // 1. Auth + admin check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: uErr } = await adminClient.auth.getUser(token);
    if (uErr || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    if (!isAdmin) throw new Error("Admin only");
    log("Auth + admin check", true, { user: user.email });

    const { event_id, tier_id } = await req.json();
    if (!event_id || !tier_id) throw new Error("Missing event_id or tier_id");

    // 2. Fetch tier
    const { data: tier } = await adminClient
      .from("ticket_tiers").select("*").eq("id", tier_id).single();
    if (!tier) throw new Error("Tier not found");
    log("Loaded tier", true, { name: tier.name, price: tier.price });

    // 3. Create pending test order
    const tiers = [{ tier_id, quantity: 1 }];
    const { data: order, error: oErr } = await adminClient
      .from("ticket_orders").insert({
        user_id: user.id,
        event_id,
        total_amount: Number(tier.price),
        currency: tier.currency,
        status: "pending",
        customer_email: user.email,
        customer_name: "PayFast Sandbox Test",
        payment_provider: "payfast",
      }).select().single();
    if (oErr || !order) throw new Error("Order create failed: " + oErr?.message);
    log("Created pending order", true, { order_id: order.id });

    // 4. Build signed ITN payload (mimics what PayFast would POST)
    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const merchantId = Deno.env.get("PAYFAST_MERCHANT_ID") || "10000100";
    const pfPaymentId = `SANDBOX-${Date.now()}`;
    const itnData: Record<string, string> = {
      m_payment_id: order.id,
      pf_payment_id: pfPaymentId,
      payment_status: "COMPLETE",
      item_name: "Sandbox Test Ticket",
      item_description: "Automated sandbox flow test",
      amount_gross: Number(tier.price).toFixed(2),
      amount_fee: "-2.00",
      amount_net: (Number(tier.price) - 2).toFixed(2),
      custom_str1: event_id,
      custom_str2: JSON.stringify(tiers),
      name_first: "Sandbox",
      name_last: "Tester",
      email_address: user.email!,
      merchant_id: merchantId,
    };
    itnData.signature = sign(itnData, passphrase);

    const formBody = new URLSearchParams(itnData).toString();
    log("Signed ITN payload", true, { signature: itnData.signature });

    // 5. POST to payfast-itn webhook
    const projectId = Deno.env.get("SUPABASE_URL")!.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
    const itnUrl = `https://${projectId}.supabase.co/functions/v1/payfast-itn`;
    const itnRes = await fetch(itnUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
    const itnText = await itnRes.text();
    log("POSTed to payfast-itn webhook", itnRes.ok, { status: itnRes.status, body: itnText });
    if (!itnRes.ok) throw new Error(`Webhook returned ${itnRes.status}: ${itnText}`);

    // 6. Verify order is paid
    const { data: paidOrder } = await adminClient
      .from("ticket_orders").select("status, payfast_payment_id").eq("id", order.id).single();
    const paidOk = paidOrder?.status === "paid";
    log("Order marked as paid", paidOk, paidOrder);
    if (!paidOk) throw new Error("Order status is not 'paid'");

    // 7. Verify ticket(s) created with QR codes
    const { data: tickets } = await adminClient
      .from("tickets").select("id, qr_code, tier_id").eq("order_id", order.id);
    const ticketOk = (tickets?.length || 0) === 1 && !!tickets?.[0].qr_code;
    log("Ticket created with QR code", ticketOk, tickets);
    if (!ticketOk) throw new Error("Tickets not created correctly");

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      qr_code: tickets[0].qr_code,
      steps,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message, steps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
