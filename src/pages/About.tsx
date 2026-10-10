import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Leaf, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

const values = [
  {
    icon: Heart,
    title: 'Passion for Quality',
    description: 'Every piece is crafted with meticulous attention to detail, using only the finest materials sourced from trusted suppliers.',
  },
  {
    icon: Leaf,
    title: 'Sustainable Practices',
    description: 'We are committed to reducing our environmental footprint through responsible sourcing and eco-friendly manufacturing.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'We believe in building lasting relationships with our customers, artisans, and the communities we serve.',
  },
  {
    icon: Award,
    title: 'Timeless Design',
    description: 'Our designs transcend trends, focusing on classic silhouettes and versatile pieces that stand the test of time.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&q=80"
            alt="Nuuvelle Story"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-medium tracking-wider uppercase bg-background/20 backdrop-blur-sm text-white rounded-full">
              Our Story
            </span>
            <h1 className="text-4xl md:text-6xl font-display text-white mb-6 leading-tight">
              Crafted with
              <br />
              <span className="italic">Purpose</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              Founded with a vision to redefine men's fashion through quality,
              sustainability, and timeless design.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl mb-6">Who We Are</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Nuuvelle was born from a simple belief: that men deserve clothing that
              combines exceptional quality with conscious craftsmanship. We started with
              a small collection of essential pieces, each designed to be versatile,
              durable, and effortlessly stylish.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Today, we continue to uphold these values in every piece we create. From
              the fabrics we source to the artisans we partner with, every decision is
              guided by our commitment to quality and sustainability.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl mb-2">Our Values</h2>
            <p className="text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent/10 mb-4">
                  <value.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-medium text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4">
            Discover Our Collection
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Explore our carefully curated range of premium essentials designed for
            the modern man.
          </p>
          <Button size="lg" asChild>
            <Link to="/shop">
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
