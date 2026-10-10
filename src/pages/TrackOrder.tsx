import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Package, Search, Truck } from "lucide-react";
import { format } from "date-fns";

import { apiCall } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type OrderData = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_id: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  shipping_address: unknown;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  size: string;
  color: string;
  quantity: number;
  price: number;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

function formatINR(value: number) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getAddressField(addr: unknown, key: string): string | undefined {
  if (!isRecord(addr)) return undefined;
  const val = addr[key];
  return typeof val === "string" ? val : undefined;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast({
        title: "Order number required",
        description: "Please enter your order number",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter the email used for the order",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setOrder(null);
    setItems([]);

    try {
      const data = await apiCall("get-guest-order", {
        order_number: orderNumber.trim(),
        email: email.trim().toLowerCase(),
      });

      if (!data.success || !data.order) {
        toast({
          title: "Order not found",
          description: data.error || "Please check your order number and email address.",
          variant: "destructive",
        });
        return;
      }

      setOrder(data.order);
      setItems(data.items || []);
    } catch (err) {
      console.error("Error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: Number(order.subtotal ?? 0),
      shipping: Number(order.shipping_cost ?? 0),
      tax: Number(order.tax ?? 0),
      discount: Number(order.discount ?? 0),
      total: Number(order.total ?? 0),
    };
  }, [order]);

  const addr = order?.shipping_address;
  const fullName = getAddressField(addr, "full_name") ?? getAddressField(addr, "fullName");
  const street = getAddressField(addr, "street_address") ?? getAddressField(addr, "street");
  const city = getAddressField(addr, "city");
  const state = getAddressField(addr, "state");
  const postal = getAddressField(addr, "postal_code") ?? getAddressField(addr, "postalCode");
  const phone = getAddressField(addr, "phone");

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          {user && (
            <Button variant="outline" asChild>
              <Link to="/orders">View All Orders</Link>
            </Button>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl md:text-4xl mb-2">Track Your Order</h1>
            <p className="text-muted-foreground">
              Enter your order number and email to view your order status
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Order
              </CardTitle>
              <CardDescription>
                Enter the order number from your confirmation email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="e.g., NVL-20260201-1234"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="The email used for your order"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {hasSearched && !isLoading && !order && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Order not found. Please check your order number and email address.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Note: This page is for guest orders only. If you placed an order while logged in,{" "}
                <Link to="/orders" className="text-primary hover:underline">
                  view your orders here
                </Link>
                .
              </p>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{order.order_number}</h2>
                  <p className="text-sm text-muted-foreground">
                    Placed on {format(new Date(order.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[String(order.status)] || "bg-secondary"}
                >
                  {String(order.status).charAt(0).toUpperCase() + String(order.status).slice(1)}
                </Badge>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {items.length === 0 ? (
                        <p className="text-muted-foreground">No items found.</p>
                      ) : (
                        <div className="space-y-4">
                          {items.map((it) => (
                            <div key={it.id} className="flex items-start gap-4">
                              <div className="h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                                {it.product_image ? (
                                  <img
                                    src={it.product_image}
                                    alt={it.product_name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{it.product_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Size: {it.size}    Color: {it.color}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Qty: {it.quantity}</p>
                                  </div>
                                  <p className="font-medium">
                                    {formatINR(Number(it.price) * Number(it.quantity))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping address</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {fullName ? <p className="font-medium">{fullName}</p> : null}
                        {street ? <p>{street}</p> : null}
                        {(city || state || postal) ? (
                          <p>
                            {[city, state, postal].filter(Boolean).join(", ")}
                          </p>
                        ) : null}
                        {phone ? <p className="text-sm text-muted-foreground">{phone}</p> : null}
                      </div>
                    </CardContent>
                  </Card>

                  {(order.tracking_number || order.shipped_at || order.delivered_at) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Truck className="h-5 w-5" />
                          Tracking
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {order.tracking_number ? (
                          <p>
                            <span className="text-muted-foreground">Tracking number:</span>{" "}
                            <span className="font-mono">{order.tracking_number}</span>
                          </p>
                        ) : null}
                        {order.shipped_at ? (
                          <p className="text-sm text-muted-foreground">
                            Shipped on {format(new Date(order.shipped_at), "MMM d, yyyy")}
                          </p>
                        ) : null}
                        {order.delivered_at ? (
                          <p className="text-sm text-muted-foreground">
                            Delivered on {format(new Date(order.delivered_at), "MMM d, yyyy")}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Order summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!summary ? null : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatINR(summary.subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>{formatINR(summary.shipping)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <span>{formatINR(summary.tax)}</span>
                          </div>
                          {summary.discount > 0 ? (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Discount</span>
                              <span>-{formatINR(summary.discount)}</span>
                            </div>
                          ) : null}

                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Total</span>
                            <span className="font-medium">{formatINR(summary.total)}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="capitalize">{order.payment_status}</span>
                      </div>
                      {order.payment_method ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Method</span>
                          <span className="capitalize">{order.payment_method}</span>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
