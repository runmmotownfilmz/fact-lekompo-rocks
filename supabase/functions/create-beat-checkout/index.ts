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

    const { upload_id } = await req.json();
    if (!upload_id) throw new Error("Missing upload_id");

    const { data: upload, error } = await supabase
      .from("uploads")
      .select("id, title, price, user_id, type, cover_image_url")
      .eq("id", upload_id)
      .maybeSingle();
    if (error || !upload) throw new Error("Upload not found");
    if (!upload.price || Number(upload.price) <= 0) throw new Error("This item is free");
    if (upload.user_id === user.id) throw new Error("You cannot buy your own upload");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    const customerId = customers.data[0]?.id;

    const origin = req.headers.get("origin") || "";
    const amountCents = Math.round(Number(upload.price) * 100);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email!,
      line_items: [{
        price_data: {
          currency: "zar",
          product_data: {
            name: upload.title,
            description: `${upload.type.replace("_", " ")} purchase`,
            images: upload.cover_image_url ? [upload.cover_image_url] : undefined,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/beats?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/beats?purchase=cancel`,
      metadata: { upload_id: upload.id, buyer_id: user.id, seller_id: upload.user_id },
    });

    await supabase.from("beat_purchases").insert({
      upload_id: upload.id,
      buyer_id: user.id,
      seller_id: upload.user_id,
      stripe_session_id: session.id,
      amount: upload.price,
      currency: "ZAR",
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
