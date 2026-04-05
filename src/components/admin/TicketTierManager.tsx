import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Ticket } from "lucide-react";

interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  quantity_total: number;
  quantity_sold: number;
  sort_order: number;
}

interface Props {
  eventId: string;
  eventTitle: string;
}

const emptyTier = {
  name: "",
  description: "",
  price: "",
  quantity_total: "100",
  sort_order: "0",
};

const TicketTierManager = ({ eventId, eventTitle }: Props) => {
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [form, setForm] = useState(emptyTier);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTiers = async () => {
    const { data } = await supabase
      .from("ticket_tiers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order");
    setTiers(data || []);
  };

  useEffect(() => {
    fetchTiers();
  }, [eventId]);

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);

    const payload = {
      event_id: eventId,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      quantity_total: Number(form.quantity_total) || 100,
      sort_order: Number(form.sort_order) || 0,
    };

    if (editingId) {
      const { error } = await supabase.from("ticket_tiers").update(payload).eq("id", editingId);
      if (error) toast.error("Failed to update tier");
      else toast.success("Tier updated!");
    } else {
      const { error } = await supabase.from("ticket_tiers").insert(payload);
      if (error) toast.error("Failed to create tier");
      else toast.success("Tier created!");
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyTier);
    fetchTiers();
  };

  const handleEdit = (tier: TicketTier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name,
      description: tier.description || "",
      price: tier.price.toString(),
      quantity_total: tier.quantity_total.toString(),
      sort_order: tier.sort_order.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ticket tier?")) return;
    const { error } = await supabase.from("ticket_tiers").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Tier deleted"); fetchTiers(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            Ticket Tiers
          </h3>
          <p className="text-sm text-muted-foreground">for {eventTitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingId(null); setForm(emptyTier); }
        }}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Tier" : "New Ticket Tier"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Tier Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. General, VIP, VVIP" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="What's included..." />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price (R) *</Label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <Label>Total Qty</Label>
                  <Input type="number" value={form.quantity_total} onChange={e => setForm(f => ({ ...f, quantity_total: e.target.value }))} />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.price} className="w-full" variant="hero">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? "Update Tier" : "Create Tier"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tiers.length === 0 ? (
        <p className="text-center py-6 text-muted-foreground text-sm">
          No ticket tiers yet. Add tiers to enable ticket sales for this event.
        </p>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Sold / Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map(tier => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <span className="font-medium">{tier.name}</span>
                      {tier.description && (
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">R{tier.price.toFixed(0)}</TableCell>
                    <TableCell>
                      <Badge variant={tier.quantity_sold >= tier.quantity_total ? "destructive" : "outline"}>
                        {tier.quantity_sold} / {tier.quantity_total}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(tier)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(tier.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TicketTierManager;
