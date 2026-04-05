import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    // Verify admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Admin access required");

    const { qr_code } = await req.json();
    if (!qr_code) throw new Error("Missing QR code");

    // Find ticket
    const { data: ticket, error: ticketError } = await supabaseClient
      .from("tickets")
      .select(`
        *,
        ticket_tiers!inner(name),
        events!inner(title, event_date)
      `)
      .eq("qr_code", qr_code)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: "Ticket not found. Invalid QR code." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.is_checked_in) {
      return new Response(JSON.stringify({
        valid: false,
        message: `Already checked in at ${new Date(ticket.checked_in_at).toLocaleString()}`,
        ticket: {
          attendee_name: ticket.attendee_name,
          tier: (ticket as any).ticket_tiers?.name,
          event: (ticket as any).events?.title,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check in
    await supabaseClient
      .from("tickets")
      .update({
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: userData.user.id,
      })
      .eq("id", ticket.id);

    return new Response(JSON.stringify({
      valid: true,
      message: "✅ Check-in successful!",
      ticket: {
        attendee_name: ticket.attendee_name,
        attendee_email: ticket.attendee_email,
        tier: (ticket as any).ticket_tiers?.name,
        event: (ticket as any).events?.title,
        event_date: (ticket as any).events?.event_date,
      },
    }), {
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
