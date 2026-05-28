import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductCard } from '@/components/ProductCard';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'necklaces', label: 'Necklaces' },
  { id: 'earrings', label: 'Earrings' },
  { id: 'rings', label: 'Rings' },
  { id: 'bracelets', label: 'Bracelets' },
];

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: low → high' },
  { id: 'price-desc', label: 'Price: high → low' },
];

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const sort = params.get('sort') || 'featured';

  useEffect(() => {
    setLoading(true);
    api<Product[]>('/products')
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'all') list = list.filter((p) => p.category === category);
    switch (sort) {
      case 'newest':
        list = [...list].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'price-asc':
        list = [...list].sort((a, b) => a.priceCents - b.priceCents);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.priceCents - a.priceCents);
        break;
      default:
        list = [...list].sort((a, b) =>
          a.featured === b.featured ? 0 : a.featured ? -1 : 1,
        );
    }
    return list;
  }, [products, category, sort]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === 'all' || value === 'featured') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
          The shop
        </p>
        <h1 className="font-serif text-4xl md:text-6xl tracking-tight">
          All jewelry
        </h1>
        <p className="mt-4 text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}, each
          made in our Paris atelier.
        </p>
      </div>

      <div className="mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam('category', c.id)}
              className={cn(
                'h-9 px-4 rounded-full border text-sm transition-colors',
                category === c.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border hover:bg-accent',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm self-start md:self-auto"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            No pieces match these filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
