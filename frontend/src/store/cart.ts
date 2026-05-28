import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/types';

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  unitPriceCents: number;
  currency: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCents: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === product.id,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + quantity, product.stock),
                    }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                unitPriceCents: product.priceCents,
                currency: product.currency,
                quantity: Math.min(quantity, product.stock),
                stock: product.stock,
              },
            ],
          };
        }),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalCents: () =>
        get().items.reduce(
          (sum, i) => sum + i.unitPriceCents * i.quantity,
          0,
        ),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'lv_cart' },
  ),
);
