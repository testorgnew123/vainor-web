import { Link } from 'react-router-dom';
import { Heart, ArrowRight, X } from 'lucide-react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cloudinaryUrl } from '@/lib/utils';

export default function Wishlist() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleAddToCart = (product: typeof items[0]) => {
    // Default to first size and color
    addItem({
      product,
      quantity: 1,
      size: product.sizes[0],
      color: product.colors[0].name,
    });
    toast({
      title: 'Added to bag',
      description: `${product.name} has been added to your bag.`,
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Heart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="font-display text-3xl mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Save your favorite items here to shop them later.
          </p>
          <Button size="lg" asChild>
            <Link to="/shop">
              Explore Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Wishlist</h1>
            <p className="text-muted-foreground mt-1">{items.length} items saved</p>
          </div>
          <Button variant="ghost" onClick={clearWishlist}>
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product) => (
            <div key={product.id} className="group relative">
              {/* Remove Button */}
              <button
                onClick={() => removeItem(product.id)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove from wishlist"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Product Image */}
              <Link
                to={`/product/${product.id}`}
                className="block relative img-zoom rounded-lg overflow-hidden bg-secondary/30 aspect-[3/4] mb-4"
              >
                <img
                  src={cloudinaryUrl(product.images[0], { width: 600 })}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Quick Add */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                  >
                    Add to Bag
                  </Button>
                </div>
              </Link>

              {/* Product Info */}
              <div className="space-y-1">
                <Link
                  to={`/product/${product.id}`}
                  className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-1"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {product.category} • {product.subcategory}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
