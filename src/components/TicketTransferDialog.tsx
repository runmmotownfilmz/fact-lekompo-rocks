import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Send } from "lucide-react";
import { z } from "zod";

interface Props {
  ticketId: string;
  ticketTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferred: () => void;
}

const emailSchema = z.string().trim().email().max(255);

const TicketTransferDialog = ({ ticketId, ticketTitle, open, onOpenChange, onTransferred }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);

  const handleSend = async () => {
    if (!user) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("ticket_transfers")
      .insert({ ticket_id: ticketId, from_user_id: user.id, to_email: parsed.data })
      .select("claim_token")
      .single();
    setLoading(false);
    if (error || !data) {
      toast({ title: "Transfer failed", description: error?.message, variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}/claim-ticket?token=${data.claim_token}`;
    setClaimUrl(url);
    toast({ title: "Transfer created", description: "Share the claim link with the recipient." });
    onTransferred();
  };

  const handleCopy = () => {
    if (claimUrl) {
      navigator.clipboard.writeText(claimUrl);
      toast({ title: "Link copied" });
    }
  };

  const handleClose = () => {
    setEmail("");
    setClaimUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Ticket</DialogTitle>
          <DialogDescription>Send "{ticketTitle}" to someone else.</DialogDescription>
        </DialogHeader>

        {!claimUrl ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <Button onClick={handleSend} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Create Transfer Link
            </Button>
            <p className="text-xs text-muted-foreground">
              Once claimed, this ticket will be removed from your account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with the recipient. They'll need to sign in to claim the ticket.
            </p>
            <div className="flex gap-2">
              <Input value={claimUrl} readOnly className="font-mono text-xs" />
              <Button onClick={handleCopy} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketTransferDialog;
