import { Product } from '@/stores/cartStore';

export const products: Product[] = [
];

export const categories = [
  {
    id: 'jeans',
    name: 'Jeans',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    href: '/shop?subcategory=Jeans',
    subcategories: ['Jeans'],
  },
  {
    id: 'shirts',
    name: 'Shirts',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
    href: '/shop?subcategory=Shirts',
    subcategories: ['Shirts'],
  },
  {
    id: 'trousers',
    name: 'Trousers',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
    href: '/shop?subcategory=Trousers',
    subcategories: ['Trousers'],
  },
  {
    id: 'cargo',
    name: 'Cargo',
    image: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&q=80',
    href: '/shop?subcategory=Cargo',
    subcategories: ['Cargo'],
  },
  {
    id: 'lowers',
    name: 'Lowers',
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80',
    href: '/shop?subcategory=Lowers',
    subcategories: ['Lowers'],
  },
  {
    id: 't-shirt',
    name: 'T-Shirt',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    href: '/shop?subcategory=T-Shirt',
    subcategories: ['T-Shirt'],
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(
    (product) => product.category.toLowerCase() === category.toLowerCase()
  );
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((product) => product.isFeatured);
};

export const getNewArrivals = (): Product[] => {
  return products.filter((product) => product.isNew);
};

export const filterProducts = (
  category?: string,
  subcategory?: string,
  minPrice?: number,
  maxPrice?: number,
  sizes?: string[],
  colors?: string[]
): Product[] => {
  return products.filter((product) => {
    if (category && product.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    if (subcategory && product.subcategory.toLowerCase() !== subcategory.toLowerCase()) {
      return false;
    }
    if (minPrice && product.price < minPrice) {
      return false;
    }
    if (maxPrice && product.price > maxPrice) {
      return false;
    }
    if (sizes && sizes.length > 0 && !sizes.some((size) => product.sizes.includes(size))) {
      return false;
    }
    if (colors && colors.length > 0 && !colors.some((color) => product.colors.some((c) => c.name === color))) {
      return false;
    }
    return true;
  });
};
