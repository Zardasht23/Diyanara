import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api<Product>(`/products/${slug}`)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-xl bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-24 text-center">
        <h1 className="font-serif text-3xl">Piece not found</h1>
        <p className="mt-2 text-muted-foreground">
          The piece you were looking for is no longer available.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  return (
    <div className="container py-10 md:py-16">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="relative aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-blush-50">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {product.featured && (
            <Badge variant="gold" className="absolute top-4 left-4">
              Featured
            </Badge>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
            {product.category}
          </p>
          <h1 className="font-serif text-3xl md:text-5xl tracking-tight">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-medium">
            {formatPrice(product.priceCents, product.currency)}
          </p>

          <p className="mt-6 text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="inline-flex items-center border border-border rounded-full">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={outOfStock}
                className="h-11 w-11 inline-flex items-center justify-center rounded-l-full hover:bg-accent transition-colors disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-3 min-w-[2rem] text-center text-sm font-medium">
                {qty}
              </span>
              <button
                onClick={() =>
                  setQty((q) => Math.min(product.stock, q + 1))
                }
                disabled={outOfStock || qty >= product.stock}
                className="h-11 w-11 inline-flex items-center justify-center rounded-r-full hover:bg-accent transition-colors disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              variant="gold"
              className="flex-1"
              disabled={outOfStock}
              onClick={() => {
                add(product, qty);
                setAdded(true);
                setTimeout(() => setAdded(false), 1500);
              }}
            >
              {outOfStock
                ? 'Sold out'
                : added
                  ? 'Added to bag ✓'
                  : 'Add to bag'}
            </Button>
          </div>

          {!outOfStock && product.stock <= 3 && (
            <p className="mt-3 text-sm text-amber-700">
              Only {product.stock} left — once they’re gone, they’re gone.
            </p>
          )}

          {!outOfStock && (
            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full"
              onClick={() => {
                add(product, qty);
                navigate('/cart');
              }}
            >
              Buy now
            </Button>
          )}

          <div className="mt-10 space-y-3 border-t border-border pt-6">
            <div className="flex items-start gap-3 text-sm">
              <Truck className="h-5 w-5 text-champagne-600 mt-0.5" />
              <div>
                <p className="font-medium">Complimentary shipping</p>
                <p className="text-muted-foreground">
                  Free worldwide on orders over €120.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <ShieldCheck className="h-5 w-5 text-champagne-600 mt-0.5" />
              <div>
                <p className="font-medium">Lifetime warranty</p>
                <p className="text-muted-foreground">
                  Free polish & repair, for as long as you wear it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
