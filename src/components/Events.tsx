import { Calendar, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import balconyMix from "@/assets/balcony-mix.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const events = [
  {
    id: 1,
    title: "FACT LEKOMPO ROCKS 2025",
    date: "March 15, 2025",
    time: "18:00",
    location: "Polokwane Stadium, Limpopo",
    image: heroBg,
    featured: true,
    price: "R250",
  },
  {
    id: 2,
    title: "Lekompo Balcony Mix Vol. 12",
    date: "February 28, 2025",
    time: "15:00",
    location: "Rooftop Sessions, Polokwane",
    image: balconyMix,
    featured: false,
    price: "R150",
  },
  {
    id: 3,
    title: "Underground Beat Battle",
    date: "February 14, 2025",
    time: "20:00",
    location: "The Base, Limpopo",
    image: balconyMix,
    featured: false,
    price: "R100",
  },
];

const Events = () => {
  return (
    <section id="events" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            What's Coming
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">
            UPCOMING <span className="text-gradient">EVENTS</span>
          </h2>
        </div>

        {/* Featured Event */}
        <div className="mb-12">
          {events
            .filter((e) => e.featured)
            .map((event) => (
              <Card
                key={event.id}
                className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-card to-card/50 group"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase rounded">
                        Main Event
                      </span>
                    </div>
                  </div>
                  <CardContent className="flex flex-col justify-center p-6 md:p-8">
                    <h3 className="font-display text-3xl md:text-4xl mb-4">
                      {event.title}
                    </h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="w-5 h-5 text-primary" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-display text-3xl text-primary">
                        {event.price}
                      </span>
                      <Button variant="hero" size="lg">
                        Get Tickets
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
        }
        </div>

        {/* Other Events Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {events
            .filter((e) => !e.featured)
            .map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="font-display text-2xl">{event.title}</span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-xl text-primary">
                        {event.price}
                      </span>
                      <Button variant="outline" size="sm" className="ml-2">
                        Buy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        }
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            View All Events
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Events;
