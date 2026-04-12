import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "TKT-";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    if (userError || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { order_id, session_id } = await req.json();
    if (!order_id || !session_id) throw new Error("Missing order_id or session_id");

    // Check if order belongs to user and is pending
    const { data: order } = await supabaseClient
      .from("ticket_orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();
    if (!order) throw new Error("Order not found");
    if (order.status === "paid") {
      return new Response(JSON.stringify({ success: true, already_verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch event details for email
    const { data: event } = await supabaseClient
      .from("events")
      .select("id, title")
      .eq("id", order.event_id)
      .single();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Parse tiers from metadata
    const tiersJson = session.metadata?.tiers_json;
    if (!tiersJson) throw new Error("No tier data in session");
    const tiers = JSON.parse(tiersJson);

    // Create individual tickets and update sold counts
    const tickets: any[] = [];
    for (const item of tiers) {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          order_id: order.id,
          event_id: order.event_id,
          tier_id: item.tier_id,
          user_id: user.id,
          qr_code: generateQRCode(),
          attendee_name: user.user_metadata?.display_name || user.email,
          attendee_email: user.email,
        });
      }

      // Update sold count
      await supabaseClient.rpc("increment_ticket_sold" as any, {
        _tier_id: item.tier_id,
        _count: item.quantity,
      }).then(() => {}).catch(() => {
        // Fallback: direct update
        supabaseClient
          .from("ticket_tiers")
          .select("quantity_sold")
          .eq("id", item.tier_id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabaseClient
                .from("ticket_tiers")
                .update({ quantity_sold: (data.quantity_sold || 0) + item.quantity })
                .eq("id", item.tier_id);
            }
          });
      });
    }

    // Insert tickets
    const { error: ticketError } = await supabaseClient
      .from("tickets")
      .insert(tickets);
    if (ticketError) throw new Error("Failed to create tickets: " + ticketError.message);

    // Update order status
    await supabaseClient
      .from("ticket_orders")
      .update({
        status: "paid",
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq("id", order.id);

    // Send confirmation email with ticket QR codes (gracefully fails if email infra not set up yet)
    try {
      const ticketDetails = tickets.map((t: any) => {
        const tier = tierData?.find((td: any) => td.id === t.tier_id);
        return {
          qr_code: t.qr_code,
          tier_name: tier?.name || "General",
          price: tier?.price || 0,
          currency: tier?.currency || "ZAR",
        };
      });

      await supabaseClient.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ticket-confirmation",
          recipientEmail: user.email,
          idempotencyKey: `ticket-confirm-${order.id}`,
          templateData: {
            name: user.user_metadata?.display_name || user.email,
            eventTitle: event?.title || "Event",
            tickets: ticketDetails,
            orderTotal: order.total_amount,
            currency: order.currency,
          },
        },
      });
    } catch (emailErr) {
      // Email sending is non-blocking — tickets are already created
      console.warn("Email confirmation skipped (infra not ready):", emailErr);
    }

    return new Response(JSON.stringify({ success: true, ticket_count: tickets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
