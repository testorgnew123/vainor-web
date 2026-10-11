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
      <svg
        viewBox="0 0 40 40"
        className={cn('text-accent', className)}
        fill="none"
        aria-hidden={variant === 'full' ? true : undefined}
        role={variant === 'icon' ? 'img' : undefined}
        aria-label={variant === 'icon' ? 'Vainor' : undefined}
      >
        <path d="M4 6 L11 6 L20 26 L29 6 L36 6 L20 36 Z" fill="currentColor" />
      </svg>
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
