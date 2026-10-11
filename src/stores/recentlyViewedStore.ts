import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './cartStore';

interface RecentlyViewedStore {
  products: Product[];
  addProduct: (product: Product) => void;
  getRecent: (excludeId?: string, limit?: number) => Product[];
  clear: () => void;
}

const MAX_RECENT = 10;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product: Product) => {
        set((state) => {
          const filtered = state.products.filter((p) => p.id !== product.id);
          const updated = [product, ...filtered].slice(0, MAX_RECENT);
          return { products: updated };
        });
      },

      getRecent: (excludeId?: string, limit = 4) => {
        const products = get().products;
        const filtered = excludeId ? products.filter((p) => p.id !== excludeId) : products;
        return filtered.slice(0, limit);
      },

      clear: () => set({ products: [] }),
    }),
    {
      name: 'vainor-recently-viewed',
    }
  )
);
