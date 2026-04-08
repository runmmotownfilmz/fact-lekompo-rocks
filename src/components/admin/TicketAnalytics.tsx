import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Ticket, UserCheck, TrendingUp, Loader2 } from "lucide-react";

interface TierStats {
  name: string;
  price: number;
  currency: string;
  quantity_sold: number;
  quantity_total: number;
  revenue: number;
}

interface EventAnalytics {
  event_id: string;
  event_title: string;
  event_date: string;
  tiers: TierStats[];
  total_revenue: number;
  total_sold: number;
  total_capacity: number;
  checked_in: number;
  total_tickets: number;
}

const TicketAnalytics = () => {
  const [analytics, setAnalytics] = useState<EventAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch all events, tiers, and tickets in parallel
    const [eventsRes, tiersRes, ticketsRes] = await Promise.all([
      supabase.from("events").select("id, title, event_date").order("event_date", { ascending: false }),
      supabase.from("ticket_tiers").select("*"),
      supabase.from("tickets").select("id, event_id, tier_id, is_checked_in"),
    ]);

    const events = eventsRes.data || [];
    const tiers = tiersRes.data || [];
    const tickets = ticketsRes.data || [];

    const result: EventAnalytics[] = events.map((event) => {
      const eventTiers = tiers.filter((t) => t.event_id === event.id);
      const eventTickets = tickets.filter((t) => t.event_id === event.id);

      const tierStats: TierStats[] = eventTiers.map((tier) => ({
        name: tier.name,
        price: tier.price,
        currency: tier.currency,
        quantity_sold: tier.quantity_sold,
        quantity_total: tier.quantity_total,
        revenue: tier.quantity_sold * tier.price,
      }));

      return {
        event_id: event.id,
        event_title: event.title,
        event_date: event.event_date,
        tiers: tierStats,
        total_revenue: tierStats.reduce((s, t) => s + t.revenue, 0),
        total_sold: tierStats.reduce((s, t) => s + t.quantity_sold, 0),
        total_capacity: tierStats.reduce((s, t) => s + t.quantity_total, 0),
        checked_in: eventTickets.filter((t) => t.is_checked_in).length,
        total_tickets: eventTickets.length,
      };
    });

    setAnalytics(result.filter((a) => a.tiers.length > 0));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No ticket sales data yet. Create ticket tiers for your events first.</p>
      </div>
    );
  }

  const grandRevenue = analytics.reduce((s, a) => s + a.total_revenue, 0);
  const grandSold = analytics.reduce((s, a) => s + a.total_sold, 0);
  const grandCheckedIn = analytics.reduce((s, a) => s + a.checked_in, 0);
  const grandTickets = analytics.reduce((s, a) => s + a.total_tickets, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Ticket Sales Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">R{grandRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tickets Sold</p>
              <p className="text-xl font-bold">{grandSold}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Checked In</p>
              <p className="text-xl font-bold">{grandCheckedIn}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-in Rate</p>
              <p className="text-xl font-bold">
                {grandTickets > 0 ? Math.round((grandCheckedIn / grandTickets) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Event Breakdown */}
      {analytics.map((event) => (
        <Card key={event.event_id} className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{event.event_title}</CardTitle>
              <Badge variant="outline">R{event.total_revenue.toLocaleString()} revenue</Badge>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{event.total_sold} sold</span>
              <span>•</span>
              <span>
                {event.total_tickets > 0
                  ? Math.round((event.checked_in / event.total_tickets) * 100)
                  : 0}% checked in
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="w-[120px]">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {event.tiers.map((tier) => {
                  const pct = tier.quantity_total > 0 ? (tier.quantity_sold / tier.quantity_total) * 100 : 0;
                  return (
                    <TableRow key={tier.name}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell>R{tier.price}</TableCell>
                      <TableCell>{tier.quantity_sold}</TableCell>
                      <TableCell>{tier.quantity_total}</TableCell>
                      <TableCell>R{tier.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{Math.round(pct)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TicketAnalytics;
