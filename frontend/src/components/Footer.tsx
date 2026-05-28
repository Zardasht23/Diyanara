import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border mt-24 bg-blush-50/40">
      <div className="container py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <h3 className="font-serif italic text-2xl">
            <span className="gold-gradient">La Voiture</span>
          </h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">
            Modern, feminine fine jewelry — designed in Paris, crafted in small
            batches with responsibly sourced materials.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@lavoiture.test"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-accent transition-colors"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Shop
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground transition-colors">All Jewelry</Link>
            </li>
            <li>
              <Link to="/shop?category=necklaces" className="hover:text-foreground transition-colors">Necklaces</Link>
            </li>
            <li>
              <Link to="/shop?category=earrings" className="hover:text-foreground transition-colors">Earrings</Link>
            </li>
            <li>
              <Link to="/shop?category=rings" className="hover:text-foreground transition-colors">Rings</Link>
            </li>
            <li>
              <Link to="/shop?category=bracelets" className="hover:text-foreground transition-colors">Bracelets</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Maison
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground transition-colors">About us</Link>
            </li>
            <li>
              <Link to="/account" className="hover:text-foreground transition-colors">My account</Link>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">Shipping & returns</a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors">Care guide</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} La Voiture. All rights reserved.</p>
          <p>Made with care in Paris.</p>
        </div>
      </div>
    </footer>
  );
}
