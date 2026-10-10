import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Minus, Plus, X, ArrowRight, Truck, Shield, RefreshCw, Tag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiCall } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cloudinaryUrl } from '@/lib/utils';

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const totalPrice = getTotalPrice();
  const shippingThreshold = 2500;
  const freeShipping = totalPrice >= shippingThreshold;

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      const discount = (totalPrice * appliedCoupon.discountValue) / 100;
      return appliedCoupon.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
    } else {
      return Math.min(appliedCoupon.discountValue, totalPrice);
    }
  };

  const discount = calculateDiscount();
  const finalTotal = Math.max(0, totalPrice - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    setIsApplyingCoupon(true);

    try {
      // Fetch coupon from Netlify function
      const response = await apiCall('get-coupon', { code: couponCode });
      const coupon = response.data;

      // Validate coupon
      if (!coupon.is_active) {
        toast({
          title: 'Coupon inactive',
          description: 'This coupon is no longer active.',
          variant: 'destructive',
        });
        return;
      }

      const now = new Date();
      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        toast({
          title: 'Coupon expired',
          description: 'This coupon has expired.',
          variant: 'destructive',
        });
        return;
      }

      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        toast({
          title: 'Coupon not yet active',
          description: 'This coupon is not yet available.',
          variant: 'destructive',
        });
        return;
      }

      if (coupon.min_order_amount && totalPrice < coupon.min_order_amount) {
        toast({
          title: 'Minimum order not met',
          description: `This coupon requires a minimum order of ₹${coupon.min_order_amount.toLocaleString('en-IN')}.`,
          variant: 'destructive',
        });
        return;
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast({
          title: 'Coupon limit reached',
          description: 'This coupon has reached its usage limit.',
          variant: 'destructive',
        });
        return;
      }

      // Apply coupon
      setAppliedCoupon({
        code: coupon.code,
        discountType: coupon.discount_type as 'percentage' | 'fixed',
        discountValue: parseFloat(coupon.discount_value),
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : undefined,
      });

      toast({
        title: 'Coupon applied!',
        description: coupon.description || 'Your discount has been applied.',
      });
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply coupon. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: 'Coupon removed',
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl mb-4">Your Bag is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added anything to your bag yet.
          </p>
          <Button size="lg" asChild>
            <Link to="/shop">
              Start Shopping
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
        <h1 className="font-display text-3xl md:text-4xl mb-8">Shopping Bag</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Free Shipping Progress */}
            {!freeShipping && (
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm mb-2">
                  You're ₹{(shippingThreshold - totalPrice).toLocaleString('en-IN')} away from
                  free shipping!
                </p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${(totalPrice / shippingThreshold) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="flex gap-4 py-6"
                >
                  <Link
                    to={`/product/${item.product.id}`}
                    className="w-24 h-32 md:w-32 md:h-40 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0"
                  >
                    <img
                      src={cloudinaryUrl(item.product.images[0], { width: 200 })}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-medium hover:text-accent transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.size} / {item.color}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.size, item.color)
                        }
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-center border border-border rounded-md">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.size,
                              item.color,
                              item.quantity - 1
                            )
                          }
                          className="p-2 hover:bg-secondary transition-colors"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.size,
                              item.color,
                              item.quantity + 1
                            )
                          }
                          className="p-2 hover:bg-secondary transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            ₹{item.product.price.toLocaleString('en-IN')} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-secondary/30 rounded-lg p-6 space-y-6">
              <h2 className="font-medium text-lg">Order Summary</h2>

              {/* Coupon */}
              <div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Coupon code" 
                    className="flex-1 uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                  />
                  {appliedCoupon ? (
                    <Button 
                      variant="outline" 
                      onClick={handleRemoveCoupon}
                      className="shrink-0"
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon}
                      className="shrink-0"
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </Button>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                    <Tag className="h-3 w-3" />
                    <span>Coupon "{appliedCoupon.code}" applied</span>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {freeShipping ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      'Calculated at checkout'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link to="/checkout">
                  Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {/* Trust Badges */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>Free shipping on orders over ₹2,500</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span>30-day free returns</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure SSL checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
