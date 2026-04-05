import { useEffect, useState, useCallback } from "react";
import { Calendar, MapPin, Ticket, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import TicketPurchaseDialog from "@/components/TicketPurchaseDialog";

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
}

interface LineupArtist {
  id: string;
  artist_name: string;
  set_time: string | null;
  stage: string | null;
  is_headliner: boolean | null;
  image_url: string | null;
}

const placeholderEvents: Event[] = [
  {
    id: "1",
    title: "Fact Lekompo Rocks 2026",
    description: "The biggest Lekompo festival in Limpopo! Join us for a night of incredible music, dance, and culture.",
    billboard_image_url: null,
    venue: "Peter Mokaba Stadium, Polokwane",
    event_date: new Date("2026-06-15").toISOString(),
    ticket_price: 250,
    ticket_url: "#",
    is_featured: true,
  },
  {
    id: "2",
    title: "Lekompo Balcony Mix Vol. 5",
    description: "An intimate balcony session featuring the hottest DJs in the game.",
    billboard_image_url: null,
    venue: "Exclusive Location, Johannesburg",
    event_date: new Date("2026-07-28").toISOString(),
    ticket_price: 150,
    ticket_url: "#",
    is_featured: false,
  },
  {
    id: "3",
    title: "Producer Showcase Night",
    description: "Discover the next generation of Lekompo producers in an exclusive industry event.",
    billboard_image_url: null,
    venue: "Music Factory, Pretoria",
    event_date: new Date("2026-08-14").toISOString(),
    ticket_price: 100,
    ticket_url: "#",
    is_featured: false,
  },
];

const EventBillboards = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [lineup, setLineup] = useState<LineupArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .eq("is_published", true)
        .order("event_date", { ascending: true })
        .limit(6);

      if (error || !data || data.length === 0) {
        setEvents(placeholderEvents);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  // Fetch lineup for current event
  useEffect(() => {
    if (events.length === 0) return;
    const currentEvent = events[currentSlide];
    if (!currentEvent || currentEvent.id.length < 10) { setLineup([]); return; } // skip placeholders

    const fetchLineup = async () => {
      const { data } = await supabase
        .from("event_lineup")
        .select("*")
        .eq("event_id", currentEvent.id)
        .order("position");
      setLineup(data || []);
    };
    fetchLineup();

    // Realtime lineup
    const channel = supabase
      .channel(`lineup-${currentEvent.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_lineup", filter: `event_id=eq.${currentEvent.id}` }, () => fetchLineup())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [events, currentSlide]);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      goToSlide("right");
    }, 6000);
    return () => clearInterval(timer);
  }, [events.length, currentSlide]);

  const goToSlide = useCallback((direction: "left" | "right") => {
    if (isAnimating || events.length <= 1) return;
    setIsAnimating(true);
    setSlideDirection(direction);
    setTimeout(() => {
      setCurrentSlide(prev =>
        direction === "right"
          ? (prev + 1) % events.length
          : (prev - 1 + events.length) % events.length
      );
      setTimeout(() => setIsAnimating(false), 500);
    }, 50);
  }, [isAnimating, events.length]);

  const event = events[currentSlide];
  if (!event) return null;

  return (
    <section id="billboards" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            What's Coming Up
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">
            EVENT <span className="text-gradient">BILLBOARDS</span>
          </h2>
        </div>

        {/* Slide Billboard */}
        <div className="relative rounded-3xl overflow-hidden mb-8 group">
          <div
            key={event.id}
            className={`transition-all duration-700 ease-in-out ${
              isAnimating
                ? slideDirection === "right"
                  ? "opacity-0 translate-x-8"
                  : "opacity-0 -translate-x-8"
                : "opacity-100 translate-x-0"
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[8s] group-hover:scale-105"
              style={{
                backgroundImage: event.billboard_image_url
                  ? `url(${event.billboard_image_url})`
                  : `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

            <div className="relative p-8 md:p-16 min-h-[400px] md:min-h-[500px] flex flex-col justify-end">
              {event.is_featured && (
                <span className="inline-block bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4 w-fit animate-fade-in">
                  FEATURED EVENT
                </span>
              )}
              <h3 className="font-display text-4xl md:text-6xl mb-4">{event.title}</h3>
              <p className="text-muted-foreground max-w-2xl mb-6 text-lg">{event.description}</p>

              <div className="flex flex-wrap gap-6 mb-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{format(new Date(event.event_date), "MMMM d, yyyy")}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{event.venue}</span>
                  </div>
                )}
                {event.ticket_price && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Ticket className="w-5 h-5 text-primary" />
                    <span>From R{event.ticket_price}</span>
                  </div>
                )}
              </div>

              {/* Live Lineup */}
              {lineup.length > 0 && (
                <div className="mb-8 animate-fade-in">
                  <h4 className="text-sm uppercase tracking-wider text-primary mb-3 font-medium">🎤 Lineup</h4>
                  <div className="flex flex-wrap gap-3">
                    {lineup.map(artist => (
                      <div
                        key={artist.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full border ${
                          artist.is_headliner
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-card/60 text-foreground"
                        }`}
                      >
                        {artist.image_url ? (
                          <img src={artist.image_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                        ) : null}
                        <span className="text-sm font-medium">{artist.artist_name}</span>
                        {artist.set_time && <span className="text-xs text-muted-foreground">• {artist.set_time}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={() => event.ticket_url && window.open(event.ticket_url, "_blank")}
                >
                  Get Tickets Now
                </Button>
                <Button variant="outline" size="xl">
                  Learn More
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {events.length > 1 && (
            <>
              <button
                onClick={() => goToSlide("left")}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/60 backdrop-blur text-foreground hover:bg-background/80 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => goToSlide("right")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/60 backdrop-blur text-foreground hover:bg-background/80 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Slide Indicators */}
          {events.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {events.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSlideDirection(i > currentSlide ? "right" : "left");
                    setCurrentSlide(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentSlide ? "w-8 bg-primary" : "w-3 bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventBillboards;
