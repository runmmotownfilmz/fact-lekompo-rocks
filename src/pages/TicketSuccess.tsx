import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Ticket } from "lucide-react";

const TicketSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [ticketCount, setTicketCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    const sessionId = searchParams.get("session_id");

    if (!orderId || !sessionId) {
      setStatus("error");
      setErrorMsg("Invalid ticket confirmation link.");
      return;
    }

    if (!user) return;

    const verify = async () => {
      const { data, error } = await supabase.functions.invoke("verify-ticket-payment", {
        body: { order_id: orderId, session_id: sessionId },
      });

      if (error || data?.error) {
        setStatus("error");
        setErrorMsg(data?.error || "Failed to verify payment");
        return;
      }

      setStatus("success");
      setTicketCount(data.ticket_count || 0);
    };

    verify();
  }, [user, searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 flex justify-center">
        <div className="max-w-md w-full text-center">
          {status === "verifying" && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Verifying Your Payment...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your tickets.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold">Tickets Confirmed! 🎉</h2>
              <p className="text-muted-foreground">
                {ticketCount} ticket{ticketCount !== 1 ? "s" : ""} have been added to your account.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="hero" size="xl" onClick={() => navigate("/dashboard")}>
                  <Ticket className="w-5 h-5 mr-2" />
                  View My Tickets
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  Back to Home
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h2 className="text-3xl font-bold">Something Went Wrong</h2>
              <p className="text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketSuccess;
