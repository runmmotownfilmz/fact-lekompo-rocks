import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Activity, Loader2, RadioTower } from "lucide-react";

interface EventOpt { id: string; title: string; event_date: string; }
interface Counts { valid: number; checked_in: number; unpaid: number; not_found: number; error: number; total: number; }
const ZERO: Counts = { valid: 0, checked_in: 0, unpaid: 0, not_found: 0, error: 0, total: 0 };

const ScanStatsWidget = () => {
  const [events, setEvents] = useState<EventOpt[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [counts, setCounts] = useState<Counts>(ZERO);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  // Load events + pick the current/next one as default
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date")
        .order("event_date", { ascending: true });
      const list = (data || []) as EventOpt[];
      setEvents(list);
      if (list.length && !eventId) {
        const now = Date.now();
        const upcoming = list.find(e => new Date(e.event_date).getTime() >= now - 24 * 3600 * 1000);
        setEventId((upcoming || list[list.length - 1]).id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCounts = useCallback(async (evId: string) => {
    if (!evId) return;
    setLoading(true);

    // Get all ticket ids for this event
    const { data: ticketIds } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", evId);
    const ids = (ticketIds || []).map(t => t.id);
    if (ids.length === 0) {
      setCounts(ZERO);
      setLoading(false);
      return;
    }

    // Fetch scan_logs for those tickets + any not_found scans (no ticket) recently
    const { data: logs } = await supabase
      .from("scan_logs")
      .select("status, ticket_id")
      .in("ticket_id", ids);

    const c: Counts = { ...ZERO };
    (logs || []).forEach((l: any) => {
      const k = (l.status as keyof Counts) in c ? (l.status as keyof Counts) : "error";
      c[k] = (c[k] || 0) + 1;
      c.total += 1;
    });
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => { if (eventId) fetchCounts(eventId); }, [eventId, fetchCounts]);

  // Realtime subscription on scan_logs
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`scan_logs_${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scan_logs" },
        () => fetchCounts(eventId),
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [eventId, fetchCounts]);

  const tiles = [
    { key: "valid", label: "Valid", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10 border-green-500/30" },
    { key: "checked_in", label: "Already Checked-In", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
    { key: "unpaid", label: "Unpaid", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
    { key: "not_found", label: "Not Found", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  ] as const;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-primary" /> Live Scan Stats
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time counts of QR verification attempts for the selected event.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5">
            <RadioTower className={`w-3 h-3 ${live ? "text-green-500 animate-pulse" : "text-muted-foreground"}`} />
            {live ? "Live" : "Connecting…"}
          </Badge>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} — {new Date(e.event_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tiles.map(t => {
                const Icon = t.icon;
                const value = counts[t.key as keyof Counts] || 0;
                return (
                  <div key={t.key} className={`rounded-xl border p-4 ${t.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{t.label}</span>
                      <Icon className={`w-4 h-4 ${t.color}`} />
                    </div>
                    <div className={`text-3xl font-bold ${t.color}`}>{value}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Total scans</span>
              <span className="font-semibold text-foreground">{counts.total}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ScanStatsWidget;
