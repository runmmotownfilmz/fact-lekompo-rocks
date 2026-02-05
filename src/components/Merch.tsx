 import { ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
 import { useShopifyProducts } from "@/hooks/useShopifyProducts";
 import { useCartStore } from "@/stores/cartStore";
 import { ShopifyProduct } from "@/lib/shopify";
 import { toast } from "sonner";
 import { useNavigate } from "react-router-dom";

const Merch = () => {
   const { products, loading, error } = useShopifyProducts(8);
   const { addItem, isLoading: cartLoading } = useCartStore();
   const navigate = useNavigate();
 
   const handleAddToCart = async (product: ShopifyProduct) => {
     const variant = product.node.variants.edges[0]?.node;
     if (!variant) return;
     
     await addItem({
       product,
       variantId: variant.id,
       variantTitle: variant.title,
       price: variant.price,
       quantity: 1,
       selectedOptions: variant.selectedOptions || []
     });
     toast.success("Added to cart!", {
       description: product.node.title,
     });
   };
 
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
         {loading ? (
           <div className="flex items-center justify-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
           </div>
         ) : error ? (
           <div className="text-center py-20">
             <p className="text-destructive">{error}</p>
           </div>
         ) : products.length === 0 ? (
           <div className="text-center py-20">
             <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
             <h3 className="text-xl font-semibold mb-2">No products yet</h3>
             <p className="text-muted-foreground">Tell us what products you'd like to sell!</p>
           </div>
         ) : (
           <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {products.map((product) => {
               const variant = product.node.variants.edges[0]?.node;
               const image = product.node.images.edges[0]?.node;
               const price = variant?.price || product.node.priceRange.minVariantPrice;
               
               return (
                 <Card
                   key={product.node.id}
                   className="overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-all duration-300 group cursor-pointer"
                   onClick={() => navigate(`/product/${product.node.handle}`)}
                 >
                   <div className="relative aspect-square overflow-hidden bg-muted">
                     {image ? (
                       <img
                         src={image.url}
                         alt={image.altText || product.node.title}
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center">
                         <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button 
                         variant="hero" 
                         size="lg"
                         disabled={cartLoading || !variant?.availableForSale}
                         onClick={(e) => {
                           e.stopPropagation();
                           handleAddToCart(product);
                         }}
                       >
                         {cartLoading ? (
                           <Loader2 className="w-4 h-4 animate-spin" />
                         ) : (
                           <>
                             <ShoppingBag className="w-4 h-4" />
                             {variant?.availableForSale ? "Add to Cart" : "Sold Out"}
                           </>
                         )}
                       </Button>
                     </div>
                   </div>
                   <CardContent className="p-4">
                     <h3 className="font-semibold mb-2 line-clamp-1">{product.node.title}</h3>
                     <div className="flex items-center gap-2">
                       <span className="font-display text-xl text-primary">
                         {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                       </span>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
      </div>
    </section>
  );
};

export default Merch;
