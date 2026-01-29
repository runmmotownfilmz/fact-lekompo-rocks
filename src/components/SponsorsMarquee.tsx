import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
}

// Placeholder sponsors
const placeholderSponsors: Sponsor[] = [
  { id: "1", name: "Castle Lager", logo_url: "/placeholder.svg" },
  { id: "2", name: "Vodacom", logo_url: "/placeholder.svg" },
  { id: "3", name: "MTN", logo_url: "/placeholder.svg" },
  { id: "4", name: "SABC", logo_url: "/placeholder.svg" },
  { id: "5", name: "YFM", logo_url: "/placeholder.svg" },
  { id: "6", name: "Limpopo Tourism", logo_url: "/placeholder.svg" },
];

const SponsorsMarquee = () => {
  const navigate = useNavigate();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    const fetchSponsors = async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("id, name, logo_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error || !data || data.length === 0) {
        setSponsors(placeholderSponsors);
      } else {
        setSponsors(data);
      }
    };

    fetchSponsors();
  }, []);

  // Duplicate sponsors for seamless loop
  const duplicatedSponsors = [...sponsors, ...sponsors];

  return (
    <section className="py-12 bg-card border-y border-border overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-muted-foreground">
            PROUDLY SUPPORTED BY
          </h3>
          <button
            onClick={() => navigate("/sponsors")}
            className="text-primary hover:underline text-sm font-medium"
          >
            View All Partners →
          </button>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative">
        <div className="flex animate-marquee">
          {duplicatedSponsors.map((sponsor, index) => (
            <div
              key={`${sponsor.id}-${index}`}
              className="flex-shrink-0 mx-8 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={sponsor.logo_url}
                alt={sponsor.name}
                className="h-12 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SponsorsMarquee;
