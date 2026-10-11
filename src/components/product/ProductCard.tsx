import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { cn, cloudinaryUrl } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const isOutOfStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity === 0);
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <Link
      to={`/product/${product.id}`}
      className={cn('group block', className)}
    >
      <div className="relative img-zoom rounded-lg overflow-hidden bg-secondary/30 aspect-[3/4] mb-4">
        <img
          src={cloudinaryUrl(product.images[0], { width: 600 })}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOutOfStock && (
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded">
              Out of Stock
            </span>
          )}
          {!isOutOfStock && product.isNew && (
            <span className="px-2 py-1 bg-foreground text-background text-xs font-medium rounded">
              New
            </span>
          )}
          {!isOutOfStock && discount && (
            <span className="px-2 py-1 bg-accent text-accent-foreground text-xs font-medium rounded">
              -{discount}%
            </span>
          )}
          {!isOutOfStock && isLowStock && (
            <span className="px-2 py-1 bg-accent-warm text-accent-foreground text-xs font-medium rounded">
              Only {product.stockQuantity} left
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={cn(
            'absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-200',
            'opacity-0 group-hover:opacity-100',
            isWishlisted && 'opacity-100'
          )}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isWishlisted ? 'fill-accent text-accent' : 'text-foreground'
            )}
          />
        </button>

        {/* Quick Add - Desktop Only */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button className="w-full py-2.5 px-4 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors">
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="font-medium text-sm md:text-base group-hover:text-accent transition-colors line-clamp-1">
          {product.name}
        </h3>
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
        {/* Color Swatches */}
        <div className="flex gap-1 pt-1">
          {product.colors.map((color) => (
            <span
              key={color.name}
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
