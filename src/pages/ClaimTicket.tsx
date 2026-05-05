import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, CheckCircle2, XCircle, Calendar, MapPin, Gift } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "@/components/Navbar";

interface TransferPreview {
  event_title: string;
  event_date: string | null;
  event_venue: string | null;
  tier_name: string;
  tier_price: number;
  from_name: string | null;
  status: string;
}

interface ClaimedTicket {
  id: string;
  qr_code: string;
  events: { title: string; event_date: string; venue: string | null } | null;
  ticket_tiers: { name: string; price: number } | null;
}

const ClaimTicket = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = params.get("token");

  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<ClaimedTicket | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Load transfer preview (works even if not signed in, since it's metadata only)
  useEffect(() => {
    if (!token) {
      setPreviewError("Missing transfer token.");
      setLoadingPreview(false);
      return;
    }
    const load = async () => {
      const { data, error } = await supabase
        .from("ticket_transfers")
        .select(`
          status,
          tickets(
            events(title, event_date, venue),
            ticket_tiers(name, price)
          ),
          profiles:from_user_id(display_name, username)
        `)
        .eq("claim_token", token)
        .maybeSingle();

      if (error || !data) {
        setPreviewError("Invalid or expired transfer link.");
      } else {
        const t: any = data;
        setPreview({
          status: t.status,
          event_title: t.tickets?.events?.title || "Event",
          event_date: t.tickets?.events?.event_date || null,
          event_venue: t.tickets?.events?.venue || null,
          tier_name: t.tickets?.ticket_tiers?.name || "General",
          tier_price: t.tickets?.ticket_tiers?.price || 0,
          from_name: t.profiles?.display_name || t.profiles?.username || null,
        });
      }
      setLoadingPreview(false);
    };
    load();
  }, [token]);

  const handleClaim = async () => {
    if (!user) {
      navigate(`/auth?redirect=/claim-ticket?token=${token}`);
      return;
    }
    setClaiming(true);
    setClaimError(null);
    const { data, error } = await supabase.functions.invoke("claim-ticket-transfer", {
      body: { token },
    });
    if (error || data?.error) {
      setClaimError(data?.error || error?.message || "Failed to claim ticket");
      setClaiming(false);
      return;
    }
    // Fetch the claimed ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select(`id, qr_code, events(title, event_date, venue), ticket_tiers(name, price)`)
      .eq("id", data.ticket_id)
      .maybeSingle();
    setClaimed(ticket as any);
    setClaiming(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4 flex justify-center">
        <Card className="max-w-md w-full bg-card border-border">
          <CardContent className="p-8 space-y-5">
            {loadingPreview || authLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
              </div>
            ) : previewError ? (
              <div className="text-center space-y-3">
                <XCircle className="w-12 h-12 mx-auto text-destructive" />
                <h2 className="text-2xl font-display">Invalid Link</h2>
                <p className="text-muted-foreground">{previewError}</p>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">Go Home</Button>
              </div>
            ) : claimed ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                <h2 className="text-2xl font-display">Ticket Claimed!</h2>
                <p className="text-muted-foreground text-sm">
                  This ticket is now in your account. Show the QR at the door.
                </p>

                <div className="rounded-lg overflow-hidden border border-border">
                  <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 text-left">
                    <h3 className="font-semibold">{claimed.events?.title}</h3>
                    <Badge variant="outline" className="mt-1">{claimed.ticket_tiers?.name}</Badge>
                  </div>
                  <div className="bg-white py-5 flex justify-center">
                    <QRCodeSVG value={claimed.qr_code} size={140} level="H" includeMargin />
                  </div>
                  <div className="p-4 space-y-2 text-left text-sm text-muted-foreground">
                    {claimed.events?.event_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(claimed.events.event_date), "MMM d, yyyy • HH:mm")}
                      </div>
                    )}
                    {claimed.events?.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {claimed.events.venue}
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  <Ticket className="w-4 h-4 mr-2" /> View My Tickets
                </Button>
              </div>
            ) : preview && preview.status !== "pending" ? (
              <div className="text-center space-y-3">
                <XCircle className="w-12 h-12 mx-auto text-destructive" />
                <h2 className="text-2xl font-display capitalize">Already {preview.status}</h2>
                <p className="text-muted-foreground">This transfer link is no longer valid.</p>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">Go Home</Button>
              </div>
            ) : preview ? (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Gift className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display">You've got a ticket!</h2>
                  <p className="text-sm text-muted-foreground">
                    {preview.from_name ? <><span className="text-foreground font-medium">{preview.from_name}</span> sent you</> : "Someone sent you"} a ticket. Confirm to claim it.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{preview.event_title}</h3>
                    <Badge variant="outline">{preview.tier_name}</Badge>
                  </div>
                  {preview.event_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(preview.event_date), "MMM d, yyyy • HH:mm")}
                    </div>
                  )}
                  {preview.event_venue && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {preview.event_venue}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ticket className="w-4 h-4" />
                    R{Number(preview.tier_price).toFixed(0)}
                  </div>
                </div>

                {claimError && (
                  <p className="text-sm text-destructive text-center">{claimError}</p>
                )}

                <Button onClick={handleClaim} disabled={claiming} className="w-full" size="lg">
                  {claiming ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
                  ) : !user ? (
                    "Sign in to Claim"
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Claim This Ticket</>
                  )}
                </Button>
                {user && (
                  <p className="text-xs text-center text-muted-foreground">
                    Claiming as <span className="text-foreground">{user.email}</span>
                  </p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClaimTicket;
