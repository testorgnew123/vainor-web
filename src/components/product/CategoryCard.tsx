import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    image: string;
    href?: string;
  };
  className?: string;
  size?: 'default' | 'large';
}

export function CategoryCard({ category, className, size = 'default' }: CategoryCardProps) {
  return (
    <Link
      to={category.href || `/shop/${category.id}`}
      className={cn(
        'group relative block overflow-hidden rounded-lg img-zoom',
        size === 'large' ? 'aspect-[4/5] md:aspect-[3/4]' : 'aspect-[3/4]',
        className
      )}
    >
      <img
        src={category.image}
        alt={category.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <h3 className="font-display text-2xl md:text-3xl text-white mb-2">
          {category.name}
        </h3>
        <span className="inline-flex items-center text-sm text-white/90 font-medium underline-animate">
          Shop Now
        </span>
      </div>
    </Link>
  );
}
