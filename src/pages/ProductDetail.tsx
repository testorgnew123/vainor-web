import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Minus, Plus, ChevronRight, Star, Truck, RefreshCw, Shield, Loader2, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { cn, cloudinaryUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { apiCall } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { product, isLoading } = useProduct(id || '');
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const { addItem } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  
  // Recently viewed
  const { addProduct, getRecent } = useRecentlyViewedStore();

  useEffect(() => {
    if (product) {
      addProduct(product);
      // Track product view for analytics (non-fatal)
      apiCall('track-view', { product_id: product.id }).catch(() => {});
    }
  }, [product?.id]);

  const recentlyViewed = getRecent(product?.id, 4);

  // Fetch related products based on category
  const { products: allProducts } = useProducts({ category: product?.category });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Product not found</h1>
          <Button asChild>
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const isOutOfStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity === 0);
  const availableStock = product.stockQuantity ?? Infinity;
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity > 0 && product.stockQuantity <= 5;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: 'Please select a color',
        variant: 'destructive',
      });
      return;
    }

    if (quantity > availableStock) {
      toast({
        title: 'Insufficient stock',
        description: `Only ${availableStock} items available.`,
        variant: 'destructive',
      });
      return;
    }

    addItem({
      product,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });

    toast({
      title: 'Added to bag',
      description: `${product.name} has been added to your bag.`,
    });
  };

  const handleWishlistToggle = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({ title: 'Removed from wishlist' });
    } else {
      addToWishlist(product);
      toast({ title: 'Added to wishlist' });
    }
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            to={`/shop/${product.category.toLowerCase()}`}
            className="hover:text-foreground transition-colors"
          >
            {product.category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      {/* Product */}
      <div className="container pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-secondary/30">
              <img
                src={cloudinaryUrl(product.images[selectedImage], { width: 900 })}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isOutOfStock && (
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-medium rounded">
                    Out of Stock
                  </span>
                )}
                {!isOutOfStock && product.isNew && (
                  <span className="px-3 py-1 bg-foreground text-background text-xs font-medium rounded">
                    New
                  </span>
                )}
                {!isOutOfStock && isLowStock && (
                  <span className="px-3 py-1 bg-yellow-500 text-yellow-50 text-xs font-medium rounded">
                    Only {product.stockQuantity} left
                  </span>
                )}
              </div>
              {!isOutOfStock && discount && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded">
                  -{discount}%
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'w-20 h-24 rounded-md overflow-hidden border-2 transition-colors',
                      selectedImage === index
                        ? 'border-foreground'
                        : 'border-transparent hover:border-border'
                    )}
                  >
                    <img
                      src={cloudinaryUrl(image, { width: 200 })}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:py-8">
            <div className="sticky top-28 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {product.category} / {product.subcategory}
                </p>
                <h1 className="font-display text-3xl md:text-4xl mb-3">
                  {product.name}
                </h1>
                {product.sku && (
                  <p className="text-sm text-muted-foreground mb-3">
                    SKU: <span className="font-mono font-medium text-foreground">{product.sku}</span>
                  </p>
                )}
                
                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-4 w-4',
                            i < Math.floor(product.rating!)
                              ? 'fill-accent text-accent'
                              : 'text-border'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-medium">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                {isOutOfStock ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <span className="text-sm font-medium">Out of Stock</span>
                  </div>
                ) : isLowStock ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <span className="text-sm font-medium">Only {product.stockQuantity} left in stock</span>
                  </div>
                ) : product.stockQuantity !== undefined ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="text-sm font-medium">In Stock ({product.stockQuantity} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="text-sm font-medium">In Stock</span>
                  </div>
                )}
              </div>

              <p className="text-muted-foreground">{product.description}</p>

              {/* Color Selection */}
              <div>
                <p className="font-medium mb-3">
                  Color: {selectedColor || 'Select a color'}
                </p>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all',
                        selectedColor === color.name
                          ? 'ring-2 ring-offset-2 ring-foreground'
                          : 'border-border hover:scale-110'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">
                    Size: {selectedSize || 'Select a size'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-sm underline text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Ruler className="h-3 w-3" />
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'px-4 py-2 min-w-[48px] border rounded-md text-sm font-medium transition-colors',
                        selectedSize === size
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border hover:border-foreground'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <p className="font-medium mb-3">Quantity</p>
                <div className="flex items-center border border-border rounded-md w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-secondary transition-colors disabled:opacity-50"
                    disabled={quantity <= 1 || isOutOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    className="p-3 hover:bg-secondary transition-colors disabled:opacity-50"
                    disabled={quantity >= availableStock || isOutOfStock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {!isOutOfStock && quantity >= availableStock && product.stockQuantity !== undefined && (
                  <p className="text-xs text-muted-foreground mt-2">Maximum available quantity</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleWishlistToggle}
                  className={cn(isWishlisted && 'text-accent border-accent')}
                >
                  <Heart
                    className={cn('h-5 w-5', isWishlisted && 'fill-accent')}
                  />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Free Shipping
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    30-Day Returns
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Secure Checkout
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-secondary/20">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl mb-8">
              Recently Viewed
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {recentlyViewed.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Size Guide Dialog */}
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Size Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the chart below to find your perfect fit. All measurements are in inches.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary">
                    <th className="border border-border px-3 py-2 text-left font-medium">Size</th>
                    <th className="border border-border px-3 py-2 text-center font-medium">Chest</th>
                    <th className="border border-border px-3 py-2 text-center font-medium">Waist</th>
                    <th className="border border-border px-3 py-2 text-center font-medium">Hip</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'XS', chest: '34-36', waist: '28-30', hip: '34-36' },
                    { size: 'S', chest: '36-38', waist: '30-32', hip: '36-38' },
                    { size: 'M', chest: '38-40', waist: '32-34', hip: '38-40' },
                    { size: 'L', chest: '40-42', waist: '34-36', hip: '40-42' },
                    { size: 'XL', chest: '42-44', waist: '36-38', hip: '42-44' },
                    { size: 'XXL', chest: '44-46', waist: '38-40', hip: '44-46' },
                  ].map((row) => (
                    <tr key={row.size} className="hover:bg-secondary/50">
                      <td className="border border-border px-3 py-2 font-medium">{row.size}</td>
                      <td className="border border-border px-3 py-2 text-center">{row.chest}</td>
                      <td className="border border-border px-3 py-2 text-center">{row.waist}</td>
                      <td className="border border-border px-3 py-2 text-center">{row.hip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <h4 className="font-medium text-foreground">Denim / Bottoms (by waist in inches)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="border border-border px-3 py-2 text-left font-medium">Size</th>
                      <th className="border border-border px-3 py-2 text-center font-medium">Waist</th>
                      <th className="border border-border px-3 py-2 text-center font-medium">Inseam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { size: '28', waist: '28', inseam: '30-32' },
                      { size: '30', waist: '30', inseam: '30-32' },
                      { size: '32', waist: '32', inseam: '30-32' },
                      { size: '34', waist: '34', inseam: '30-32' },
                      { size: '36', waist: '36', inseam: '30-32' },
                    ].map((row) => (
                      <tr key={row.size} className="hover:bg-secondary/50">
                        <td className="border border-border px-3 py-2 font-medium">{row.size}</td>
                        <td className="border border-border px-3 py-2 text-center">{row.waist}"</td>
                        <td className="border border-border px-3 py-2 text-center">{row.inseam}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              If you're between sizes, we recommend sizing up for a relaxed fit or sizing down for a slimmer fit.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
