import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, MapPin, Ticket } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

interface TicketData {
  id: string;
  qr_code: string;
  attendee_name: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  events: { title: string; event_date: string; venue: string | null } | null;
  ticket_tiers: { name: string; price: number } | null;
}

const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      const { data } = await supabase
        .from("tickets")
        .select(`
          id, qr_code, attendee_name, is_checked_in, checked_in_at, created_at,
          events(title, event_date, venue),
          ticket_tiers(name, price)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTickets((data as any) || []);
      setLoading(false);
    };
    fetchTickets();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No tickets yet. Browse events to purchase tickets!</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map(ticket => (
        <Card
          key={ticket.id}
          className={`bg-card border-border overflow-hidden ${
            ticket.is_checked_in ? "opacity-60" : ""
          }`}
        >
          <CardContent className="p-0">
            {/* Ticket header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {(ticket.events as any)?.title || "Event"}
                  </h4>
                  <Badge variant="outline" className="mt-1">
                    {(ticket.ticket_tiers as any)?.name || "General"}
                  </Badge>
                </div>
                {ticket.is_checked_in ? (
                  <Badge variant="secondary">Used</Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Valid
                  </Badge>
                )}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center py-6 bg-white">
              <QRCodeSVG
                value={ticket.qr_code}
                size={140}
                level="H"
                includeMargin
              />
            </div>

            {/* Details */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-mono text-center text-muted-foreground mb-3">
                {ticket.qr_code}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {(ticket.events as any)?.event_date
                    ? format(new Date((ticket.events as any).event_date), "MMM d, yyyy • HH:mm")
                    : "TBA"}
                </span>
              </div>
              {(ticket.events as any)?.venue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{(ticket.events as any).venue}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ticket className="w-4 h-4" />
                <span>R{(ticket.ticket_tiers as any)?.price?.toFixed(0) || 0}</span>
              </div>
              {ticket.is_checked_in && ticket.checked_in_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Checked in: {format(new Date(ticket.checked_in_at), "MMM d, yyyy HH:mm")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyTickets;
