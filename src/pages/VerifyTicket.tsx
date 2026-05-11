import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera, Search, CheckCircle2, XCircle, AlertTriangle, Loader2,
  User, Ticket, Calendar, MapPin, CreditCard, ArrowLeft,
} from "lucide-react";

type Status = "valid" | "unpaid" | "checked_in" | "not_found" | "error";

interface VerifyResult {
  valid: boolean;
  status: Status;
  message: string;
  ticket?: {
    qr_code: string;
    attendee_name: string;
    attendee_email?: string;
    is_checked_in: boolean;
    checked_in_at?: string;
    tier: string;
    event: string;
    event_date?: string;
    venue?: string;
    payment_status: string;
    payment_provider: string;
    amount_paid: number;
    currency: string;
  };
}

const VerifyTicket = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [manualCode, setManualCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const verify = useCallback(async (qr_code: string) => {
    if (!qr_code.trim()) return;
    setVerifying(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("verify-ticket", {
      body: { qr_code: qr_code.trim() },
    });
    setVerifying(false);
    setManualCode("");
    if (error) {
      setResult({ valid: false, status: "error", message: error.message || "Verification failed" });
      return;
    }
    setResult(data as VerifyResult);
  }, []);

  const startScanner = async () => {
    setScannerActive(true);
    setResult(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          scanner.stop().then(() => {
            setScannerActive(false);
            verify(decoded);
          });
        },
        () => {},
      );
    } catch {
      toast.error("Camera access denied or not available");
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScannerActive(false);
  };

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h1 className="text-2xl font-bold">Admins only</h1>
        <p className="text-muted-foreground">You need admin access to verify tickets.</p>
        <Button onClick={() => navigate("/")}>Back home</Button>
      </div>
    );
  }

  const statusStyles = (s?: Status) => {
    switch (s) {
      case "valid":
        return { border: "border-green-500", bg: "bg-green-500/10", icon: <CheckCircle2 className="w-12 h-12 text-green-500" /> };
      case "checked_in":
        return { border: "border-yellow-500", bg: "bg-yellow-500/10", icon: <AlertTriangle className="w-12 h-12 text-yellow-500" /> };
      case "unpaid":
      case "not_found":
      case "error":
      default:
        return { border: "border-destructive", bg: "bg-destructive/10", icon: <XCircle className="w-12 h-12 text-destructive" /> };
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-display tracking-wide">VERIFY TICKET</h1>
            <p className="text-muted-foreground text-sm">Scan a QR code or enter a ticket code to confirm validity.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="w-5 h-5 text-primary" /> QR Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div id="qr-reader" className={`rounded-xl overflow-hidden mb-4 ${scannerActive ? "" : "hidden"}`} />
              {!scannerActive ? (
                <Button variant="hero" className="w-full" onClick={startScanner}>
                  <Camera className="w-4 h-4 mr-2" /> Start Camera
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={stopScanner}>Stop Scanner</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="w-5 h-5 text-primary" /> Manual Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="TKT-xxxxxxxx"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify(manualCode)}
              />
              <Button
                variant="hero"
                className="w-full"
                disabled={verifying || !manualCode.trim()}
                onClick={() => verify(manualCode)}
              >
                {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ticket className="w-4 h-4 mr-2" />}
                Verify Ticket
              </Button>
            </CardContent>
          </Card>
        </div>

        {result && (() => {
          const s = statusStyles(result.status);
          return (
            <Card className={`border-2 ${s.border} ${s.bg}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{s.icon}</div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <Badge variant={result.valid ? "default" : "destructive"} className="mb-2 uppercase">
                        {result.status.replace("_", " ")}
                      </Badge>
                      <h2 className="text-xl md:text-2xl font-bold">{result.message}</h2>
                    </div>

                    {result.ticket && (
                      <div className="grid sm:grid-cols-2 gap-3 text-sm pt-3 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{result.ticket.attendee_name || "—"}</div>
                            {result.ticket.attendee_email && (
                              <div className="text-xs text-muted-foreground">{result.ticket.attendee_email}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Ticket className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{result.ticket.event}</div>
                            <div className="text-xs text-muted-foreground">{result.ticket.tier}</div>
                          </div>
                        </div>
                        {result.ticket.event_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <span>{new Date(result.ticket.event_date).toLocaleString()}</span>
                          </div>
                        )}
                        {result.ticket.venue && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                            <span>{result.ticket.venue}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <CreditCard className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div>
                              {result.ticket.currency} {Number(result.ticket.amount_paid).toFixed(2)}{" "}
                              <Badge variant="outline" className="ml-1 text-xs">
                                {result.ticket.payment_status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              via {result.ticket.payment_provider}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground sm:col-span-2 pt-2 border-t border-border/30">
                          {result.ticket.qr_code}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
};

export default VerifyTicket;
