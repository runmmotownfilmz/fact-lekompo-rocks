import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Ticket, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const ClaimTicket = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = params.get("token");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setMessage("Missing transfer token.");
      return;
    }
    if (!user) {
      navigate(`/auth?redirect=/claim-ticket?token=${token}`);
      return;
    }

    const claim = async () => {
      setStatus("loading");
      const { data, error } = await supabase.functions.invoke("claim-ticket-transfer", {
        body: { token },
      });
      if (error || data?.error) {
        setStatus("error");
        setMessage(data?.error || error?.message || "Failed to claim ticket");
      } else {
        setStatus("success");
        setMessage("Ticket transferred to your account!");
      }
    };
    claim();
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4 flex justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            {status === "loading" || status === "idle" ? (
              <>
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Claiming your ticket...</p>
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                <h2 className="text-2xl font-display">Ticket Claimed!</h2>
                <p className="text-muted-foreground">{message}</p>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  <Ticket className="w-4 h-4 mr-2" />
                  View My Tickets
                </Button>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 mx-auto text-destructive" />
                <h2 className="text-2xl font-display">Claim Failed</h2>
                <p className="text-muted-foreground">{message}</p>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                  Go Home
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClaimTicket;
