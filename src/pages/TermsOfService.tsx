export default function TermsOfService() {
  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using our website, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, 
                you are prohibited from using or accessing this site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">2. Use License</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to temporarily access the materials on our website for personal, 
                non-commercial transitory viewing only. This is the grant of a license, not a transfer 
                of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software on the website</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
                <li>Transfer the materials to another person</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">3. Products and Pricing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All prices are displayed in Indian Rupees (INR) and are inclusive of applicable taxes 
                unless otherwise stated. We reserve the right to modify prices at any time without 
                prior notice.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We make every effort to display accurate product information, including descriptions, 
                images, and pricing. However, we do not warrant that product descriptions or other 
                content is accurate, complete, or error-free.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">4. Orders and Payment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By placing an order, you warrant that you are legally capable of entering into binding 
                contracts. All orders are subject to acceptance and availability.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We accept payment via Razorpay and Cash on Delivery (COD). All payments are processed 
                securely and we do not store your payment card details.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">5. Shipping and Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                Delivery times are estimates and not guaranteed. We are not liable for any delays 
                caused by shipping carriers or circumstances beyond our control. Risk of loss and 
                title for items pass to you upon delivery to the carrier.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">6. Returns and Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                Please refer to our Shipping & Returns page for detailed information about our return 
                and refund policies. Returns are accepted within 7 days of delivery for eligible products 
                in their original condition.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall Nuuvelle or its suppliers be liable for any damages arising out of 
                the use or inability to use the materials on our website, even if we have been notified 
                of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">8. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws 
                of India, and you irrevocably submit to the exclusive jurisdiction of the courts in 
                that location.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">9. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to revise these terms of service at any time without notice. 
                By using this website, you are agreeing to be bound by the then-current version of 
                these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">10. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@nuuvelle.com" className="text-foreground hover:underline">
                  legal@nuuvelle.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
