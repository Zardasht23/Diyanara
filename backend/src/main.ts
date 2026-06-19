import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, raw } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import {
  getCorsOrigins,
  getTrustProxyHops,
  validateProductionEnv,
} from './config/env';
import { ensureDataDirs } from './config/paths';

async function bootstrap() {
  validateProductionEnv();
  await ensureDataDirs();

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Cloudflare → host Nginx → container Nginx → backend
  app.getHttpAdapter().getInstance().set('trust proxy', getTrustProxyHops());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again later' },
  });
  app.use('/auth/login', authLimiter);
  app.use('/auth/register', authLimiter);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      req.path === '/health' || req.path === '/stripe/webhook',
  });
  app.use(limiter);

  app.use('/stripe/webhook', raw({ type: 'application/json' }));
  app.use(json({ limit: '1mb' }));

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`Diyanara API running on port ${port}`);
}
bootstrap();
