import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");
    const user = userData.user;

    const { event_id, tiers } = await req.json();
    // tiers: Array<{ tier_id: string, quantity: number }>

    if (!event_id || !tiers || !Array.isArray(tiers) || tiers.length === 0) {
      throw new Error("Missing event_id or tiers");
    }

    // Fetch event
    const { data: event } = await supabaseClient
      .from("events")
      .select("id, title")
      .eq("id", event_id)
      .single();
    if (!event) throw new Error("Event not found");

    // Fetch tier details and validate availability
    const tierIds = tiers.map((t: any) => t.tier_id);
    const { data: tierData } = await supabaseClient
      .from("ticket_tiers")
      .select("*")
      .in("id", tierIds);
    if (!tierData || tierData.length === 0) throw new Error("Invalid tiers");

    const line_items: any[] = [];
    let totalAmount = 0;
    const tierMap = new Map(tierData.map(t => [t.id, t]));

    for (const item of tiers) {
      const tier = tierMap.get(item.tier_id);
      if (!tier) throw new Error(`Tier ${item.tier_id} not found`);
      const available = tier.quantity_total - tier.quantity_sold;
      if (item.quantity > available) throw new Error(`Only ${available} ${tier.name} tickets available`);
      
      totalAmount += tier.price * item.quantity;
      line_items.push({
        price_data: {
          currency: tier.currency.toLowerCase(),
          product_data: {
            name: `${event.title} - ${tier.name}`,
            description: tier.description || undefined,
          },
          unit_amount: Math.round(tier.price * 100), // cents
        },
        quantity: item.quantity,
      });
    }

    // Create order record
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
      })
      .select()
      .single();
    if (orderError) throw new Error("Failed to create order: " + orderError.message);

    // Create Stripe checkout
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/ticket-success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?ticket_cancelled=true`,
      metadata: {
        order_id: order.id,
        event_id,
        tiers_json: JSON.stringify(tiers),
      },
    });

    // Update order with stripe session id
    await supabaseClient
      .from("ticket_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
