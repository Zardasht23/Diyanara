import { Link } from 'react-router-dom';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 3;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-blush-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && <Badge variant="gold">Featured</Badge>}
          {outOfStock && <Badge variant="destructive">Sold out</Badge>}
          {!outOfStock && lowStock && <Badge variant="warning">Only {product.stock} left</Badge>}
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg leading-tight">
            {product.name}
          </h3>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
            {product.category}
          </p>
        </div>
        <p className="text-sm font-medium whitespace-nowrap pt-1">
          {formatPrice(product.priceCents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
