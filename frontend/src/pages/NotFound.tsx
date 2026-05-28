import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-champagne-700 mb-3">
        404
      </p>
      <h1 className="font-serif text-4xl md:text-6xl tracking-tight">
        Page not found
      </h1>
      <p className="mt-4 text-muted-foreground">
        The page you were looking for has wandered off.
      </p>
      <Button asChild className="mt-8" variant="outline">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
