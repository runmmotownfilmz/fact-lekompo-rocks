 import { useState, useEffect } from 'react';
 import { storefrontApiRequest, STOREFRONT_PRODUCTS_QUERY, ShopifyProduct } from '@/lib/shopify';
 
 export function useShopifyProducts(limit: number = 10) {
   const [products, setProducts] = useState<ShopifyProduct[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const fetchProducts = async () => {
       try {
         setLoading(true);
         const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: limit });
         if (data?.data?.products?.edges) {
           setProducts(data.data.products.edges);
         }
       } catch (err) {
         setError(err instanceof Error ? err.message : 'Failed to fetch products');
       } finally {
         setLoading(false);
       }
     };
 
     fetchProducts();
   }, [limit]);
 
   return { products, loading, error };
 }