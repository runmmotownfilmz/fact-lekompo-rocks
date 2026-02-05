 import { useParams, useNavigate } from "react-router-dom";
 import { useState, useEffect } from "react";
 import { ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { storefrontApiRequest, ShopifyProduct } from "@/lib/shopify";
 import { useCartStore } from "@/stores/cartStore";
 import { toast } from "sonner";
 import Navbar from "@/components/Navbar";
 import Footer from "@/components/Footer";
 
 const PRODUCT_BY_HANDLE_QUERY = `
   query GetProductByHandle($handle: String!) {
     productByHandle(handle: $handle) {
       id
       title
       description
       handle
       priceRange {
         minVariantPrice {
           amount
           currencyCode
         }
       }
       images(first: 5) {
         edges {
           node {
             url
             altText
           }
         }
       }
       variants(first: 10) {
         edges {
           node {
             id
             title
             price {
               amount
               currencyCode
             }
             availableForSale
             selectedOptions {
               name
               value
             }
           }
         }
       }
       options {
         name
         values
       }
     }
   }
 `;
 
 const ProductDetail = () => {
   const { handle } = useParams();
   const navigate = useNavigate();
   const [product, setProduct] = useState<ShopifyProduct | null>(null);
   const [loading, setLoading] = useState(true);
   const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
   const { addItem, isLoading: cartLoading } = useCartStore();
 
   useEffect(() => {
     const fetchProduct = async () => {
       if (!handle) return;
       try {
         const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
         if (data?.data?.productByHandle) {
           const productData: ShopifyProduct = { node: data.data.productByHandle };
           setProduct(productData);
           setSelectedVariant(productData.node.variants.edges[0]?.node.id || null);
         }
       } catch (error) {
         console.error("Failed to fetch product:", error);
       } finally {
         setLoading(false);
       }
     };
     fetchProduct();
   }, [handle]);
 
   const handleAddToCart = async () => {
     if (!product || !selectedVariant) return;
     const variant = product.node.variants.edges.find(v => v.node.id === selectedVariant)?.node;
     if (!variant) return;
 
     await addItem({
       product,
       variantId: variant.id,
       variantTitle: variant.title,
       price: variant.price,
       quantity: 1,
       selectedOptions: variant.selectedOptions || []
     });
     toast.success("Added to cart!", { description: product.node.title });
   };
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!product) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <div className="container mx-auto px-4 pt-32 pb-20 text-center">
           <h1 className="text-4xl font-display mb-4">Product Not Found</h1>
           <Button onClick={() => navigate("/")}>Go Back Home</Button>
         </div>
         <Footer />
       </div>
     );
   }
 
   const currentVariant = product.node.variants.edges.find(v => v.node.id === selectedVariant)?.node;
   const mainImage = product.node.images.edges[0]?.node;
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <main className="container mx-auto px-4 pt-28 pb-20">
         <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
           <ArrowLeft className="w-4 h-4 mr-2" />
           Back
         </Button>
 
         <div className="grid md:grid-cols-2 gap-12">
           {/* Product Image */}
           <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
             {mainImage ? (
               <img
                 src={mainImage.url}
                 alt={mainImage.altText || product.node.title}
                 className="w-full h-full object-cover"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center">
                 <ShoppingBag className="w-20 h-20 text-muted-foreground" />
               </div>
             )}
           </div>
 
           {/* Product Info */}
           <div>
             <h1 className="font-display text-4xl md:text-5xl mb-4">{product.node.title}</h1>
             
             <div className="text-3xl font-display text-primary mb-6">
               {currentVariant?.price.currencyCode} {parseFloat(currentVariant?.price.amount || "0").toFixed(2)}
             </div>
 
             <p className="text-muted-foreground mb-8 leading-relaxed">
               {product.node.description || "No description available."}
             </p>
 
             {/* Variant Selection */}
             {product.node.variants.edges.length > 1 && (
               <div className="mb-8">
                 <label className="block text-sm font-medium mb-3">Select Option</label>
                 <div className="flex flex-wrap gap-2">
                   {product.node.variants.edges.map((variant) => (
                     <Button
                       key={variant.node.id}
                       variant={selectedVariant === variant.node.id ? "default" : "outline"}
                       onClick={() => setSelectedVariant(variant.node.id)}
                       disabled={!variant.node.availableForSale}
                     >
                       {variant.node.title}
                     </Button>
                   ))}
                 </div>
               </div>
             )}
 
             <Button
               variant="hero"
               size="xl"
               className="w-full"
               onClick={handleAddToCart}
               disabled={cartLoading || !currentVariant?.availableForSale}
             >
               {cartLoading ? (
                 <Loader2 className="w-5 h-5 animate-spin" />
               ) : (
                 <>
                   <ShoppingBag className="w-5 h-5" />
                   {currentVariant?.availableForSale ? "Add to Cart" : "Sold Out"}
                 </>
               )}
             </Button>
           </div>
         </div>
       </main>
       <Footer />
     </div>
   );
 };
 
 export default ProductDetail;