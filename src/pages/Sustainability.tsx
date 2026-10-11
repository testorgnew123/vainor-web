import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Recycle, Droplets, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';

const initiatives = [
  {
    icon: Leaf,
    title: 'Organic Materials',
    description: 'We prioritize organic cotton, linen, and other natural fibers that are grown without harmful pesticides or chemicals.',
  },
  {
    icon: Recycle,
    title: 'Recycled Packaging',
    description: 'All our packaging is made from 100% recycled materials and is fully recyclable, minimizing waste at every step.',
  },
  {
    icon: Droplets,
    title: 'Water Conservation',
    description: 'Our manufacturing processes use up to 50% less water compared to conventional methods, preserving this vital resource.',
  },
  {
    icon: Factory,
    title: 'Ethical Manufacturing',
    description: 'We work exclusively with factories that meet strict labor and environmental standards, ensuring fair wages and safe conditions.',
  },
];

export default function Sustainability() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1920&q=80"
            alt="Sustainability"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider uppercase bg-background/20 backdrop-blur-sm text-white rounded-full">
              Sustainability
            </span>
            <h1 className="text-4xl md:text-6xl font-display text-white mb-6 leading-tight">
              Fashion with a
              <br />
              <span className="italic">Conscience</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              We believe that great style should never come at the expense of our planet.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl mb-6">Our Commitment</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              At Vainor, sustainability isn't just a buzzword — it's woven into
              every decision we make. From the materials we source to the way we
              package and ship, we're constantly working to reduce our environmental
              impact.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We believe that the fashion industry can be a force for good. By choosing
              Vainor, you're supporting responsible practices that protect our planet
              for future generations.
            </p>
          </div>
        </div>
      </section>

      {/* Initiatives */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-2">Our Initiatives</h2>
            <p className="text-muted-foreground">
              The steps we're taking towards a more sustainable future
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {initiatives.map((initiative) => (
              <div
                key={initiative.title}
                className="flex gap-4 p-6 rounded-lg bg-background border border-border"
              >
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10">
                    <initiative.icon className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">{initiative.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {initiative.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Shop Sustainably
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Every purchase you make supports our mission to create a more sustainable
            fashion industry.
          </p>
          <Button size="lg" asChild>
            <Link to="/shop">
              Explore Collection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
