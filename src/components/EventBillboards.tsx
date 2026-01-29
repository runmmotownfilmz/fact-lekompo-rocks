import { useEffect, useState } from "react";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string | null;
  billboard_image_url: string | null;
  venue: string | null;
  event_date: string;
  ticket_price: number | null;
  ticket_url: string | null;
  is_featured: boolean;
}

// Placeholder events for demo
const placeholderEvents: Event[] = [
  {
    id: "1",
    title: "Fact Lekompo Rocks 2026",
    description: "The biggest Lekompo festival in Limpopo! Join us for a night of incredible music, dance, and culture.",
    billboard_image_url: null,
    venue: "Peter Mokaba Stadium, Polokwane",
    event_date: new Date("2026-03-15").toISOString(),
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
    event_date: new Date("2026-02-28").toISOString(),
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
    event_date: new Date("2026-02-14").toISOString(),
    ticket_price: 100,
    ticket_url: "#",
    is_featured: false,
  },
];

const EventBillboards = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
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

  const featuredEvent = events.find((e) => e.is_featured) || events[0];
  const otherEvents = events.filter((e) => e.id !== featuredEvent?.id).slice(0, 2);

  return (
    <section id="billboards" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            What's Coming Up
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">
            EVENT <span className="text-gradient">BILLBOARDS</span>
          </h2>
        </div>

        {/* Featured Event Billboard */}
        {featuredEvent && (
          <div className="relative rounded-3xl overflow-hidden mb-8 group">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: featuredEvent.billboard_image_url 
                  ? `url(${featuredEvent.billboard_image_url})` 
                  : `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            <div className="relative p-8 md:p-16 min-h-[400px] md:min-h-[500px] flex flex-col justify-end">
              <span className="inline-block bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                FEATURED EVENT
              </span>
              <h3 className="font-display text-4xl md:text-6xl mb-4">
                {featuredEvent.title}
              </h3>
              <p className="text-muted-foreground max-w-2xl mb-6 text-lg">
                {featuredEvent.description}
              </p>
              
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{format(new Date(featuredEvent.event_date), "MMMM d, yyyy")}</span>
                </div>
                {featuredEvent.venue && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{featuredEvent.venue}</span>
                  </div>
                )}
                {featuredEvent.ticket_price && (
                  <div className="flex items-center gap-2 text-foreground">
                    <Ticket className="w-5 h-5 text-primary" />
                    <span>From R{featuredEvent.ticket_price}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="hero" size="xl">
                  Get Tickets Now
                </Button>
                <Button variant="outline" size="xl">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Other Events Grid */}
        {otherEvents.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {otherEvents.map((event) => (
              <div
                key={event.id}
                className="relative rounded-2xl overflow-hidden group cursor-pointer"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{
                    backgroundImage: event.billboard_image_url 
                      ? `url(${event.billboard_image_url})` 
                      : `linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--primary)) 100%)`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
                
                <div className="relative p-6 md:p-8 min-h-[300px] flex flex-col justify-end">
                  <h3 className="font-display text-2xl md:text-3xl mb-2">
                    {event.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(event.event_date), "MMM d, yyyy")}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                  </div>

                  <Button variant="gold" size="lg" className="w-fit">
                    <Ticket className="w-4 h-4 mr-2" />
                    {event.ticket_price ? `R${event.ticket_price}` : "Free Entry"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventBillboards;
