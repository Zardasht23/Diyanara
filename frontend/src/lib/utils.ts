import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FREE_SHIPPING_THRESHOLD_CENTS = 25000;
export const FLAT_SHIPPING_CENTS = 6000;

export function calculateShippingCents(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
    ? 0
    : FLAT_SHIPPING_CENTS;
}

export function formatPrice(cents: number, currency = 'dkk') {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
