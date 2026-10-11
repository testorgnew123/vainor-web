import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCw, Shield, Leaf, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { CategoryCard } from '@/components/product/CategoryCard';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';

const trustBadges = [
  { icon: Truck, label: 'Free Shipping', description: 'On orders over ₹2,500' },
  { icon: RefreshCw, label: 'Easy Returns', description: '30-day return policy' },
  { icon: Shield, label: 'Secure Payment', description: 'SSL encrypted checkout' },
  { icon: Leaf, label: 'Sustainable', description: 'Eco-friendly materials' },
];

export default function Index() {
  const { products: featuredProducts, isLoading: featuredLoading } = useProducts({ featured: true, limit: 4 });
  const { products: newArrivals, isLoading: newLoading } = useProducts({ isNew: true, limit: 4 });
  const { products: bestSelling } = useProducts({ bestselling: true, limit: 4 });
  const { products: discountedProducts } = useProducts({ discounted: true, limit: 4 });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden bg-primary">
        {/* Decorative Mark */}
        <div
          className="absolute -right-24 -bottom-24 h-[120%] aspect-square text-accent/[0.07] pointer-events-none select-none"
          aria-hidden="true"
        >
          <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
            <path d="M4 6 L11 6 L20 26 L29 6 L36 6 L20 36 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="container relative z-10">
          <div className="max-w-xl animate-fade-in-up">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider uppercase border border-accent/50 text-accent rounded-full">
              New Collection 2024
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-primary-foreground mb-6 leading-tight">
              Timeless Style,
              <br />
              <span className="italic text-accent">Modern Craft</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-md">
              Discover our curated collection of premium essentials, designed for
              those who appreciate quality and understated elegance.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent-warm"
                asChild
              >
                <Link to="/shop">
                  Shop Collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
              >
                <Link to="/about">Our Story</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {trustBadges.map((badge, index) => (
              <div
                key={badge.label}
                className={`flex items-center gap-3 py-6 px-4 ${
                  index < trustBadges.length - 1 ? 'md:border-r border-border' : ''
                }`}
              >
                <badge.icon className="h-6 w-6 text-accent flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{badge.label}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl mb-2">
                Shop by Category
              </h2>
              <p className="text-muted-foreground">
                Find your perfect style across our collections
              </p>
            </div>
            <Link
              to="/shop"
              className="hidden md:flex items-center gap-1 text-sm font-medium underline-animate"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} size="large" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl mb-2">
                Featured Pieces
              </h2>
              <p className="text-muted-foreground">
                Handpicked favorites from our collection
              </p>
            </div>
            <Link
              to="/shop?filter=featured"
              className="hidden md:flex items-center gap-1 text-sm font-medium underline-animate"
            >
              Shop All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSelling.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl mb-2">
                  Best Sellers
                </h2>
                <p className="text-muted-foreground">
                  Our most popular picks loved by customers
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden md:flex items-center gap-1 text-sm font-medium underline-animate"
              >
                Shop All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {bestSelling.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banner */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="relative rounded-xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80"
              alt="Vainor Sustainability"
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="container">
                <div className="max-w-lg text-white">
                  <span className="text-sm font-medium tracking-wider uppercase opacity-80">
                    Our Commitment
                  </span>
                  <h2 className="font-display text-3xl md:text-5xl mt-2 mb-4">
                    Crafted with Purpose
                  </h2>
                  <p className="text-white/80 mb-6">
                    Every piece in our collection is thoughtfully designed using
                    sustainable materials and ethical manufacturing practices.
                  </p>
                  <Button
                    variant="outline"
                    className="border-white text-white bg-transparent hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link to="/sustainability">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-4xl mb-2">
                New Arrivals
              </h2>
              <p className="text-muted-foreground">
                The latest additions to our collection
              </p>
            </div>
            <Link
              to="/shop?filter=new"
              className="hidden md:flex items-center gap-1 text-sm font-medium underline-animate"
            >
              Shop New
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* On Sale */}
      {discountedProducts.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl md:text-4xl mb-2">
                  On Sale
                </h2>
                <p className="text-muted-foreground">
                  Great deals on premium pieces
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden md:flex items-center gap-1 text-sm font-medium underline-animate"
              >
                View All Deals
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {discountedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
