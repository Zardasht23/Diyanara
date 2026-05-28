import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import {
  calculateShippingCents,
  FREE_SHIPPING_THRESHOLD_CENTS,
  formatPrice,
} from '@/lib/utils';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressForm {
  name: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  country: string;
}

const empty: AddressForm = {
  name: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  postalCode: '',
  country: 'DK',
};

export function Checkout() {
  const { items, totalCents, clear } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<AddressForm>(empty);
  const [saveAddress, setSaveAddress] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = totalCents();
  const shipping = calculateShippingCents(subtotal);
  const total = subtotal + shipping;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    api<User>('/users/me')
      .then((me) => {
        setForm({
          name: me.name || '',
          phone: me.phone || '',
          address1: me.addressLine1 || '',
          address2: me.addressLine2 || '',
          city: me.city || '',
          postalCode: me.postalCode || '',
          country: me.country || 'DK',
        });
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate, submitting]);

  function set<K extends keyof AddressForm>(key: K, value: AddressForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api<{ url: string; mock?: boolean }>('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          shipping: {
            name: form.name,
            phone: form.phone || undefined,
            address1: form.address1,
            address2: form.address2 || undefined,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country || 'DK',
          },
          saveAddress,
        }),
      });
      clear();
      window.location.href = res.url;
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="container py-12 md:py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
        Checkout
      </p>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
        Shipping & payment
      </h1>

      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-champagne-600" />
              <h2 className="font-serif text-xl">Shipping address</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (for PostNord SMS)</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+45 ..."
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address1">Address</Label>
              <Input
                id="address1"
                required
                value={form.address1}
                onChange={(e) => set('address1', e.target.value)}
                autoComplete="address-line1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address2">Apartment, floor, c/o (optional)</Label>
              <Input
                id="address2"
                value={form.address2}
                onChange={(e) => set('address2', e.target.value)}
                autoComplete="address-line2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  value={form.postalCode}
                  onChange={(e) => set('postalCode', e.target.value)}
                  autoComplete="postal-code"
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="DK">Denmark</option>
              </select>
              <p className="text-xs text-muted-foreground">
                We currently ship within Denmark via PostNord.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm pt-2">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Save these details to my account
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            variant="gold"
            size="lg"
            className="w-full"
          >
            {submitting ? 'Redirecting to payment…' : 'Continue to payment'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            You will be redirected to Stripe to pay securely. Your card details
            never touch our servers.
          </p>
        </form>

        <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-border bg-secondary/30 p-6">
          <h2 className="font-serif text-2xl">Order summary</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {items.map((i) => (
              <li
                key={i.productId}
                className="flex items-start justify-between gap-3"
              >
                <span className="text-muted-foreground">
                  {i.quantity} × {i.name}
                </span>
                <span className="whitespace-nowrap">
                  {formatPrice(i.unitPriceCents * i.quantity, i.currency)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 text-sm border-t border-border pt-5">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">PostNord shipping</dt>
              <dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 mt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Free shipping on orders over{' '}
            {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}.
          </p>
        </aside>
      </div>
    </div>
  );
}
