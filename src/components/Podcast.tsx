import { Play, Headphones, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import podcastImg from "@/assets/podcast.jpg";

const episodes = [
  {
    id: 1,
    title: "EP 45: The Future of Lekompo Music",
    guest: "DJ Maphorisa",
    duration: "1h 23min",
    date: "Feb 10, 2025",
    description: "We dive deep into where Lekompo is heading and its global influence.",
  },
  {
    id: 2,
    title: "EP 44: Building a Music Brand",
    guest: "Kabza De Small",
    duration: "58min",
    date: "Feb 3, 2025",
    description: "Tips and insights on building your personal brand in the music industry.",
  },
  {
    id: 3,
    title: "EP 43: From Township to Worldwide",
    guest: "Master KG",
    duration: "1h 12min",
    date: "Jan 27, 2025",
    description: "How South African sounds are conquering the global music scene.",
  },
];

const Podcast = () => {
  return (
    <section id="podcast" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Listen & Learn
            </span>
            <h2 className="font-display text-5xl md:text-6xl mt-2 mb-6">
              THE LEKOMPO <span className="text-gradient">PODCAST</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join us every week as we explore the stories, sounds, and culture of 
              Lekompo music. Featuring interviews with top artists, producers, and 
              cultural figures from Limpopo and beyond.
            </p>

            {/* Podcast Image */}
            <div className="relative rounded-2xl overflow-hidden mb-8 group">
              <img
                src={podcastImg}
                alt="Lekompo Podcast Studio"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Now Playing</p>
                  <p className="font-semibold">EP 45: The Future of Lekompo</p>
                </div>
                <button className="w-14 h-14 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-primary-foreground ml-1" />
                </button>
              </div>
            </div>

            {/* Subscribe CTA */}
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg">
                <Headphones className="w-5 h-5" />
                Subscribe Now
              </Button>
              <Button variant="outline" size="lg">
                All Episodes
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right Content - Episodes List */}
          <div className="space-y-4">
            <h3 className="font-display text-2xl mb-6">Latest Episodes</h3>
            {episodes.map((episode) => (
              <Card
                key={episode.id}
                className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Play Button */}
                    <button className="w-12 h-12 shrink-0 rounded-full bg-muted group-hover:bg-primary transition-colors flex items-center justify-center">
                      <Play className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground ml-0.5" />
                    </button>

                    {/* Episode Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {episode.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {episode.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {episode.duration}
                        </span>
                        <span>{episode.date}</span>
                        <span className="text-primary">ft. {episode.guest}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Podcast;
