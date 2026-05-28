import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/button';
import {
  calculateShippingCents,
  FREE_SHIPPING_THRESHOLD_CENTS,
  formatPrice,
} from '@/lib/utils';

export function Cart() {
  const { items, setQuantity, remove, totalCents } = useCart();
  const navigate = useNavigate();

  const subtotal = totalCents();
  const shipping = calculateShippingCents(subtotal);
  const total = subtotal + shipping;
  const missingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_CENTS - subtotal,
  );

  if (items.length === 0) {
    return (
      <div className="container py-24 text-center">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="mt-6 font-serif text-3xl md:text-4xl">
          Your bag is empty
        </h1>
        <p className="mt-3 text-muted-foreground">
          Discover our latest pieces — handpicked from the atelier.
        </p>
        <Button asChild className="mt-8" variant="gold" size="lg">
          <Link to="/shop">Shop the collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
        Your bag
      </h1>

      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.productId} className="py-6 flex gap-4">
              <div className="h-28 w-24 sm:h-32 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden bg-blush-50">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-lg">{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatPrice(item.unitPriceCents, item.currency)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(item.productId)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center border border-border rounded-full">
                    <button
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      className="h-9 w-9 inline-flex items-center justify-center rounded-l-full hover:bg-accent transition-colors"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-3 text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      className="h-9 w-9 inline-flex items-center justify-center rounded-r-full hover:bg-accent transition-colors"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-medium">
                    {formatPrice(
                      item.unitPriceCents * item.quantity,
                      item.currency,
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-border bg-secondary/30 p-6">
          <h2 className="font-serif text-2xl">Order summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Shipping <span className="text-xs">(PostNord)</span>
              </dt>
              <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
            </div>
            {missingForFreeShipping > 0 && (
              <p className="text-xs text-champagne-700">
                Add {formatPrice(missingForFreeShipping)} more for free shipping.
              </p>
            )}
            <div className="flex justify-between border-t border-border pt-3 mt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Button
            onClick={() => navigate('/checkout')}
            variant="gold"
            size="lg"
            className="mt-6 w-full"
          >
            Continue to checkout
          </Button>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Free PostNord shipping in Denmark on orders over{' '}
            {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}.
          </p>
        </aside>
      </div>
    </div>
  );
}
