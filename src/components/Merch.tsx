import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import merchImg from "@/assets/merch.jpg";

const products = [
  {
    id: 1,
    name: "FACT Logo Tee",
    price: "R350",
    originalPrice: "R450",
    image: merchImg,
    tag: "Bestseller",
  },
  {
    id: 2,
    name: "Lekompo Rocks Hoodie",
    price: "R650",
    originalPrice: null,
    image: merchImg,
    tag: "New",
  },
  {
    id: 3,
    name: "Snapback Cap",
    price: "R250",
    originalPrice: null,
    image: merchImg,
    tag: null,
  },
  {
    id: 4,
    name: "Limited Edition Jacket",
    price: "R1200",
    originalPrice: "R1500",
    image: merchImg,
    tag: "Sale",
  },
];

const Merch = () => {
  return (
    <section id="merch" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="text-primary font-medium text-sm uppercase tracking-wider">
              Official Gear
            </span>
            <h2 className="font-display text-5xl md:text-6xl mt-2">
              SHOP <span className="text-gradient">MERCH</span>
            </h2>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            View All Products
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.tag && (
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase rounded ${
                        product.tag === "Sale"
                          ? "bg-destructive text-destructive-foreground"
                          : product.tag === "New"
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {product.tag}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="hero" size="lg">
                    <ShoppingBag className="w-4 h-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl text-primary">
                    {product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Merch;
