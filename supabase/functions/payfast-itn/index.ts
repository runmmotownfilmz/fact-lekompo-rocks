import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import CryptoJS from "npm:crypto-js@4.2.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "TKT-";
  for (let i = 0; i < 20; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function buildSignature(data: Record<string, string>, passphrase: string, skipSignatureKey = true): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (skipSignatureKey && key === "signature") continue;
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
    // Parse PayFast ITN form-encoded body
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const data: Record<string, string> = {};
    params.forEach((v, k) => { data[k] = v; });

    console.log("PayFast ITN received:", data);

    const passphrase = Deno.env.get("PAYFAST_PASSPHRASE") || "";
    const receivedSignature = data.signature || "";
    const expectedSignature = buildSignature(data, passphrase);

    if (receivedSignature.toLowerCase() !== expectedSignature.toLowerCase()) {
      console.error("Signature mismatch", { received: receivedSignature, expected: expectedSignature });
      return new Response("Invalid signature", { status: 400 });
    }

    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status;
    const pfPaymentId = data.pf_payment_id;

    if (!orderId) return new Response("Missing m_payment_id", { status: 400 });

    // Fetch order
    const { data: order } = await supabaseClient
      .from("ticket_orders").select("*").eq("id", orderId).single();
    if (!order) return new Response("Order not found", { status: 404 });

    if (order.status === "paid") {
      return new Response("OK", { status: 200 }); // already processed
    }

    if (paymentStatus !== "COMPLETE") {
      await supabaseClient.from("ticket_orders")
        .update({ status: paymentStatus.toLowerCase(), payfast_payment_id: pfPaymentId })
        .eq("id", orderId);
      return new Response("OK", { status: 200 });
    }

    // Verify amount matches
    const paidAmount = parseFloat(data.amount_gross);
    if (Math.abs(paidAmount - Number(order.total_amount)) > 0.01) {
      console.error("Amount mismatch", { paid: paidAmount, expected: order.total_amount });
      return new Response("Amount mismatch", { status: 400 });
    }

    // Parse tiers from custom_str2
    const tiers = JSON.parse(data.custom_str2 || "[]");

    // Create tickets
    const tickets: any[] = [];
    for (const item of tiers) {
      for (let i = 0; i < item.quantity; i++) {
        tickets.push({
          order_id: order.id,
          event_id: order.event_id,
          tier_id: item.tier_id,
          user_id: order.user_id,
          qr_code: generateQRCode(),
          attendee_name: order.customer_name,
          attendee_email: order.customer_email,
        });
      }
      // Increment sold count
      const { data: tierRow } = await supabaseClient
        .from("ticket_tiers").select("quantity_sold").eq("id", item.tier_id).single();
      if (tierRow) {
        await supabaseClient.from("ticket_tiers")
          .update({ quantity_sold: (tierRow.quantity_sold || 0) + item.quantity })
          .eq("id", item.tier_id);
      }
    }

    const { error: ticketError } = await supabaseClient.from("tickets").insert(tickets);
    if (ticketError) {
      console.error("Ticket insert failed:", ticketError);
      return new Response("Ticket creation failed", { status: 500 });
    }

    await supabaseClient.from("ticket_orders").update({
      status: "paid",
      payfast_payment_id: pfPaymentId,
    }).eq("id", order.id);

    // Try to send confirmation email (non-blocking)
    try {
      await supabaseClient.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ticket-confirmation",
          recipientEmail: order.customer_email,
          idempotencyKey: `ticket-confirm-${order.id}`,
          templateData: {
            name: order.customer_name,
            eventTitle: data.item_name,
            tickets: tickets.map((t) => ({ qr_code: t.qr_code })),
            orderTotal: order.total_amount,
            currency: order.currency,
          },
        },
      });
    } catch (e) {
      console.warn("Email skipped:", e);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("ITN error:", error);
    return new Response("Error", { status: 500 });
  }
});
