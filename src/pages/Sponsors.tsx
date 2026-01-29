import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: string;
}

// Placeholder sponsors for demo
const placeholderSponsors: Sponsor[] = [
  { id: "1", name: "Castle Lager", logo_url: "/placeholder.svg", website_url: "#", tier: "platinum" },
  { id: "2", name: "Vodacom", logo_url: "/placeholder.svg", website_url: "#", tier: "platinum" },
  { id: "3", name: "MTN", logo_url: "/placeholder.svg", website_url: "#", tier: "gold" },
  { id: "4", name: "SABC", logo_url: "/placeholder.svg", website_url: "#", tier: "gold" },
  { id: "5", name: "Soweto TV", logo_url: "/placeholder.svg", website_url: "#", tier: "silver" },
  { id: "6", name: "YFM", logo_url: "/placeholder.svg", website_url: "#", tier: "silver" },
  { id: "7", name: "Limpopo Tourism", logo_url: "/placeholder.svg", website_url: "#", tier: "partner" },
  { id: "8", name: "SA Music Awards", logo_url: "/placeholder.svg", website_url: "#", tier: "partner" },
];

const tierConfig = {
  platinum: { label: "Platinum Partners", gridCols: "grid-cols-2 md:grid-cols-2", size: "h-32" },
  gold: { label: "Gold Sponsors", gridCols: "grid-cols-2 md:grid-cols-3", size: "h-24" },
  silver: { label: "Silver Sponsors", gridCols: "grid-cols-3 md:grid-cols-4", size: "h-20" },
  partner: { label: "Official Partners", gridCols: "grid-cols-3 md:grid-cols-5", size: "h-16" },
};

const Sponsors = () => {
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSponsors = async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .order("display_order", { ascending: true });

      if (error || !data || data.length === 0) {
        // Use placeholder data if no sponsors in DB
        setSponsors(placeholderSponsors);
      } else {
        setSponsors(data);
      }
      setLoading(false);
    };

    fetchSponsors();
  }, []);

  const groupedSponsors = sponsors.reduce((acc, sponsor) => {
    const tier = sponsor.tier as keyof typeof tierConfig;
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background py-20 px-4">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center">
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Our Supporters
            </span>
            <h1 className="font-display text-5xl md:text-7xl mt-2">
              SPONSORS & <span className="text-gradient">PARTNERS</span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              We're grateful to our amazing sponsors and partners who make Fact Lekompo Rocks possible. 
              Together, we're celebrating and elevating Lekompo culture.
            </p>
          </div>
        </div>
      </div>

      {/* Sponsors Grid */}
      <div className="container mx-auto px-4 py-16 space-y-20">
        {(["platinum", "gold", "silver", "partner"] as const).map((tier) => {
          const config = tierConfig[tier];
          const tierSponsors = groupedSponsors[tier] || [];
          
          if (tierSponsors.length === 0) return null;

          return (
            <section key={tier}>
              <h2 className="font-display text-3xl text-center mb-8">
                {config.label}
              </h2>
              <div className={`grid ${config.gridCols} gap-6`}>
                {tierSponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.website_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-card border border-border rounded-xl p-6 flex items-center justify-center hover:border-primary/50 transition-all duration-300 hover:scale-105"
                  >
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className={`${config.size} w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center pb-4">
                      <span className="text-foreground font-medium flex items-center gap-2">
                        {sponsor.name}
                        <ExternalLink className="w-4 h-4" />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Become a Sponsor CTA */}
      <div className="bg-card border-y border-border py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            BECOME A <span className="text-gradient">PARTNER</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Join us in promoting Lekompo culture and reach thousands of passionate music lovers across South Africa and beyond.
          </p>
          <Button variant="hero" size="xl">
            Partner With Us
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sponsors;
