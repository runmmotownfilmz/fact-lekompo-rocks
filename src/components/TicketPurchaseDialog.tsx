import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity_total: number;
  quantity_sold: number;
}

interface Props {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TicketPurchaseDialog = ({ eventId, eventTitle, open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<null | "stripe" | "payfast">(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    const fetchTiers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("ticket_tiers")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order");
      setTiers(data || []);
      setQuantities({});
      setLoading(false);
    };
    fetchTiers();
  }, [eventId, open]);

  const updateQty = (tierId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[tierId] || 0;
      const tier = tiers.find(t => t.id === tierId);
      const available = tier ? tier.quantity_total - tier.quantity_sold : 0;
      const next = Math.max(0, Math.min(current + delta, available, 10));
      return { ...prev, [tierId]: next };
    });
  };

  const total = tiers.reduce((sum, tier) => sum + tier.price * (quantities[tier.id] || 0), 0);
  const hasSelection = Object.values(quantities).some(q => q > 0);

  const handlePurchase = async (provider: "stripe" | "payfast") => {
    if (!user) {
      toast.error("Please sign in to purchase tickets");
      navigate("/auth");
      return;
    }

    setPurchasing(provider);
    const selectedTiers = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([tier_id, quantity]) => ({ tier_id, quantity }));

    if (provider === "stripe") {
      const { data, error } = await supabase.functions.invoke("create-ticket-checkout", {
        body: { event_id: eventId, tiers: selectedTiers },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Failed to create checkout");
        setPurchasing(null);
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } else {
      const { data, error } = await supabase.functions.invoke("create-payfast-checkout", {
        body: { event_id: eventId, tiers: selectedTiers },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Failed to create checkout");
        setPurchasing(null);
        return;
      }
      if (data?.payfast_url && data?.fields) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.payfast_url;
        form.target = "_blank";
        Object.entries(data.fields as Record<string, string>).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = String(v);
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        onOpenChange(false);
      }
    }
    setPurchasing(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Get Tickets — {eventTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : tiers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No tickets available for this event yet.
          </p>
        ) : (
          <div className="space-y-4">
            {tiers.map(tier => {
              const available = tier.quantity_total - tier.quantity_sold;
              const soldOut = available <= 0;
              const qty = quantities[tier.id] || 0;

              return (
                <div
                  key={tier.id}
                  className={`p-4 rounded-xl border transition-all ${
                    qty > 0
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  } ${soldOut ? "opacity-50" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{tier.name}</h4>
                      {tier.description && (
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      )}
                    </div>
                    <span className="font-bold text-lg text-primary">
                      R{tier.price.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {soldOut ? (
                        <Badge variant="destructive">Sold Out</Badge>
                      ) : (
                        `${available} left`
                      )}
                    </span>
                    {!soldOut && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQty(tier.id, -1)}
                          disabled={qty === 0}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center font-medium">{qty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQty(tier.id, 1)}
                          disabled={qty >= available || qty >= 10}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">R{total.toFixed(0)}</span>
              </div>
              <div className="space-y-2">
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={!hasSelection || purchasing !== null}
                  onClick={() => handlePurchase("stripe")}
                >
                  {purchasing === "stripe" ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Ticket className="w-5 h-5 mr-2" />
                  )}
                  {purchasing === "stripe" ? "Processing..." : "Pay with Card (Stripe)"}
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full"
                  disabled={!hasSelection || purchasing !== null}
                  onClick={() => handlePurchase("payfast")}
                >
                  {purchasing === "payfast" ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Ticket className="w-5 h-5 mr-2" />
                  )}
                  {purchasing === "payfast" ? "Processing..." : "Pay with EFT / Card (PayFast)"}
                </Button>
                <p className="text-xs text-center text-muted-foreground pt-1">
                  PayFast supports instant EFT from FNB, ABSA, Standard Bank, Nedbank, Capitec & more.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketPurchaseDialog;
