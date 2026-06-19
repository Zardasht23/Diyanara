/**
 * Centralized environment validation and accessors.
 * Fail fast in production when required secrets or config are missing.
 */

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isWeakSecret(value: string | undefined): boolean {
  if (!value) return true;
  if (value === 'dev-secret') return true;
  return value.includes('change-me');
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (isProduction() && isWeakSecret(secret)) {
    throw new Error(
      'JWT_SECRET must be set to a strong random value in production',
    );
  }
  return secret || 'dev-secret';
}

export function getTrustProxyHops(): number {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  return Number.isFinite(hops) && hops > 0 ? hops : 2;
}

export function validateProductionEnv(): void {
  if (!isProduction()) return;

  getJwtSecret();

  const cors = process.env.CORS_ORIGIN?.trim();
  if (!cors) {
    throw new Error('CORS_ORIGIN must be set in production');
  }

  const frontend = process.env.FRONTEND_URL?.trim();
  if (!frontend || frontend.includes('example.com')) {
    throw new Error('FRONTEND_URL must be set to your public domain in production');
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const mockPaymentsAllowed = process.env.ALLOW_MOCK_PAYMENTS === 'true';
  if (
    (!stripeKey || stripeKey.startsWith('sk_test_xxx')) &&
    !mockPaymentsAllowed
  ) {
    throw new Error(
      'STRIPE_SECRET_KEY must be configured in production, or set ALLOW_MOCK_PAYMENTS=true for staging',
    );
  }
}

export function getCorsOrigins(): string[] {
  const origins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
  if (origins?.length) return origins;
  if (isProduction()) {
    throw new Error('CORS_ORIGIN must be set in production');
  }
  return ['http://localhost:5173'];
}
