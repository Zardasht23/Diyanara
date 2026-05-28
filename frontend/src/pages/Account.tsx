import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Download,
  LogOut,
  Package,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { api, apiUrl } from '@/lib/api';
import type { Order, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const statusVariant: Record<string, any> = {
  PENDING: 'warning',
  PAID: 'success',
  FULFILLED: 'gold',
  CANCELLED: 'destructive',
  REFUNDED: 'secondary',
};

export function Account() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const justPaid = params.get('paid') === '1';
  const navigate = useNavigate();

  useEffect(() => {
    api<Order[]>('/orders/mine')
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (justPaid) {
      const t = setTimeout(() => {
        const next = new URLSearchParams(params);
        next.delete('paid');
        next.delete('order');
        setParams(next, { replace: true });
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [justPaid, params, setParams]);

  return (
    <div className="container py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
            My account
          </p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
            Hello, {user?.name || user?.email}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <Button asChild variant="outline">
              <Link to="/admin">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Admin dashboard
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </div>

      {justPaid && (
        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="font-serif text-lg">Merci! Your order is confirmed.</p>
          <p className="text-sm mt-1 text-emerald-800">
            A PostNord label is being generated automatically. You can track
            its status below.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order history
            </CardTitle>
            <CardDescription>
              Every La Voiture order in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Loading orders…
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  You haven’t placed any orders yet.
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/shop">Start shopping</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {orders.map((o) => (
                  <li key={o.id} className="py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          Order #{o.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(o.createdAt)} · {o.items.length}{' '}
                          {o.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={statusVariant[o.status] || 'secondary'}>
                          {o.status}
                        </Badge>
                        <p className="font-medium">
                          {formatPrice(o.totalCents, o.currency)}
                        </p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {o.items.map((i) => (
                        <li key={i.id}>
                          {i.quantity} × {i.productName} —{' '}
                          {formatPrice(i.unitPriceCents, o.currency)}
                        </li>
                      ))}
                    </ul>
                    {o.trackingNumber && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Truck className="h-4 w-4 text-champagne-600" />
                          PostNord tracking:
                        </span>
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {o.trackingNumber}
                        </code>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <ProfileCard />
      </div>
    </div>
  );
}

function ProfileCard() {
  const [me, setMe] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'DK',
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<User>('/users/me').then((u) => {
      setMe(u);
      setForm({
        name: u.name || '',
        phone: u.phone || '',
        addressLine1: u.addressLine1 || '',
        addressLine2: u.addressLine2 || '',
        city: u.city || '',
        postalCode: u.postalCode || '',
        country: u.country || 'DK',
      });
    });
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await api<User>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setMe(updated);
      setSavedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          My details
        </CardTitle>
        <CardDescription>
          {me?.email} — used at checkout and on PostNord labels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-phone">Phone</Label>
            <Input
              id="p-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+45 ..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-a1">Address</Label>
            <Input
              id="p-a1"
              value={form.addressLine1}
              onChange={(e) => set('addressLine1', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-a2">Apt, floor, c/o</Label>
            <Input
              id="p-a2"
              value={form.addressLine2}
              onChange={(e) => set('addressLine2', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="p-zip">Postal code</Label>
              <Input
                id="p-zip"
                inputMode="numeric"
                value={form.postalCode}
                onChange={(e) => set('postalCode', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-city">City</Label>
              <Input
                id="p-city"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-country">Country</Label>
            <select
              id="p-country"
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="DK">Denmark</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {error}
            </p>
          )}
          {savedAt && Date.now() - savedAt < 4000 && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-md p-3">
              Saved.
            </p>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full"
            variant="gold"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function downloadLabel(order: Order) {
  if (!order.labelUrl) return;
  const token = localStorage.getItem('lv_token');
  fetch(`${apiUrl}${order.labelUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
    .then((r) => r.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lavoiture-${order.id.slice(-8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
}
