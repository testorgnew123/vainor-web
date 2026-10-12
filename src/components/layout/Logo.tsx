import { cn } from '@/lib/utils';

interface LogoProps {
  /** Sizing classes for the icon <svg>, e.g. "h-12 md:h-16". */
  className?: string;
  /** Sizing classes for the wordmark text. Ignored when variant="icon". */
  wordmarkClassName?: string;
  /** 'full' = icon + "VAINOR" wordmark (default). 'icon' = mark only, for compact chrome. */
  variant?: 'full' | 'icon';
}

export function Logo({ className, wordmarkClassName, variant = 'full' }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <img
        src="/logo-mark.jpg"
        alt={variant === 'icon' ? 'Vainor' : ''}
        aria-hidden={variant === 'full' ? true : undefined}
        className={cn('w-auto object-contain rounded-md', className)}
      />
      {variant === 'full' && (
        <span
          className={cn(
            'font-display font-medium tracking-[0.2em] text-foreground leading-none',
            wordmarkClassName
          )}
        >
          VAINOR
        </span>
      )}
    </span>
  );
}
