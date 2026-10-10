import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    category: 'Orders & Payment',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, MasterCard, American Express), debit cards, UPI, net banking, and popular digital wallets including Paytm, PhonePe, and Google Pay. We also support Cash on Delivery for select pin codes.',
      },
      {
        question: 'Is it safe to use my credit card on your website?',
        answer:
          'Yes, absolutely. We use industry-standard SSL encryption to protect your payment information. Your card details are never stored on our servers and are processed securely through our payment gateway partners.',
      },
      {
        question: 'Can I modify or cancel my order after placing it?',
        answer:
          'You can cancel your order within 2 hours of placement if it hasn\'t been shipped yet. To cancel, go to your Order History and click "Cancel Order". For modifications, please contact our customer service team immediately.',
      },
      {
        question: 'Do you offer Cash on Delivery (COD)?',
        answer:
          'Yes, we offer COD for orders within India, subject to pin code availability. A nominal COD fee of ₹50 is charged per order. COD is available for orders up to ₹10,000.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    questions: [
      {
        question: 'How long will it take to receive my order?',
        answer:
          'Standard shipping takes 5-7 business days, Express shipping takes 2-3 business days, and Same Day Delivery is available in select cities. All orders are processed within 1-2 business days before shipping.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Currently, we ship within India only. However, we are working on expanding our international shipping capabilities. Please check back or contact us for updates on international delivery.',
      },
      {
        question: 'How can I track my order?',
        answer:
          'Once your order ships, you\'ll receive a tracking number via email. You can track your order by visiting the Track Order page, checking your email, or logging into your account to view order status.',
      },
      {
        question: 'What if I\'m not available to receive my delivery?',
        answer:
          'Our courier partners will attempt delivery 2-3 times. If you\'re unavailable, they\'ll leave a notice with instructions. You can also coordinate with the delivery partner directly using the contact number provided in your tracking updates.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      {
        question: 'What is your return policy?',
        answer:
          'We offer a 30-day return policy from the date of delivery. Items must be unworn, unwashed, with all original tags attached, and in original packaging. Sale and clearance items are final sale.',
      },
      {
        question: 'How do I initiate a return?',
        answer:
          'Log into your account, go to Order History, select the order you want to return, and click "Request Return". Choose the items and reason for return, then print the prepaid return label we\'ll email you.',
      },
      {
        question: 'When will I receive my refund?',
        answer:
          'Refunds are processed within 5-7 business days after we receive and inspect your return. The refund will be issued to your original payment method. Please allow an additional 3-5 business days for the amount to reflect in your account.',
      },
      {
        question: 'Can I exchange an item for a different size?',
        answer:
          'To exchange for a different size or color, please return the original item and place a new order for your preferred size. This ensures you get your item as quickly as possible.',
      },
    ],
  },
  {
    category: 'Products & Sizing',
    questions: [
      {
        question: 'How do I find my correct size?',
        answer:
          'Please refer to our detailed Size Guide page where you\'ll find measurement charts for all product categories. We recommend measuring yourself and comparing with our size charts for the best fit.',
      },
      {
        question: 'Are your products true to size?',
        answer:
          'Yes, our products generally run true to size. However, we recommend checking the specific product\'s size chart as some items may have a slim or relaxed fit. Customer reviews often include sizing feedback as well.',
      },
      {
        question: 'What materials are your products made from?',
        answer:
          'We use high-quality materials including 100% cotton, premium denim, linen, and sustainable fabrics. Specific material composition is listed on each product page. We prioritize comfort, durability, and sustainability in our material choices.',
      },
      {
        question: 'How should I care for my Nuuvelle products?',
        answer:
          'Care instructions are provided on the product label and product page. Generally, we recommend machine washing cold with similar colors, avoiding bleach, and tumble drying on low. For best results, follow the specific care instructions for each item.',
      },
    ],
  },
  {
    category: 'Account & Rewards',
    questions: [
      {
        question: 'Do I need an account to place an order?',
        answer:
          'While you can checkout as a guest, creating an account allows you to track orders, save addresses, manage your wishlist, and access exclusive member benefits.',
      },
      {
        question: 'How do I reset my password?',
        answer:
          'The password reset feature is currently in progress and will be released soon. For instant support, please contact us at support@nuuvelle.com.',
      },
      {
        question: 'Can I save multiple shipping addresses?',
        answer:
          'Yes! When logged in, you can save multiple addresses in your account. During checkout, simply select from your saved addresses or add a new one. You can also set a default address for faster checkout.',
      },
    ],
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left hover:text-accent transition-colors"
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1920&q=80"
            alt="FAQ"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/40" />
        </div>
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-6xl font-display text-white mb-4 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Find answers to common questions about ordering, shipping, returns, and more
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-12">
            {faqs.map((category) => (
              <div key={category.category}>
                <h2 className="font-display text-2xl mb-6">{category.category}</h2>
                <div className="bg-background border border-border rounded-lg overflow-hidden">
                  {category.questions.map((faq) => (
                    <FAQItem
                      key={faq.question}
                      question={faq.question}
                      answer={faq.answer}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-secondary/20">
        <div className="container text-center">
          <h2 className="font-display text-2xl mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Can't find the answer you're looking for? Our customer service team is here to help.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
            >
              Contact Us
            </a>
            <a
              href="mailto:support@nuuvelle.com"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
