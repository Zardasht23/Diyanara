import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Gem, Leaf, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api<Product[]>('/products')
      .then((data) => setProducts(data.filter((p) => p.featured).slice(0, 4)))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blush-50 via-background to-champagne-50" />
          <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-blush-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-champagne-200/50 blur-3xl" />
        </div>

        <div className="container py-20 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-champagne-700 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              New collection · Spring 2026
            </p>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-balance">
              Jewels that whisper, <em className="italic gold-gradient">never shout.</em>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Diyanara creates modern, feminine fine jewelry — designed in
              Paris, crafted in small batches with responsibly sourced
              materials. Pieces meant to be worn every day, and remembered for
              a lifetime.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" variant="gold">
                <Link to="/shop">
                  Shop the collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">Our story</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-2"><Gem className="h-4 w-4 text-champagne-600" /> Lab-grown diamonds</span>
              <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-600" /> Recycled gold</span>
              <span className="flex items-center gap-2"><Heart className="h-4 w-4 text-blush-500" /> Made in France</span>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative aspect-[4/5] max-w-md mx-auto">
              <div className="absolute inset-0 -rotate-3 rounded-3xl bg-gradient-to-br from-blush-200 to-champagne-200" />
              <img
                src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&q=80"
                alt="Featured jewelry"
                className="absolute inset-0 rounded-3xl object-cover shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden md:block bg-background border border-border rounded-2xl shadow-xl p-4 w-56 rotate-[-4deg]">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">As worn in</p>
              <p className="font-serif text-lg leading-tight mt-1">Vogue Paris · 2026</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-background">
        <div className="container py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { t: 'Free shipping', s: 'On orders over €120' },
            { t: '30-day returns', s: 'Easy & complimentary' },
            { t: 'Lifetime warranty', s: 'On all fine pieces' },
            { t: 'Gift-ready', s: 'In our signature box' },
          ].map((x) => (
            <div key={x.t}>
              <p className="font-serif text-base md:text-lg">{x.t}</p>
              <p className="text-xs text-muted-foreground mt-1">{x.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="container py-20 md:py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
              Bestsellers
            </p>
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
              Loved by you
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-1 text-sm hover:text-primary transition-colors"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Editorial split */}
      <section className="bg-blush-50/50 py-20 md:py-28">
        <div className="container grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1000&q=80"
              alt="Atelier"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
              The atelier
            </p>
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
              Quietly crafted, <em className="italic">slowly worn.</em>
            </h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Each piece is sketched by hand in our Paris studio and made by a
              small team of artisans in the South of France. We work in tiny
              series — never mass produced — so every stone is set with care
              and every chain inspected by eye.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We believe jewelry should feel like a small, personal ritual: the
              kind of object you reach for without thinking, and pass on
              decades later.
            </p>
            <Button asChild className="mt-8" variant="outline" size="lg">
              <Link to="/about">Discover Diyanara</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
            Stay close
          </p>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
            Letters from the atelier
          </h2>
          <p className="mt-4 text-muted-foreground">
            New collections, behind-the-scenes, and the occasional poem. No
            spam — pinky promise.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you — we will be in touch.');
            }}
            className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 h-12 rounded-md border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" variant="gold" size="lg">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
