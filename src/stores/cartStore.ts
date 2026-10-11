import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  sku?: string; // Stock Keeping Unit for inventory management
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  images: string[];
  category: string;
  subcategory: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  inStock: boolean;
  stockQuantity?: number; // Available stock quantity
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean; // Whether product is active/visible to customers
  rating?: number;
  reviews?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.product.id === newItem.product.id &&
              item.size === newItem.size &&
              item.color === newItem.color
          );

          // Check stock availability
          const stockQuantity = newItem.product.stockQuantity ?? Infinity;
          
          if (existingIndex > -1) {
            const currentQuantity = state.items[existingIndex].quantity;
            const newQuantity = currentQuantity + newItem.quantity;
            
            // Prevent adding more than available stock
            if (newQuantity > stockQuantity) {
              console.warn(`Cannot add more items. Only ${stockQuantity} in stock.`);
              return state; // Return current state without changes
            }
            
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity = newQuantity;
            return { items: updatedItems, isOpen: true };
          }

          // Check if requested quantity exceeds stock
          if (newItem.quantity > stockQuantity) {
            console.warn(`Cannot add ${newItem.quantity} items. Only ${stockQuantity} in stock.`);
            return state; // Return current state without changes
          }

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (productId, size, color) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId && item.size === size && item.color === color)
          ),
        }));
      },

      updateQuantity: (productId, size, color, quantity) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.product.id === productId && item.size === size && item.color === color) {
              const stockQuantity = item.product.stockQuantity ?? Infinity;
              const newQuantity = Math.max(1, Math.min(quantity, stockQuantity));
              return { ...item, quantity: newQuantity };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'vainor-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
