import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Plus, Pencil, Trash2, Calendar, MapPin, Ticket,
  Star, Users, Music, Eye, EyeOff, Loader2, Shield, Upload, X, BarChart3
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import TicketTierManager from "@/components/admin/TicketTierManager";
import TicketCheckIn from "@/components/admin/TicketCheckIn";
import TicketAnalytics from "@/components/admin/TicketAnalytics";

interface Event {
  id: string;
  title: string;
  description: string | null;
  billboard_image_url: string | null;
  venue: string | null;
  event_date: string;
  ticket_price: number | null;
  ticket_url: string | null;
  is_featured: boolean | null;
  is_published: boolean | null;
}

interface LineupArtist {
  id: string;
  event_id: string;
  artist_name: string;
  set_time: string | null;
  stage: string | null;
  position: number;
  image_url: string | null;
  is_headliner: boolean | null;
}

const emptyEvent = {
  title: "",
  description: "",
  billboard_image_url: "",
  venue: "",
  event_date: "",
  ticket_price: "",
  ticket_url: "",
  is_featured: false,
  is_published: true,
};

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [lineup, setLineup] = useState<LineupArtist[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [lineupForm, setLineupForm] = useState({ artist_name: "", set_time: "", stage: "", is_headliner: false, image_url: "" });
  const [lineupDialogOpen, setLineupDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkArtists, setBulkArtists] = useState<{ file: File; name: string; stage: string; set_time: string; is_headliner: boolean; previewUrl: string }[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) navigate("/auth");
      else if (!isAdmin) navigate("/");
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) fetchLineup(selectedEventId);
  }, [selectedEventId]);

  // Realtime lineup updates
  useEffect(() => {
    if (!selectedEventId) return;
    const channel = supabase
      .channel("admin-lineup")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_lineup", filter: `event_id=eq.${selectedEventId}` }, () => {
        fetchLineup(selectedEventId);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedEventId]);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (data) setEvents(data);
    if (data && data.length > 0 && !selectedEventId) setSelectedEventId(data[0].id);
  };

  const fetchLineup = async (eventId: string) => {
    const { data } = await supabase.from("event_lineup").select("*").eq("event_id", eventId).order("position");
    if (data) setLineup(data);
  };

  const handleSaveEvent = async () => {
    setSaving(true);
    const payload = {
      title: eventForm.title,
      description: eventForm.description || null,
      billboard_image_url: eventForm.billboard_image_url || null,
      venue: eventForm.venue || null,
      event_date: new Date(eventForm.event_date).toISOString(),
      ticket_price: eventForm.ticket_price ? Number(eventForm.ticket_price) : null,
      ticket_url: eventForm.ticket_url || null,
      is_featured: eventForm.is_featured,
      is_published: eventForm.is_published,
    };

    if (editingEvent) {
      const { error } = await supabase.from("events").update(payload).eq("id", editingEvent);
      if (error) toast.error("Failed to update event");
      else toast.success("Event updated!");
    } else {
      const { error } = await supabase.from("events").insert(payload);
      if (error) toast.error("Failed to create event");
      else toast.success("Event created!");
    }

    setSaving(false);
    setEventDialogOpen(false);
    setEditingEvent(null);
    setEventForm(emptyEvent);
    fetchEvents();
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event.id);
    setEventForm({
      title: event.title,
      description: event.description || "",
      billboard_image_url: event.billboard_image_url || "",
      venue: event.venue || "",
      event_date: event.event_date ? format(new Date(event.event_date), "yyyy-MM-dd'T'HH:mm") : "",
      ticket_price: event.ticket_price?.toString() || "",
      ticket_url: event.ticket_url || "",
      is_featured: event.is_featured || false,
      is_published: event.is_published !== false,
    });
    setEventDialogOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Event deleted"); fetchEvents(); }
  };

  const handleTogglePublish = async (event: Event) => {
    const { error } = await supabase.from("events").update({ is_published: !event.is_published }).eq("id", event.id);
    if (error) toast.error("Failed to update");
    else fetchEvents();
  };

  const handleToggleFeatured = async (event: Event) => {
    const { error } = await supabase.from("events").update({ is_featured: !event.is_featured }).eq("id", event.id);
    if (error) toast.error("Failed to update");
    else fetchEvents();
  };

  const handleAddLineup = async () => {
    if (!selectedEventId || !lineupForm.artist_name) return;
    setSaving(true);
    const { error } = await supabase.from("event_lineup").insert({
      event_id: selectedEventId,
      artist_name: lineupForm.artist_name,
      set_time: lineupForm.set_time || null,
      stage: lineupForm.stage || null,
      is_headliner: lineupForm.is_headliner,
      image_url: lineupForm.image_url || null,
      position: lineup.length,
    });
    if (error) toast.error("Failed to add artist");
    else {
      toast.success("Artist added to lineup!");
      setLineupForm({ artist_name: "", set_time: "", stage: "", is_headliner: false, image_url: "" });
      setLineupDialogOpen(false);
    }
    setSaving(false);
  };

  const handleRemoveLineup = async (id: string) => {
    const { error } = await supabase.from("event_lineup").delete().eq("id", id);
    if (error) toast.error("Failed to remove");
    else fetchLineup(selectedEventId!);
  };

  const handleBulkFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const artists = files
      .filter(f => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024)
      .map(file => ({
        file,
        name: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        stage: "Main Stage",
        set_time: "",
        is_headliner: false,
        previewUrl: URL.createObjectURL(file),
      }));
    if (artists.length === 0) {
      toast.error("No valid images selected (max 5MB each)");
      return;
    }
    setBulkArtists(artists);
    setBulkDialogOpen(true);
  };

  const handleBulkUpload = async () => {
    if (!selectedEventId || bulkArtists.length === 0) return;
    setBulkUploading(true);

    const inserts = [];
    for (let i = 0; i < bulkArtists.length; i++) {
      const artist = bulkArtists[i];
      const ext = artist.file.name.split(".").pop();
      const path = `admin/artists/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("uploads").upload(path, artist.file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        toast.error(`Failed to upload ${artist.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      inserts.push({
        event_id: selectedEventId,
        artist_name: artist.name,
        set_time: artist.set_time || null,
        stage: artist.stage || null,
        is_headliner: artist.is_headliner,
        image_url: urlData.publicUrl,
        position: lineup.length + i,
      });
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from("event_lineup").insert(inserts);
      if (error) toast.error("Failed to add artists");
      else toast.success(`${inserts.length} artist(s) added to lineup!`);
    }

    bulkArtists.forEach(a => URL.revokeObjectURL(a.previewUrl));
    setBulkArtists([]);
    setBulkDialogOpen(false);
    setBulkUploading(false);
  };

  const bulkFileRef = useRef<HTMLInputElement>(null);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="font-display text-4xl md:text-5xl">
            ADMIN <span className="text-gradient">DASHBOARD</span>
          </h1>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-card">
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="lineup">
              <Users className="w-4 h-4 mr-2" />
              Lineup
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <Ticket className="w-4 h-4 mr-2" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="checkin">
              <Shield className="w-4 h-4 mr-2" />
              Check-In
            </TabsTrigger>
              <Shield className="w-4 h-4 mr-2" />
              Check-In
            </TabsTrigger>
          </TabsList>

          {/* EVENTS TAB */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Manage Events</h2>
              <Dialog open={eventDialogOpen} onOpenChange={(open) => { setEventDialogOpen(open); if (!open) { setEditingEvent(null); setEventForm(emptyEvent); } }}>
                <DialogTrigger asChild>
                  <Button variant="hero">
                    <Plus className="w-4 h-4 mr-2" />
                    New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Event Title *</Label>
                      <Input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} placeholder="Fact Lekompo Rocks 2026" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                    </div>
                    <div>
                      <Label>Date & Time *</Label>
                      <Input type="datetime-local" value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Venue</Label>
                      <Input value={eventForm.venue} onChange={e => setEventForm(f => ({ ...f, venue: e.target.value }))} placeholder="Peter Mokaba Stadium" />
                    </div>
                    <ImageUpload
                      value={eventForm.billboard_image_url}
                      onChange={(url) => setEventForm(f => ({ ...f, billboard_image_url: url }))}
                      label="Billboard Image"
                      folder="admin/events"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ticket Price (R)</Label>
                        <Input type="number" value={eventForm.ticket_price} onChange={e => setEventForm(f => ({ ...f, ticket_price: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Ticket URL</Label>
                        <Input value={eventForm.ticket_url} onChange={e => setEventForm(f => ({ ...f, ticket_url: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={eventForm.is_featured} onCheckedChange={v => setEventForm(f => ({ ...f, is_featured: v }))} />
                        <Label>Featured</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={eventForm.is_published} onCheckedChange={v => setEventForm(f => ({ ...f, is_published: v }))} />
                        <Label>Published</Label>
                      </div>
                    </div>
                    <Button onClick={handleSaveEvent} disabled={saving || !eventForm.title || !eventForm.event_date} className="w-full" variant="hero">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {editingEvent ? "Update Event" : "Create Event"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map(event => (
                      <TableRow key={event.id} className={selectedEventId === event.id ? "bg-primary/5" : ""}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{format(new Date(event.event_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{event.venue || "—"}</TableCell>
                        <TableCell>{event.ticket_price ? `R${event.ticket_price}` : "Free"}</TableCell>
                        <TableCell>
                          <button onClick={() => handleTogglePublish(event)}>
                            <Badge variant={event.is_published ? "default" : "secondary"} className="cursor-pointer">
                              {event.is_published ? <><Eye className="w-3 h-3 mr-1" /> Live</> : <><EyeOff className="w-3 h-3 mr-1" /> Draft</>}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => handleToggleFeatured(event)}>
                            <Star className={`w-5 h-5 cursor-pointer ${event.is_featured ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setSelectedEventId(event.id); }}>
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleEditEvent(event)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No events yet. Create your first event!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LINEUP TAB */}
          <TabsContent value="lineup" className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Event Lineup</h2>
                {selectedEvent && (
                  <p className="text-muted-foreground">
                    Managing lineup for: <span className="text-primary font-medium">{selectedEvent.title}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <select
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  value={selectedEventId || ""}
                  onChange={e => setSelectedEventId(e.target.value)}
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
                <Dialog open={lineupDialogOpen} onOpenChange={setLineupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" disabled={!selectedEventId}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Artist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Artist to Lineup</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Artist Name *</Label>
                        <Input value={lineupForm.artist_name} onChange={e => setLineupForm(f => ({ ...f, artist_name: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Set Time</Label>
                          <Input value={lineupForm.set_time} onChange={e => setLineupForm(f => ({ ...f, set_time: e.target.value }))} placeholder="20:00" />
                        </div>
                        <div>
                          <Label>Stage</Label>
                          <Input value={lineupForm.stage} onChange={e => setLineupForm(f => ({ ...f, stage: e.target.value }))} placeholder="Main Stage" />
                        </div>
                      </div>
                    <ImageUpload
                      value={lineupForm.image_url}
                      onChange={(url) => setLineupForm(f => ({ ...f, image_url: url }))}
                      label="Artist Photo"
                      folder="admin/artists"
                    />
                      <div className="flex items-center gap-2">
                        <Switch checked={lineupForm.is_headliner} onCheckedChange={v => setLineupForm(f => ({ ...f, is_headliner: v }))} />
                        <Label>Headliner</Label>
                      </div>
                      <Button onClick={handleAddLineup} disabled={saving || !lineupForm.artist_name} className="w-full" variant="hero">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Music className="w-4 h-4 mr-2" />}
                        Add to Lineup
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  disabled={!selectedEventId}
                  onClick={() => bulkFileRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <input
                  ref={bulkFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkFilesSelected}
                  className="hidden"
                />

                {/* Bulk Upload Dialog */}
                <Dialog open={bulkDialogOpen} onOpenChange={(open) => {
                  setBulkDialogOpen(open);
                  if (!open) {
                    bulkArtists.forEach(a => URL.revokeObjectURL(a.previewUrl));
                    setBulkArtists([]);
                  }
                }}>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Bulk Add Artists ({bulkArtists.length} photos)</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Artist names are auto-detected from filenames. Edit details below before uploading.
                    </p>
                    <div className="space-y-4 mt-4">
                      {bulkArtists.map((artist, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                          <img src={artist.previewUrl} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Input
                              value={artist.name}
                              onChange={e => {
                                const updated = [...bulkArtists];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setBulkArtists(updated);
                              }}
                              placeholder="Artist Name"
                              className="font-medium"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={artist.set_time}
                                onChange={e => {
                                  const updated = [...bulkArtists];
                                  updated[idx] = { ...updated[idx], set_time: e.target.value };
                                  setBulkArtists(updated);
                                }}
                                placeholder="Set time (e.g. 20:00)"
                              />
                              <Input
                                value={artist.stage}
                                onChange={e => {
                                  const updated = [...bulkArtists];
                                  updated[idx] = { ...updated[idx], stage: e.target.value };
                                  setBulkArtists(updated);
                                }}
                                placeholder="Stage"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={artist.is_headliner}
                                  onCheckedChange={v => {
                                    const updated = [...bulkArtists];
                                    updated[idx] = { ...updated[idx], is_headliner: v };
                                    setBulkArtists(updated);
                                  }}
                                />
                                <Label className="text-sm">Headliner</Label>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => {
                                  URL.revokeObjectURL(artist.previewUrl);
                                  setBulkArtists(prev => prev.filter((_, i) => i !== idx));
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={handleBulkUpload}
                        disabled={bulkUploading || bulkArtists.length === 0}
                        className="w-full"
                        variant="hero"
                      >
                        {bulkUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload & Add {bulkArtists.length} Artist{bulkArtists.length !== 1 ? "s" : ""}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lineup.map(artist => (
                <Card key={artist.id} className="bg-card border-border relative group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {artist.image_url ? (
                        <img src={artist.image_url} alt={artist.artist_name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          {artist.artist_name}
                          {artist.is_headliner && <Star className="w-4 h-4 text-accent fill-accent" />}
                        </h4>
                        <div className="text-sm text-muted-foreground flex gap-3">
                          {artist.set_time && <span>🕐 {artist.set_time}</span>}
                          {artist.stage && <span>🎤 {artist.stage}</span>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleRemoveLineup(artist.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {lineup.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No artists in the lineup yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TICKETS TAB */}
          <TabsContent value="tickets" className="space-y-6">
            {selectedEvent ? (
              <TicketTierManager eventId={selectedEvent.id} eventTitle={selectedEvent.title} />
            ) : (
              <p className="text-center py-8 text-muted-foreground">Select an event first to manage ticket tiers.</p>
            )}
            {events.length > 1 && (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Event:</span>
                <select
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  value={selectedEventId || ""}
                  onChange={e => setSelectedEventId(e.target.value)}
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>
            )}
          </TabsContent>

          {/* CHECK-IN TAB */}
          <TabsContent value="checkin" className="space-y-6">
            <TicketCheckIn />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
