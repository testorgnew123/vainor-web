import { Package, RefreshCw, Clock, MapPin } from 'lucide-react';

const shippingMethods = [
  {
    icon: Package,
    title: 'Standard Shipping',
    time: '5-7 Business Days',
    cost: 'Free on orders above ₹999',
  },
  {
    icon: Clock,
    title: 'Express Shipping',
    time: '2-3 Business Days',
    cost: '₹200 flat rate',
  },
  {
    icon: MapPin,
    title: 'Same Day Delivery',
    time: 'Same Day (Select Cities)',
    cost: '₹500 flat rate',
  },
];

export default function Shipping() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1920&q=80"
            alt="Shipping"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/40" />
        </div>
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-6xl font-display text-white mb-4 leading-tight">
            Shipping & Returns
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Fast, reliable delivery and hassle-free returns
          </p>
        </div>
      </section>

      {/* Shipping Methods */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-4">
              Shipping Options
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer multiple shipping options to ensure your order arrives when you need it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {shippingMethods.map((method) => (
              <div
                key={method.title}
                className="border border-border rounded-lg p-6 text-center hover:border-accent transition-colors"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
                  <method.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-medium text-lg mb-2">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{method.time}</p>
                <p className="text-sm font-medium">{method.cost}</p>
              </div>
            ))}
          </div>

          {/* Shipping Details */}
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="font-medium text-xl mb-4">Shipping Information</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <ul className="space-y-2">
                  <li>All orders are processed within 1-2 business days</li>
                  <li>Orders placed on weekends or holidays will be processed on the next business day</li>
                  <li>You will receive a confirmation email with tracking information once your order ships</li>
                  <li>Delivery times are estimates and not guaranteed</li>
                  <li>We currently ship to all major cities across India</li>
                  <li>For international shipping, please contact our customer service</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-xl mb-4">Order Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Once your order has shipped, you'll receive a tracking number via email. You can track your order:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Visit our <a href="/track-order" className="text-accent hover:underline">Track Order</a> page</li>
                <li>Check your email for tracking updates</li>
                <li>Log into your account to view order status</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Returns Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-accent" />
              </div>
              <h2 className="font-display text-3xl">Returns & Exchanges</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-xl mb-3">30-Day Return Policy</h3>
                <p className="text-muted-foreground">
                  We want you to be completely satisfied with your purchase. If you're not happy with your order,
                  you can return it within 30 days of delivery for a full refund or exchange.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-xl mb-3">Return Conditions</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Items must be unworn, unwashed, and in original condition</li>
                  <li>All original tags must be attached</li>
                  <li>Items must be returned in original packaging</li>
                  <li>Sale and clearance items are final sale and cannot be returned</li>
                  <li>Gift cards are non-refundable</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-xl mb-3">How to Return</h3>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li>Log into your account and go to Order History</li>
                  <li>Select the order you want to return and click "Request Return"</li>
                  <li>Choose the items you want to return and the reason</li>
                  <li>Print the prepaid return label we'll email you</li>
                  <li>Pack your items securely with all tags attached</li>
                  <li>Drop off your package at any authorized courier location</li>
                </ol>
              </div>

              <div>
                <h3 className="font-medium text-xl mb-3">Refunds</h3>
                <p className="text-muted-foreground mb-3">
                  Once we receive your return, we'll inspect it and process your refund within 5-7 business days.
                  Refunds will be issued to your original payment method.
                </p>
                <p className="text-muted-foreground">
                  <strong>Note:</strong> Shipping costs are non-refundable. If you received free shipping on your order,
                  the cost of return shipping will be deducted from your refund.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-xl mb-3">Exchanges</h3>
                <p className="text-muted-foreground">
                  To exchange an item for a different size or color, please return the original item and place a new order
                  for the item you want. This ensures you get your preferred item as quickly as possible.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-xl mb-3">Damaged or Defective Items</h3>
                <p className="text-muted-foreground mb-3">
                  If you receive a damaged or defective item, please contact us within 7 days of delivery with photos
                  of the damage. We'll arrange for a replacement or full refund at no cost to you.
                </p>
                <p className="text-muted-foreground">
                  Email us at: <a href="mailto:support@vainor.com" className="text-accent hover:underline">support@vainor.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Questions CTA */}
      <section className="py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our customer service team is here to help with any shipping or return inquiries.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
            >
              Contact Us
            </a>
            <a
              href="/faq"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              View FAQ
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
