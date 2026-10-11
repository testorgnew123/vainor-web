import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Package, Truck } from "lucide-react";
import { format } from "date-fns";

import { apiCall } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrderStatusBadgeClass } from "@/lib/orderStatus";

type OrderRow = {
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

type OrderItemRow = {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  size: string;
  color: string;
  quantity: number;
  price: number;
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

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id: orderId } = useParams();
  const { user, isLoading: authLoading } = useAuth();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !orderId) return;
    void fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall("get-order", {
        user_id: user!.id,
        order_id: orderId,
      });

      if (!response.order) {
        setOrder(null);
        setItems([]);
        setIsLoading(false);
        return;
      }

      setOrder(response.order as OrderRow);
      setItems((response.items ?? []) as OrderItemRow[]);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("We couldn't load this order. Please try again.");
    }

    setIsLoading(false);
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 md:py-12">
          <Button variant="ghost" asChild>
            <Link to="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Unable to load order</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{error}</p>
              <div className="mt-4">
                <Button onClick={fetchOrder}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 md:py-12">
          <Button variant="ghost" asChild>
            <Link to="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>

          <div className="mt-10 text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-6">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl mb-4">Order not found</h1>
            <p className="text-muted-foreground">
              This order either doesn’t exist or doesn’t belong to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const addr = order.shipping_address;
  const fullName = getAddressField(addr, "full_name") ?? getAddressField(addr, "fullName");
  const street = getAddressField(addr, "street_address") ?? getAddressField(addr, "street");
  const city = getAddressField(addr, "city");
  const state = getAddressField(addr, "state");
  const postal = getAddressField(addr, "postal_code") ?? getAddressField(addr, "postalCode");
  const phone = getAddressField(addr, "phone");

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" asChild>
            <Link to="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <Button variant="outline" onClick={fetchOrder}>Refresh</Button>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="font-display text-3xl md:text-4xl">{order.order_number}</h1>
            <Badge
              variant="secondary"
              className={getOrderStatusBadgeClass(String(order.status))}
            >
              {String(order.status).charAt(0).toUpperCase() + String(order.status).slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {format(new Date(order.created_at), "MMM d, yyyy")}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-muted-foreground">No items found for this order.</p>
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
                                Size: {it.size}    Color: {it.color}
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
                {order.payment_id ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-xs">{order.payment_id}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
