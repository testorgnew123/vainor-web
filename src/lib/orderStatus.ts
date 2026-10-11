import { Clock, CheckCircle, Package, Truck, XCircle, RotateCcw, type LucideIcon } from 'lucide-react';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderStatusConfig {
  value: OrderStatus;
  label: string;
  icon: LucideIcon;
  /** bg+text combo, for Badge variant="secondary" contexts */
  badgeClassName: string;
  /** text-only color, for outline-Badge / border-current contexts */
  textClassName: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    value: 'pending',
    label: 'Pending',
    icon: Clock,
    badgeClassName: 'bg-muted text-muted-foreground',
    textClassName: 'text-muted-foreground',
  },
  confirmed: {
    value: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle,
    badgeClassName: 'bg-accent/10 text-foreground',
    textClassName: 'text-foreground',
  },
  processing: {
    value: 'processing',
    label: 'Processing',
    icon: Package,
    badgeClassName: 'bg-accent/20 text-foreground',
    textClassName: 'text-[#8F5E14]',
  },
  shipped: {
    value: 'shipped',
    label: 'Shipped',
    icon: Truck,
    badgeClassName: 'bg-accent/30 text-foreground',
    textClassName: 'text-[#826217]',
  },
  delivered: {
    value: 'delivered',
    label: 'Delivered',
    icon: CheckCircle,
    badgeClassName: 'bg-success/15 text-success',
    textClassName: 'text-success',
  },
  cancelled: {
    value: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    badgeClassName: 'bg-destructive/15 text-destructive',
    textClassName: 'text-destructive',
  },
  refunded: {
    value: 'refunded',
    label: 'Refunded',
    icon: RotateCcw,
    badgeClassName: 'bg-secondary text-secondary-foreground',
    textClassName: 'text-muted-foreground',
  },
};

/**
 * 6-item subset (no 'refunded') matching AdminOrders.tsx's existing filter/table exactly.
 * Do not expand to all 7 — that would add a filter option that never existed there.
 */
export const ADMIN_ORDER_STATUS_OPTIONS: OrderStatusConfig[] = [
  ORDER_STATUS_CONFIG.pending,
  ORDER_STATUS_CONFIG.confirmed,
  ORDER_STATUS_CONFIG.processing,
  ORDER_STATUS_CONFIG.shipped,
  ORDER_STATUS_CONFIG.delivered,
  ORDER_STATUS_CONFIG.cancelled,
];

export function getOrderStatusConfig(status: string): OrderStatusConfig | undefined {
  return ORDER_STATUS_CONFIG[status as OrderStatus];
}

/** Matches the old `statusColors[status] || 'bg-secondary'` fallback used across several files. */
export function getOrderStatusBadgeClass(status: string): string {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.badgeClassName ?? 'bg-secondary';
}

/** Matches the old `getStatusColor` default ('text-muted-foreground') used in AdminUsers.tsx. */
export function getOrderStatusTextClass(status: string): string {
  return ORDER_STATUS_CONFIG[status as OrderStatus]?.textClassName ?? 'text-muted-foreground';
}
