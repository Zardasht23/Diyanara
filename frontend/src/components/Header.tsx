import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
];

export function Header() {
  const count = useCart((s) => s.count());
  const user = useAuth((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-all',
        scrolled
          ? 'bg-background/90 backdrop-blur border-b border-border'
          : 'bg-background/40 backdrop-blur-sm',
      )}
    >
      <div className="container flex h-16 md:h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-serif text-2xl md:text-3xl tracking-tight italic">
            <span className="gold-gradient">La Voiture</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'text-sm tracking-wide uppercase transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-foreground/70',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(user ? '/account' : '/login')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-3">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'py-2 text-base tracking-wide uppercase',
                    isActive ? 'text-primary' : 'text-foreground/80',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="py-2 text-base tracking-wide uppercase text-foreground/80"
              >
                Admin
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
