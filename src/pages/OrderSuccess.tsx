import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderNumber = location.state?.orderNumber;

  if (!orderNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl mb-4">No Order Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find your order details.
          </p>
          <Button size="lg" onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-lg mx-auto px-4 py-12">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>

        <h1 className="font-display text-3xl md:text-4xl mb-4 animate-fade-in-up">
          Thank You for Your Order!
        </h1>

        <p className="text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Your order has been placed successfully. We'll send you an email confirmation shortly.
        </p>

        <div className="bg-secondary/30 rounded-lg p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Order Number</span>
          </div>
          <p className="font-mono text-xl font-medium">{orderNumber}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Button variant="outline" size="lg" asChild>
            <Link to="/shop">
              Continue Shopping
            </Link>
          </Button>
          <Button size="lg" asChild>
            <Link to="/orders">
              View Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
