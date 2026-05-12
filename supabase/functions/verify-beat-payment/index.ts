import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Not authenticated");
    const { data: userData } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Missing session_id");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const { data: purchase } = await supabase
      .from("beat_purchases")
      .select("id, upload_id, buyer_id, status")
      .eq("stripe_session_id", session_id)
      .maybeSingle();
    if (!purchase) throw new Error("Purchase not found");
    if (purchase.buyer_id !== user.id) throw new Error("Not authorized");

    if (session.payment_status === "paid" && purchase.status !== "paid") {
      await supabase
        .from("beat_purchases")
        .update({ status: "paid" })
        .eq("id", purchase.id);
      // bump downloads_count
      await supabase.rpc("increment_play_count").catch(() => {});
    }

    const { data: upload } = await supabase
      .from("uploads")
      .select("id, title, file_url, type, cover_image_url")
      .eq("id", purchase.upload_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      paid: session.payment_status === "paid",
      upload,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
