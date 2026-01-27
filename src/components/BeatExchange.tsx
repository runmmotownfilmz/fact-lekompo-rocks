import { Play, Download, Heart, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const beats = [
  {
    id: 1,
    title: "Limpopo Nights",
    producer: "DJ Maphorisa",
    bpm: 120,
    price: "R150",
    plays: "2.3K",
    downloads: 156,
  },
  {
    id: 2,
    title: "Township Groove",
    producer: "Master KG",
    bpm: 118,
    price: "R200",
    plays: "5.1K",
    downloads: 342,
  },
  {
    id: 3,
    title: "African Soul",
    producer: "Kabza De Small",
    bpm: 115,
    price: "R180",
    plays: "3.8K",
    downloads: 267,
  },
  {
    id: 4,
    title: "Midnight Drums",
    producer: "DJ Stokie",
    bpm: 122,
    price: "R120",
    plays: "1.9K",
    downloads: 98,
  },
];

const BeatExchange = () => {
  return (
    <section id="beats" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Producer Marketplace
          </span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">
            BEAT <span className="text-gradient">EXCHANGE</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Discover and download exclusive Lekompo beats from top producers. 
            Upload your own beats and join the community.
          </p>
        </div>

        {/* Beat Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {beats.map((beat) => (
            <Card
              key={beat.id}
              className="bg-card border-border/50 hover:border-primary/30 transition-all duration-300 group"
            >
              <CardContent className="p-5">
                {/* Waveform Placeholder */}
                <div className="relative h-24 bg-muted rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                  <div className="flex items-end gap-[2px] h-16">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary/50 rounded-full transition-all duration-300"
                        style={{
                          height: `${Math.random() * 100}%`,
                          opacity: 0.3 + Math.random() * 0.7,
                        }}
                      />
                    ))}
                  </div>
                  <button className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-1" />
                    </div>
                  </button>
                </div>

                {/* Beat Info */}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">{beat.title}</h3>
                  <p className="text-sm text-muted-foreground">{beat.producer}</p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>{beat.bpm} BPM</span>
                  <span>{beat.plays} plays</span>
                  <span>{beat.downloads} downloads</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl text-primary">
                    {beat.price}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="default" size="sm">
                      <Download className="w-4 h-4" />
                      Buy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload CTA */}
        <div className="text-center bg-gradient-to-r from-card via-card/50 to-card p-8 rounded-2xl border border-border/50">
          <Music2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="font-display text-2xl mb-2">Are You a Producer?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your Lekompo beats and music packs to reach thousands of artists and fans.
          </p>
          <Button variant="hero" size="lg">
            Start Selling Beats
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BeatExchange;
