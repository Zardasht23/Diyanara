import { Link } from 'react-router-dom';
import { Leaf, Gem, HandHeart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blush-50 via-background to-background" />
        <div className="container py-20 md:py-32 text-center max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-4">
            Our story
          </p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl tracking-tight text-balance">
            A small atelier with a <em className="italic gold-gradient">big</em> love for detail.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Diyanara was founded in 2021 in a little Parisian apartment,
            with one bench, one torch, and the quiet conviction that
            jewelry should feel personal — not loud.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="container py-12 md:py-20 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=1000&q=80"
            alt="Founder portrait"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
            Designed by women, <br />
            <em className="italic">for women.</em>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            Each collection is shaped by our founder Camille and her small
            team of women goldsmiths. We sketch every piece by hand, prototype
            in wax, and refine until the design feels effortless — light
            enough to wear all day, considered enough to remember.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We name our collections after small, beloved things: a morning
            light, a rainy avenue, the quiet glow of dawn — diyanara.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/40 py-20 md:py-28">
        <div className="container">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
              Our values
            </p>
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
              Made slowly, made well.
            </h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Leaf className="h-5 w-5" />,
                t: 'Recycled gold',
                s: 'All our gold and silver is recycled, certified and re-refined in France.',
              },
              {
                icon: <Gem className="h-5 w-5" />,
                t: 'Lab-grown stones',
                s: 'Conflict-free, chemically identical, kinder to the earth and to the people who mine it.',
              },
              {
                icon: <HandHeart className="h-5 w-5" />,
                t: 'Small batches',
                s: 'We never mass produce. Every piece is finished and inspected by hand.',
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                t: 'Lifetime care',
                s: 'Complimentary polish, replating and repair — for as long as you wear it.',
              },
            ].map((v) => (
              <div
                key={v.t}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blush-100 text-blush-700">
                  {v.icon}
                </div>
                <h3 className="mt-4 font-serif text-xl">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {v.s}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-28 text-center max-w-2xl">
        <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
          Come browse the collection.
        </h2>
        <p className="mt-4 text-muted-foreground">
          New pieces every season — handpicked, hand-finished, ready to be
          loved.
        </p>
        <Button asChild className="mt-8" variant="gold" size="lg">
          <Link to="/shop">Shop the collection</Link>
        </Button>
      </section>
    </div>
  );
}
