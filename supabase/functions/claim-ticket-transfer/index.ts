import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: transfer, error: tErr } = await admin
      .from("ticket_transfers")
      .select("*")
      .eq("claim_token", token)
      .maybeSingle();

    if (tErr || !transfer) {
      return new Response(JSON.stringify({ error: "Invalid transfer link" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (transfer.status !== "pending") {
      return new Response(JSON.stringify({ error: `Transfer already ${transfer.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (transfer.from_user_id === user.id) {
      return new Response(JSON.stringify({ error: "You cannot claim your own transfer" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reassign ticket and mark transfer claimed
    const { error: upErr } = await admin
      .from("tickets")
      .update({ user_id: user.id, attendee_email: user.email ?? null })
      .eq("id", transfer.ticket_id);
    if (upErr) throw upErr;

    await admin
      .from("ticket_transfers")
      .update({ status: "claimed", to_user_id: user.id, claimed_at: new Date().toISOString() })
      .eq("id", transfer.id);

    return new Response(JSON.stringify({ success: true, ticket_id: transfer.ticket_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
