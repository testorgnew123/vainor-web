export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-5xl mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl mb-4">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                make a purchase, subscribe to our newsletter, or contact us for support.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This information may include your name, email address, postal address, phone number, 
                payment information, and any other information you choose to provide.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Send you transactional emails and order updates</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Detect, prevent, and address fraud and security issues</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">3. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                except to trusted partners who assist us in operating our website, conducting our business, 
                or servicing you, so long as those parties agree to keep this information confidential.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement a variety of security measures to maintain the safety of your personal 
                information. Your personal information is contained behind secured networks and is only 
                accessible by a limited number of persons who have special access rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">5. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies to help remember and process the items in your shopping cart, understand 
                and save your preferences for future visits, and compile aggregate data about site traffic 
                and site interaction.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@vainor.com" className="text-foreground hover:underline">
                  privacy@vainor.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
