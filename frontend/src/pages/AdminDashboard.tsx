import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  CircleDollarSign,
  Download,
  Package,
  Pencil,
  Plus,
  Printer,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { api, apiUrl } from '@/lib/api';
import type { Order, OrderStatus, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDate, formatPrice } from '@/lib/utils';

type Tab = 'overview' | 'products' | 'orders';

const statusVariant: Record<string, any> = {
  PENDING: 'warning',
  PAID: 'success',
  FULFILLED: 'gold',
  CANCELLED: 'destructive',
  REFUNDED: 'secondary',
};

const STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'FULFILLED',
  'CANCELLED',
  'REFUNDED',
];

async function downloadLabel(order: Order) {
  if (!order.labelUrl) return;
  const token = localStorage.getItem('diyanara_token');
  const res = await fetch(`${apiUrl}${order.labelUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    alert('Could not download label');
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diyanara-${order.id.slice(-8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function printLabel(order: Order) {
  if (!order.labelUrl) return;
  const token = localStorage.getItem('diyanara_token');
  const res = await fetch(`${apiUrl}${order.labelUrl}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    alert('Could not load label');
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const w = window.open(url);
  if (w) w.addEventListener('load', () => w.print());
}

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [p, o, u] = await Promise.all([
        api<Product[]>('/products/admin'),
        api<Order[]>('/orders'),
        api<any[]>('/users'),
      ]);
      setProducts(p);
      setOrders(o);
      setUsers(u);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((o) => o.status === 'PAID' || o.status === 'FULFILLED')
      .reduce((sum, o) => sum + o.totalCents, 0);
    return {
      revenue,
      orderCount: orders.length,
      productCount: products.length,
      customerCount: users.filter((u) => u.role === 'CUSTOMER').length,
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= 3).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      awaitingShipment: orders.filter(
        (o) => o.status === 'PAID' && !!o.labelUrl,
      ).length,
    };
  }, [orders, products, users]);

  async function regenerateLabel(order: Order) {
    try {
      await api(`/orders/${order.id}/label`, { method: 'POST' });
      await refresh();
    } catch (e: any) {
      alert(e.message || 'Could not regenerate label');
    }
  }

  return (
    <div className="container py-10 md:py-14">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
            Maison
          </p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
            Admin dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your collection, stock, orders and PostNord labels.
          </p>
        </div>
        <ProductDialog onSaved={refresh}>
          <Button variant="gold">
            <Plus className="h-4 w-4 mr-2" />
            New product
          </Button>
        </ProductDialog>
      </div>

      <div className="flex gap-1 border-b border-border mb-8">
        {(
          [
            ['overview', 'Overview'],
            ['products', 'Products'],
            ['orders', 'Orders'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-3 text-sm border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CircleDollarSign className="h-5 w-5" />}
              label="Revenue"
              value={formatPrice(stats.revenue)}
              hint={`${stats.orderCount} orders`}
            />
            <StatCard
              icon={<Package className="h-5 w-5" />}
              label="Products"
              value={String(stats.productCount)}
              hint={`${stats.outOfStock} sold out · ${stats.lowStock} low`}
            />
            <StatCard
              icon={<Boxes className="h-5 w-5" />}
              label="Awaiting shipment"
              value={String(stats.awaitingShipment)}
              hint="Paid, label ready"
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Customers"
              value={String(stats.customerCount)}
              hint="Registered accounts"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ready to ship</CardTitle>
              <CardDescription>
                Paid orders with a generated PostNord label.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.filter((o) => o.status === 'PAID' && o.labelUrl)
                .length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing to ship right now.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {orders
                    .filter((o) => o.status === 'PAID' && o.labelUrl)
                    .map((o) => (
                      <li
                        key={o.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="text-sm">
                          <p className="font-medium">
                            #{o.id.slice(-8).toUpperCase()} · {o.user?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.shippingName} — {o.shippingAddress1},{' '}
                            {o.shippingZip} {o.shippingCity}
                          </p>
                          {o.trackingNumber && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Tracking:{' '}
                              <span className="font-mono">
                                {o.trackingNumber}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printLabel(o)}
                          >
                            <Printer className="h-4 w-4 mr-1.5" />
                            Print
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadLabel(o)}
                          >
                            <Download className="h-4 w-4 mr-1.5" />
                            PDF
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock alerts</CardTitle>
              <CardDescription>
                Pieces that are out of stock or running low.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.filter((p) => p.stock <= 3).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Everything looks well stocked.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {products
                    .filter((p) => p.stock <= 3)
                    .map((p) => (
                      <li
                        key={p.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover bg-muted"
                          />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {p.stock === 0 ? (
                            <Badge variant="destructive">Sold out</Badge>
                          ) : (
                            <Badge variant="warning">{p.stock} left</Badge>
                          )}
                          <StockEditor product={p} onSaved={refresh} />
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'products' && (
        <Card>
          <CardHeader>
            <CardTitle>All products</CardTitle>
            <CardDescription>
              Edit details, stock and visibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 font-medium">Product</th>
                      <th className="py-3 font-medium">Category</th>
                      <th className="py-3 font-medium">Price</th>
                      <th className="py-3 font-medium">Stock</th>
                      <th className="py-3 font-medium">Status</th>
                      <th className="py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="h-10 w-10 rounded-md object-cover bg-muted"
                            />
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {p.name}
                                {p.featured && (
                                  <Star className="h-3.5 w-3.5 text-champagne-500 fill-champagne-500" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.slug} · {p.weightGrams}g
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {p.category}
                        </td>
                        <td className="py-3">
                          {formatPrice(p.priceCents, p.currency)}
                        </td>
                        <td className="py-3">
                          <StockEditor product={p} onSaved={refresh} />
                        </td>
                        <td className="py-3">
                          {!p.active ? (
                            <Badge variant="secondary">Hidden</Badge>
                          ) : p.stock === 0 ? (
                            <Badge variant="destructive">Sold out</Badge>
                          ) : p.stock <= 3 ? (
                            <Badge variant="warning">Low</Badge>
                          ) : (
                            <Badge variant="success">In stock</Badge>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-1">
                            <ProductDialog product={p} onSaved={refresh}>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </ProductDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete"
                              onClick={async () => {
                                if (!confirm(`Delete "${p.name}"?`)) return;
                                await api(`/products/${p.id}`, {
                                  method: 'DELETE',
                                });
                                refresh();
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Print PostNord labels and update fulfilment status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">
                No orders yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {orders.map((o) => (
                  <li key={o.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          #{o.id.slice(-8).toUpperCase()} ·{' '}
                          {formatPrice(o.totalCents, o.currency)}{' '}
                          <span className="text-muted-foreground">
                            ({o.items.length}{' '}
                            {o.items.length === 1 ? 'item' : 'items'})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(o.createdAt)} · {o.user?.email}
                        </p>
                        {o.shippingAddress1 && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">{o.shippingName}</span>
                            {o.shippingPhone && (
                              <span className="text-muted-foreground">
                                {' '}
                                · {o.shippingPhone}
                              </span>
                            )}
                            <br />
                            <span className="text-muted-foreground">
                              {o.shippingAddress1}
                              {o.shippingAddress2
                                ? `, ${o.shippingAddress2}`
                                : ''}
                              , {o.shippingZip} {o.shippingCity},{' '}
                              {o.shippingCountry}
                            </span>
                          </p>
                        )}
                        {o.trackingNumber && (
                          <p className="text-xs text-muted-foreground mt-1">
                            PostNord:{' '}
                            <span className="font-mono">
                              {o.trackingNumber}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={statusVariant[o.status]}>
                          {o.status}
                        </Badge>
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                          value={o.status}
                          onChange={async (e) => {
                            const status = e.target.value as OrderStatus;
                            await api(`/orders/${o.id}/status`, {
                              method: 'PATCH',
                              body: JSON.stringify({ status }),
                            });
                            refresh();
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          {o.labelUrl ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => printLabel(o)}
                              >
                                <Printer className="h-4 w-4 mr-1.5" />
                                Print label
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadLabel(o)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regenerateLabel(o)}
                              disabled={!o.shippingAddress1}
                            >
                              Generate label
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="mt-2 font-serif text-3xl tracking-tight">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function StockEditor({
  product,
  onSaved,
}: {
  product: Product;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(product.stock);
  const [saving, setSaving] = useState(false);
  const dirty = value !== product.stock;

  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
        className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm"
      />
      <Button
        variant={dirty ? 'default' : 'ghost'}
        size="sm"
        disabled={!dirty || saving}
        onClick={async () => {
          setSaving(true);
          try {
            await api(`/products/${product.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ stock: value }),
            });
            onSaved();
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? '…' : 'Save'}
      </Button>
    </div>
  );
}

function ProductDialog({
  children,
  product,
  onSaved,
}: {
  children: React.ReactNode;
  product?: Product;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    category: product?.category || 'necklaces',
    priceCents: product?.priceCents ?? 99900,
    currency: product?.currency || 'dkk',
    imageUrl: product?.imageUrl || '',
    stock: product?.stock ?? 10,
    weightGrams: product?.weightGrams ?? 50,
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!product;

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function autoSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        await api(`/products/${product!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
      } else {
        await api('/products', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setOpen(false);
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit product' : 'New product'}
          </DialogTitle>
          <DialogDescription>
            Provide details, then save. Hidden products won’t appear in the
            shop.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => {
                  set('name', e.target.value);
                  if (!isEdit) set('slug', autoSlug(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                required
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="price">Price (øre, 1 DKK = 100)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                required
                value={form.priceCents}
                onChange={(e) =>
                  set('priceCents', Math.max(0, Number(e.target.value)))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) =>
                  set('stock', Math.max(0, Number(e.target.value)))
                }
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="necklaces">Necklaces</option>
                <option value="earrings">Earrings</option>
                <option value="rings">Rings</option>
                <option value="bracelets">Bracelets</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                min={1}
                value={form.weightGrams}
                onChange={(e) =>
                  set('weightGrams', Math.max(1, Number(e.target.value)))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Visible in shop
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Featured
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gold" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
