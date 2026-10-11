import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, Loader2, Tag, X, MapPin, Plus } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiCall } from '@/lib/api';
import { InlineAuthForm } from '@/components/auth/InlineAuthForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn, cloudinaryUrl } from '@/lib/utils';
import { z } from 'zod';

const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string()
    .min(10, 'Phone number must be 10 digits')
    .max(10, 'Phone number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  streetAddress: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(6, 'Valid postal code is required'),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  is_default: boolean;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { initiatePayment, verifyPayment, isReady, isLoading } = useRazorpay();
  const { toast } = useToast();

  const [formData, setFormData] = useState<AddressFormData>({
    fullName: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [errors, setErrors] = useState<Partial<AddressFormData>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const MIN_COD_AMOUNT = 1000;

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
  const [saveAddress, setSaveAddress] = useState(true);

  // Fetch saved addresses
  useEffect(() => {
    if (user && token) {
      apiCall('addresses', { action: 'list' }, { token })
        .then((result) => {
          const addrs = result.data || [];
          setSavedAddresses(addrs);
          // Auto-select default address if exists
          const defaultAddr = addrs.find((a: SavedAddress) => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            fillFormFromSavedAddress(defaultAddr);
          }
        })
        .catch(() => {/* ignore - proceed with manual entry */});
    }
  }, [user?.id, token]);

  const fillFormFromSavedAddress = (addr: SavedAddress) => {
    setFormData({
      fullName: addr.full_name,
      email: user?.email || '',
      phone: addr.phone,
      streetAddress: addr.street_address,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
    });
    setErrors({});
  };

  const handleSelectAddress = (addrId: string | 'new') => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setFormData({
        fullName: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : '',
        email: user?.email || '',
        phone: '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
      });
      setErrors({});
    } else {
      const addr = savedAddresses.find((a) => a.id === addrId);
      if (addr) fillFormFromSavedAddress(addr);
    }
  };

  // Pre-fill form from user data after login (only if no saved address selected)
  useEffect(() => {
    if (user && selectedAddressId === 'new') {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || [user.first_name, user.last_name].filter(Boolean).join(' '),
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const subtotal = getTotalPrice();
  const shippingCost = subtotal >= 2500 ? 0 : 500;
  
  // Calculate GST based on apparel GST rules:
  // ≤₹2,500 per piece: 5% GST, >₹2,500 per piece: 18% GST
  const calculateGST = () => {
    return items.reduce((totalTax, item) => {
      const itemPrice = item.product.price;
      const gstRate = itemPrice <= 2500 ? 0.05 : 0.18;
      const itemTax = itemPrice * item.quantity * gstRate;
      return totalTax + itemTax;
    }, 0);
  };
  
  // Determine the GST rate to display (5% or 18%)
  const getGSTRateLabel = () => {
    const allBelow2500 = items.every(item => item.product.price <= 2500);
    const allAbove2500 = items.every(item => item.product.price > 2500);
    if (allBelow2500) return '5%';
    if (allAbove2500) return '18%';
    return ''; // Mixed rates, just show "GST"
  };
  
  const gstRateLabel = getGSTRateLabel();
  const tax = Math.round(calculateGST() * 100) / 100;

  const calculateDiscount = (): number => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      const rawDiscount = subtotal * parseFloat(appliedCoupon.discount_value) / 100;
      return Math.round(Math.min(rawDiscount, appliedCoupon.max_discount ? parseFloat(appliedCoupon.max_discount) : Infinity) * 100) / 100;
    }
    return parseFloat(appliedCoupon.discount_value);
  };

  const discount = calculateDiscount();
  const total = subtotal - discount + shippingCost + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AddressFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      addressSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<AddressFormData> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof AddressFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');

    try {
      const result = await apiCall('get-coupon', { code: couponCode.trim() });
      const coupon = result.data;

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        setCouponError('This coupon has reached its usage limit');
        setCouponLoading(false);
        return;
      }

      if (coupon.min_order_amount && subtotal < parseFloat(coupon.min_order_amount)) {
        setCouponError(`Minimum order amount is ₹${parseFloat(coupon.min_order_amount).toLocaleString('en-IN')}`);
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError('');
      toast({
        title: 'Coupon Applied!',
        description: `Discount of ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '₹' + coupon.discount_value} applied.`,
      });
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCODOrder = async () => {
    try {
      const orderData = {
        user_id: user?.id || null,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          product_image: item.product.images[0],
          quantity: item.quantity,
          price: item.product.price,
          size: item.size,
          color: item.color,
        })),
        shipping_address: {
          full_name: formData.fullName,
          email: formData.email,
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: 'India',
          phone: formData.phone,
        },
        subtotal,
        shipping_cost: shippingCost,
        tax,
        total,
        discount,
        coupon_code: appliedCoupon?.code || null,
      };

      const result = await apiCall('create-cod-order', orderData);

      if (result.success) {
        // Save address if user opted in and using new address
        if (user && token && saveAddress && selectedAddressId === 'new') {
          apiCall('addresses', {
            action: 'create',
            label: 'Home',
            full_name: formData.fullName,
            street_address: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            postal_code: formData.postalCode,
            phone: formData.phone,
          }, { token }).catch(() => {/* non-fatal */});
        }

        clearCart();
        toast({
          title: 'Order Placed!',
          description: `Order #${result.order_number} placed successfully. Pay on delivery.`,
        });
        navigate('/order-success', {
          state: { orderNumber: result.order_number, paymentMethod: 'cod' },
        });
      }
    } catch (error) {
      console.error('COD order error:', error);
      toast({
        title: 'Order Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast({
        title: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Your cart is empty',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    // Handle COD orders
    if (paymentMethod === 'cod') {
      try {
        await handleCODOrder();
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Handle Razorpay payment
    try {
      // Format phone number for Razorpay (add +91 if not present)
      const formattedPhone = formData.phone.startsWith('+') 
        ? formData.phone 
        : `+91${formData.phone.replace(/^0+/, '')}`;

      await initiatePayment({
        amount: total,
        currency: 'INR',
        name: 'Vainor',
        description: `Order of ${items.length} item(s)`,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formattedPhone,
        },
        notes: {
          address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
        },
        onSuccess: async (response) => {
          try {
            // Verify payment and create order
            const verificationResult = await verifyPayment(response, {
              user_id: user?.id || null,
              items: items.map((item) => ({
                product_id: item.product.id,
                product_name: item.product.name,
                product_image: item.product.images[0],
                quantity: item.quantity,
                price: item.product.price,
                size: item.size,
                color: item.color,
              })),
              shipping_address: {
                full_name: formData.fullName,
                email: formData.email,
                street_address: formData.streetAddress,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postalCode,
                country: 'India',
                phone: formData.phone,
              },
              subtotal,
              shipping_cost: shippingCost,
              tax,
              total,
              discount,
              coupon_code: appliedCoupon?.code || null,
            });

            if (verificationResult.success) {
              // Save address if user opted in and using new address
              if (user && token && saveAddress && selectedAddressId === 'new') {
                apiCall('addresses', {
                  action: 'create',
                  label: 'Home',
                  full_name: formData.fullName,
                  street_address: formData.streetAddress,
                  city: formData.city,
                  state: formData.state,
                  postal_code: formData.postalCode,
                  phone: formData.phone,
                }, { token }).catch(() => {/* non-fatal */});
              }

              clearCart();
              toast({
                title: 'Payment Successful!',
                description: `Order #${verificationResult.order_number} placed successfully.`,
              });
              navigate('/order-success', {
                state: { orderNumber: verificationResult.order_number },
              });
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: 'Payment verification failed',
              description: 'Please contact support if amount was deducted.',
              variant: 'destructive',
            });
          } finally {
            setIsProcessing(false);
          }
        },
        onError: (error) => {
          console.error('Payment error:', error);
          toast({
            title: 'Payment failed',
            description: error.message || 'Please try again.',
            variant: 'destructive',
          });
          setIsProcessing(false);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment initiation failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl mb-4">Your Bag is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some items to your bag before checking out.
          </p>
          <Button size="lg" onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </button>

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl mb-2">Checkout</h1>
            <p className="text-muted-foreground">
              Please sign in or create an account to complete your purchase.
            </p>
          </div>

          <InlineAuthForm
            title="Sign in to checkout"
            subtitle="Your bag items are saved. Sign in to complete your purchase."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </button>

        {/* Free Shipping Banner */}
        {shippingCost > 0 && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg flex items-center gap-3">
            <Truck className="h-5 w-5 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground">
              Add ₹{(2500 - subtotal).toLocaleString('en-IN')} more to get <span className="font-semibold">FREE delivery!</span>
            </p>
          </div>
        )}

        <h1 className="font-display text-3xl md:text-4xl mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Shipping Form */}
          <div className="space-y-6">
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4">Select Address</h2>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectAddress(addr.id)}
                      className={cn(
                        'w-full text-left p-3 border rounded-lg transition-colors',
                        selectedAddressId === addr.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{addr.label}</span>
                            {addr.is_default && (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{addr.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {addr.street_address}, {addr.city}, {addr.state} {addr.postal_code}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectAddress('new')}
                    className={cn(
                      'w-full text-left p-3 border rounded-lg transition-colors flex items-center gap-3',
                      selectedAddressId === 'new'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Use a new address</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-medium mb-4">
                {savedAddresses.length > 0 && selectedAddressId !== 'new' ? 'Shipping Details' : 'Shipping Information'}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="streetAddress">Street Address *</Label>
                  <Input
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder="Enter your street address"
                    className={errors.streetAddress ? 'border-destructive' : ''}
                  />
                  {errors.streetAddress && (
                    <p className="text-sm text-destructive mt-1">{errors.streetAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className={errors.city ? 'border-destructive' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                      className={errors.state ? 'border-destructive' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-destructive mt-1">{errors.state}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">PIN Code *</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="560001"
                      className={errors.postalCode ? 'border-destructive' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Address Option */}
            {user && selectedAddressId === 'new' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-muted-foreground">Save this address for future orders</span>
              </label>
            )}

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-secondary/30 rounded-lg p-6 sticky top-28">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="flex gap-3"
                  >
                    <div className="w-16 h-20 rounded overflow-hidden bg-secondary/50 flex-shrink-0">
                      <img
                        src={cloudinaryUrl(item.product.images[0], { width: 200 })}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} / {item.color} × {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Input */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">{appliedCoupon.code}</span>
                      <span className="text-xs text-success">
                        (-₹{discount.toLocaleString('en-IN')})
                      </span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="text-success hover:text-success/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                    {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-success">Free</span>
                    ) : (
                      `₹${shippingCost.toLocaleString('en-IN')}`
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST{gstRateLabel ? ` (${gstRateLabel})` : ''}</span>
                  <span>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium">Payment Method</p>
                
                {/* Online Payment Option */}
                <label 
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                    paymentMethod === 'razorpay' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    paymentMethod === 'razorpay' ? "border-primary" : "border-muted-foreground"
                  )}>
                    {paymentMethod === 'razorpay' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Pay Online (UPI / Card / Net Banking)</span>
                </label>

                {/* Cash on Delivery Option */}
                <label 
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                    total < MIN_COD_AMOUNT 
                      ? "opacity-50 cursor-not-allowed border-border" 
                      : paymentMethod === 'cod' 
                        ? "border-primary bg-primary/5 cursor-pointer" 
                        : "border-border hover:border-muted-foreground cursor-pointer"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => total >= MIN_COD_AMOUNT && setPaymentMethod('cod')}
                    disabled={total < MIN_COD_AMOUNT}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    total < MIN_COD_AMOUNT 
                      ? "border-muted" 
                      : paymentMethod === 'cod' 
                        ? "border-primary" 
                        : "border-muted-foreground"
                  )}>
                    {paymentMethod === 'cod' && total >= MIN_COD_AMOUNT && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm">Cash on Delivery</span>
                    {total < MIN_COD_AMOUNT && (
                      <p className="text-xs text-muted-foreground">
                        Available for orders ₹{MIN_COD_AMOUNT.toLocaleString('en-IN')} and above
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Pay Button */}
              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePayment}
                disabled={(paymentMethod === 'razorpay' && (!isReady || isLoading)) || isProcessing}
              >
                {isLoading || isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === 'cod' ? (
                  <>
                    <Truck className="mr-2 h-4 w-4" />
                    Place Order (Pay on Delivery)
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ₹{total.toLocaleString('en-IN')}
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                {paymentMethod === 'cod' 
                  ? 'Pay cash when your order is delivered.'
                  : 'Secured by Razorpay. Your payment information is encrypted.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
