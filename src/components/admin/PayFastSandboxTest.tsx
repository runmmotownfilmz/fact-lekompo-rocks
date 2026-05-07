import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FlaskConical, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Tier {
  id: string;
  name: string;
  price: number;
  event_id: string;
  events?: { title: string };
}

interface Step { step: string; ok: boolean; detail?: any }

const PayFastSandboxTest = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tierId, setTierId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; steps: Step[]; qr_code?: string; error?: string } | null>(null);

  useEffect(() => {
    supabase.from("ticket_tiers")
      .select("id, name, price, event_id, events:event_id(title)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTiers((data as any) || []));
  }, []);

  const run = async () => {
    if (!tierId) return toast.error("Pick a ticket tier first");
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    setRunning(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("test-payfast-flow", {
      body: { event_id: tier.event_id, tier_id: tier.id },
    });
    setRunning(false);
    if (error) {
      setResult({ success: false, steps: [], error: error.message });
      toast.error("Test failed: " + error.message);
      return;
    }
    setResult(data);
    if (data?.success) toast.success("PayFast sandbox flow passed ✅");
    else toast.error("Test failed: " + (data?.error || "unknown"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          PayFast Sandbox Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Simulates a complete PayFast checkout: creates a pending order, posts a signed ITN to the
          webhook, then verifies the order is marked paid and a ticket QR code is generated.
        </p>

        <div className="flex gap-2">
          <Select value={tierId} onValueChange={setTierId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a ticket tier to test" />
            </SelectTrigger>
            <SelectContent>
              {tiers.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.events?.title || "Event"} — {t.name} (R{t.price})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={run} disabled={running || !tierId}>
            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FlaskConical className="w-4 h-4 mr-2" />}
            Run Test
          </Button>
        </div>

        {result && (
          <div className="space-y-2 mt-4">
            <div className={`p-3 rounded-lg font-medium ${result.success ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
              {result.success ? "✅ All checks passed" : `❌ ${result.error}`}
            </div>
            <ul className="space-y-1 text-sm">
              {result.steps?.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  {s.ok ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5" />}
                  <div className="flex-1">
                    <div>{s.step}</div>
                    {s.detail && (
                      <pre className="text-xs text-muted-foreground bg-muted/50 p-1 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(s.detail, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {result.qr_code && (
              <div className="text-xs font-mono p-2 bg-muted rounded">QR: {result.qr_code}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayFastSandboxTest;
