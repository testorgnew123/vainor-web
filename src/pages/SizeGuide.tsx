import { Ruler } from 'lucide-react';

const shirtSizes = [
  { size: 'S', chest: '36-38', waist: '30-32', length: '27-28' },
  { size: 'M', chest: '38-40', waist: '32-34', length: '28-29' },
  { size: 'L', chest: '40-42', waist: '34-36', length: '29-30' },
  { size: 'XL', chest: '42-44', waist: '36-38', length: '30-31' },
  { size: 'XXL', chest: '44-46', waist: '38-40', length: '31-32' },
];

const jeansSizes = [
  { size: '28', waist: '28', hip: '34', inseam: '32' },
  { size: '30', waist: '30', hip: '36', inseam: '32' },
  { size: '32', waist: '32', hip: '38', inseam: '32' },
  { size: '34', waist: '34', hip: '40', inseam: '32' },
  { size: '36', waist: '36', hip: '42', inseam: '32' },
  { size: '38', waist: '38', hip: '44', inseam: '32' },
];

const tShirtSizes = [
  { size: 'S', chest: '36-38', length: '26-27', shoulder: '16-17' },
  { size: 'M', chest: '38-40', length: '27-28', shoulder: '17-18' },
  { size: 'L', chest: '40-42', length: '28-29', shoulder: '18-19' },
  { size: 'XL', chest: '42-44', length: '29-30', shoulder: '19-20' },
  { size: 'XXL', chest: '44-46', length: '30-31', shoulder: '20-21' },
];

export default function SizeGuide() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1920&q=80"
            alt="Size Guide"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/40" />
        </div>
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-6xl font-display text-white mb-4 leading-tight">
            Size Guide
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Find your perfect fit with our comprehensive sizing charts
          </p>
        </div>
      </section>

      {/* How to Measure */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Ruler className="h-6 w-6 text-accent" />
              </div>
              <h2 className="font-display text-3xl">How to Measure</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="font-medium text-lg mb-4">For Tops (Shirts & T-Shirts)</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Chest:</strong> Measure around the fullest part of your chest, keeping the tape measure horizontal
                  </li>
                  <li>
                    <strong className="text-foreground">Waist:</strong> Measure around your natural waistline, keeping the tape measure comfortably loose
                  </li>
                  <li>
                    <strong className="text-foreground">Length:</strong> Measure from the highest point of your shoulder to the desired length
                  </li>
                  <li>
                    <strong className="text-foreground">Shoulder:</strong> Measure from one shoulder point to the other across your back
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-lg mb-4">For Bottoms (Jeans & Trousers)</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Waist:</strong> Measure around your natural waistline where you normally wear your pants
                  </li>
                  <li>
                    <strong className="text-foreground">Hip:</strong> Measure around the fullest part of your hips
                  </li>
                  <li>
                    <strong className="text-foreground">Inseam:</strong> Measure from the crotch seam to the bottom of the leg
                  </li>
                  <li>
                    <strong className="text-foreground">Outseam:</strong> Measure from the top of the waistband to the bottom of the leg
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-6">
              <h3 className="font-medium mb-3">Measuring Tips</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Use a flexible measuring tape for accurate measurements</li>
                <li>Measure over light clothing or directly on skin for best results</li>
                <li>Keep the tape measure snug but not tight</li>
                <li>If you're between sizes, we recommend sizing up for a more relaxed fit</li>
                <li>All measurements are in inches unless otherwise specified</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Size Charts */}
      <section className="py-16 bg-secondary/20">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Shirts */}
            <div>
              <h2 className="font-display text-2xl mb-6">Shirts Size Chart</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-accent/10">
                      <th className="px-6 py-4 text-left font-medium">Size</th>
                      <th className="px-6 py-4 text-left font-medium">Chest (in)</th>
                      <th className="px-6 py-4 text-left font-medium">Waist (in)</th>
                      <th className="px-6 py-4 text-left font-medium">Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shirtSizes.map((row) => (
                      <tr key={row.size} className="border-t border-border">
                        <td className="px-6 py-4 font-medium">{row.size}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.chest}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.waist}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* T-Shirts */}
            <div>
              <h2 className="font-display text-2xl mb-6">T-Shirts Size Chart</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-accent/10">
                      <th className="px-6 py-4 text-left font-medium">Size</th>
                      <th className="px-6 py-4 text-left font-medium">Chest (in)</th>
                      <th className="px-6 py-4 text-left font-medium">Length (in)</th>
                      <th className="px-6 py-4 text-left font-medium">Shoulder (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tShirtSizes.map((row) => (
                      <tr key={row.size} className="border-t border-border">
                        <td className="px-6 py-4 font-medium">{row.size}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.chest}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.length}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.shoulder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Jeans & Trousers */}
            <div>
              <h2 className="font-display text-2xl mb-6">Jeans & Trousers Size Chart</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-background rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-accent/10">
                      <th className="px-6 py-4 text-left font-medium">Size</th>
                      <th className="px-6 py-4 text-left font-medium">Waist (in)</th>
                      <th className="px-6 py-4 text-left font-medium">Hip (in)</th>
                      <th className="px-6 py-4 text-left font-medium">Inseam (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jeansSizes.map((row) => (
                      <tr key={row.size} className="border-t border-border">
                        <td className="px-6 py-4 font-medium">{row.size}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.waist}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.hip}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.inseam}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fit Guide */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl mb-8 text-center">Fit Guide</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-accent/10 rounded-lg p-6 mb-4">
                  <h3 className="font-medium text-lg mb-2">Slim Fit</h3>
                  <p className="text-sm text-muted-foreground">
                    Tailored close to the body with minimal ease. Best for a modern, streamlined silhouette.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-accent/10 rounded-lg p-6 mb-4">
                  <h3 className="font-medium text-lg mb-2">Regular Fit</h3>
                  <p className="text-sm text-muted-foreground">
                    Classic fit with comfortable ease. Offers freedom of movement without being oversized.
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-accent/10 rounded-lg p-6 mb-4">
                  <h3 className="font-medium text-lg mb-2">Relaxed Fit</h3>
                  <p className="text-sm text-muted-foreground">
                    Loose and comfortable with generous ease. Perfect for a casual, laid-back look.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-16 bg-secondary/20">
        <div className="container text-center">
          <h2 className="font-display text-2xl mb-4">Need Help Finding Your Size?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our customer service team is happy to assist you with sizing questions.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}
