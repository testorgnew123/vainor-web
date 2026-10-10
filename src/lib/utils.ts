import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cloudinaryUrl(url: string, options: { width?: number | 'auto' } = {}): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const { width = 'auto' } = options;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
