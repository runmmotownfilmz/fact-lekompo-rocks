import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Search, CheckCircle, XCircle, Loader2, User, Ticket } from "lucide-react";

interface ScanResult {
  valid: boolean;
  message: string;
  ticket?: {
    attendee_name: string;
    attendee_email?: string;
    tier: string;
    event: string;
    event_date?: string;
  };
}

const TicketCheckIn = () => {
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const handleCheckIn = useCallback(async (qrCode: string) => {
    if (!qrCode.trim()) return;
    setChecking(true);
    setResult(null);

    const { data, error } = await supabase.functions.invoke("check-in-ticket", {
      body: { qr_code: qrCode.trim() },
    });

    if (error) {
      setResult({ valid: false, message: "Failed to verify ticket" });
    } else if (data?.error) {
      setResult({ valid: false, message: data.error });
    } else {
      setResult(data);
    }
    setChecking(false);
    setManualCode("");
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
        (decodedText) => {
          scanner.stop().then(() => {
            setScannerActive(false);
            handleCheckIn(decodedText);
          });
        },
        () => {}
      );
    } catch (err) {
      toast.error("Camera access denied or not available");
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Scanner */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="w-5 h-5 text-primary" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="qr-reader"
              ref={videoRef}
              className={`rounded-xl overflow-hidden mb-4 ${scannerActive ? "" : "hidden"}`}
              style={{ width: "100%" }}
            />
            {!scannerActive ? (
              <Button variant="hero" className="w-full" onClick={startScanner}>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera Scanner
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={stopScanner}>
                Stop Scanner
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Manual entry */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5 text-primary" />
              Manual Check-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Enter ticket code (e.g. TKT-abc123...)"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCheckIn(manualCode)}
              />
              <Button
                variant="hero"
                className="w-full"
                onClick={() => handleCheckIn(manualCode)}
                disabled={checking || !manualCode.trim()}
              >
                {checking ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Ticket className="w-4 h-4 mr-2" />
                )}
                Verify & Check In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result */}
      {result && (
        <Card
          className={`border-2 ${
            result.valid
              ? "border-green-500 bg-green-500/5"
              : "border-destructive bg-destructive/5"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {result.valid ? (
                <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-10 h-10 text-destructive flex-shrink-0" />
              )}
              <div>
                <h3 className="text-xl font-bold mb-2">{result.message}</h3>
                {result.ticket && (
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{result.ticket.attendee_name}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">Event:</span>{" "}
                      {result.ticket.event}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Tier:</span>{" "}
                      <Badge variant="outline">{result.ticket.tier}</Badge>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketCheckIn;
