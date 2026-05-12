import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { qr_code } = await req.json();
    if (!qr_code || typeof qr_code !== "string") throw new Error("Missing QR code");

    const code = qr_code.trim();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        id, qr_code, attendee_name, attendee_email, is_checked_in, checked_in_at, order_id,
        ticket_tiers!inner(name, price, currency),
        events!inner(title, event_date, venue),
        ticket_orders!inner(status, total_amount, currency, payment_provider, customer_email)
      `)
      .eq("qr_code", code)
      .maybeSingle();

    if (error || !ticket) {
      await supabase.from("scan_logs").insert({
        qr_code: code,
        ticket_id: null,
        status: "not_found",
        message: "Ticket not found",
        scanned_by: userData.user.id,
      });
      return new Response(
        JSON.stringify({ valid: false, status: "not_found", message: "Ticket not found. Invalid QR code." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const order = (ticket as any).ticket_orders;
    const tier = (ticket as any).ticket_tiers;
    const event = (ticket as any).events;
    const isPaid = order?.status === "paid";

    const payload = {
      valid: isPaid && !ticket.is_checked_in,
      status: !isPaid
        ? "unpaid"
        : ticket.is_checked_in
          ? "checked_in"
          : "valid",
      message: !isPaid
        ? `Payment ${order?.status || "missing"} — ticket NOT valid for entry`
        : ticket.is_checked_in
          ? `Already checked in at ${new Date(ticket.checked_in_at).toLocaleString()}`
          : "✅ Ticket is valid and paid",
      ticket: {
        qr_code: ticket.qr_code,
        attendee_name: ticket.attendee_name,
        attendee_email: ticket.attendee_email,
        is_checked_in: ticket.is_checked_in,
        checked_in_at: ticket.checked_in_at,
        tier: tier?.name,
        event: event?.title,
        event_date: event?.event_date,
        venue: event?.venue,
        payment_status: order?.status,
        payment_provider: order?.payment_provider,
        amount_paid: order?.total_amount,
        currency: order?.currency,
      },
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ valid: false, status: "error", message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
