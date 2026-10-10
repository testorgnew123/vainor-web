import { useCallback, useEffect, useState } from 'react';
import { apiCall } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

interface PaymentParams {
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  onSuccess?: (response: RazorpayResponse) => void;
  onError?: (error: Error) => void;
  onDismiss?: () => void;
}

export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast({
        title: 'Error',
        description: 'Failed to load payment gateway',
        variant: 'destructive',
      });
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [toast]);

  const createOrder = useCallback(async (params: CreateOrderParams) => {
    const data = await apiCall('create-razorpay-order', params);
    return data;
  }, []);

  const verifyPayment = useCallback(async (
    response: RazorpayResponse,
    orderData?: Record<string, unknown>
  ) => {
    const data = await apiCall('verify-payment', {
      ...response,
      order_data: orderData,
    });
    return data;
  }, []);

  const initiatePayment = useCallback(async (params: PaymentParams) => {
    if (!isScriptLoaded) {
      throw new Error('Razorpay script not loaded');
    }

    setIsLoading(true);

    try {
      // Create order on backend
      const orderData = await createOrder({
        amount: Math.round(params.amount * 100), // Convert to paise
        currency: params.currency || 'INR',
        notes: params.notes,
      });

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: params.name || 'Nuuvelle',
        description: params.description || 'Purchase',
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            await params.onSuccess?.(response);
          } catch (error) {
            params.onError?.(error as Error);
          }
        },
        prefill: params.prefill,
        notes: params.notes,
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            params.onDismiss?.();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      setIsLoading(false);
      params.onError?.(error as Error);
      throw error;
    }
  }, [isScriptLoaded, createOrder]);

  return {
    initiatePayment,
    verifyPayment,
    createOrder,
    isLoading,
    isReady: isScriptLoaded,
  };
}
