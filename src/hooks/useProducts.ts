import { useState, useEffect, useMemo } from 'react';
import { products as staticProducts } from '@/data/products';
import { Product } from '@/stores/cartStore';

const API_BASE = '/.netlify/functions';

interface UseProductsOptions {
  category?: string;
  subcategory?: string;
  featured?: boolean;
  isNew?: boolean;
  bestselling?: boolean;
  discounted?: boolean;
  search?: string;
  limit?: number;
}

interface UseProductsResult {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.category) params.set('category', options.category);
      if (options.subcategory) params.set('subcategory', options.subcategory);
      if (options.featured) params.set('featured', 'true');
      if (options.isNew) params.set('new', 'true');
      if (options.bestselling) params.set('bestselling', 'true');
      if (options.discounted) params.set('discounted', 'true');
      if (options.search) params.set('search', options.search);
      if (options.limit) params.set('limit', options.limit.toString());

      const response = await fetch(`${API_BASE}/get-products?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        // Ensure inStock is set for all API products
        const prods = (data.products || []).map((p: any) => ({
          ...p,
          inStock: p.inStock !== undefined ? p.inStock : (p.stockQuantity === null || p.stockQuantity === undefined || p.stockQuantity > 0),
        }));
        setDbProducts(prods);
      } else {
        // If API fails, fall back to static products
        console.warn('Failed to fetch from API, using static products');
        setDbProducts([]);
      }
    } catch (err) {
      console.warn('API error, using static products:', err);
      setDbProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [options.category, options.subcategory, options.featured, options.isNew, options.bestselling, options.discounted, options.search, options.limit]);

  // Merge database products with static products, DB products take priority
  const products = useMemo(() => {
    // Create a map of DB products by ID
    const dbProductMap = new Map(dbProducts.map(p => [p.id, p]));
    
    // Filter static products based on options
    let filtered = staticProducts;
    
    if (options.category) {
      filtered = filtered.filter(p => 
        p.category.toLowerCase() === options.category!.toLowerCase()
      );
    }
    
    if (options.subcategory) {
      filtered = filtered.filter(p => 
        p.subcategory?.toLowerCase() === options.subcategory!.toLowerCase()
      );
    }
    
    if (options.featured) {
      filtered = filtered.filter(p => p.isFeatured);
    }
    
    if (options.isNew) {
      filtered = filtered.filter(p => p.isNew);
    }

    if (options.discounted) {
      filtered = filtered.filter(p => p.originalPrice && p.originalPrice > p.price);
    }
    
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Combine: DB products first, then static products not in DB
    const staticNotInDb = filtered.filter(p => !dbProductMap.has(p.id));
    const combined = [...dbProducts, ...staticNotInDb];
    
    if (options.limit) {
      return combined.slice(0, options.limit);
    }
    
    return combined;
  }, [dbProducts, staticProducts, options]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

// Hook to get a single product by ID
export function useProduct(id: string): {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
} {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First try to find in static products
        const staticProduct = staticProducts.find(p => p.id === id);
        
        // Try to fetch from API
        const response = await fetch(`${API_BASE}/get-products?id=${id}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.product) {
            // Ensure inStock is set (safety net for API products)
            const p = data.product;
            if (p.inStock === undefined) {
              p.inStock = p.stockQuantity === null || p.stockQuantity === undefined || p.stockQuantity > 0;
            }
            setProduct(p);
            setIsLoading(false);
            return;
          }
        }
        
        // Fall back to static product
        if (staticProduct) {
          setProduct(staticProduct);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        // Fall back to static product
        const staticProduct = staticProducts.find(p => p.id === id);
        if (staticProduct) {
          setProduct(staticProduct);
        } else {
          setError('Product not found');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return { product, isLoading, error };
}

// Get all products (combined static + DB)
export function useAllProducts(): UseProductsResult {
  return useProducts({});
}
