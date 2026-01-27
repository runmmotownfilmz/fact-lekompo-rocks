import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import balconyMix from "@/assets/balcony-mix.jpg";
import podcast from "@/assets/podcast.jpg";
import beats from "@/assets/beats.jpg";

const articles = [
  {
    id: 1,
    title: "The Rise of Lekompo: From Limpopo to the World",
    excerpt: "Exploring how this unique genre is capturing hearts globally while staying true to its roots.",
    category: "Culture",
    image: balconyMix,
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Behind the Decks: Producer Spotlight",
    excerpt: "Meet the talented producers shaping the future of Lekompo music.",
    category: "Interviews",
    image: beats,
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "Fashion x Lekompo: The Style Revolution",
    excerpt: "How Lekompo culture is influencing streetwear and fashion in South Africa.",
    category: "Lifestyle",
    image: podcast,
    readTime: "4 min read",
  },
];

const Lifestyle = () => {
  return (
    <section id="lifestyle" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Stories & Culture
            </span>
            <h2 className="font-display text-5xl md:text-6xl mt-2">
              LEKOMPO <span className="text-gradient">LIFESTYLE</span>
            </h2>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            View All Articles
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <Card
              key={article.id}
              className="overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-medium rounded">
                    {article.category}
                  </span>
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {article.readTime}
                  </span>
                  <span className="text-primary text-sm font-medium group-hover:underline">
                    Read More →
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Lifestyle;
