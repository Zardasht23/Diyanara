import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Prices are in DKK ore (1 DKK = 100 ore).
const products = [
  {
    name: 'Étoile Pendant Necklace',
    slug: 'etoile-pendant-necklace',
    description:
      'A delicate 18k gold-plated star pendant on a fine chain. Timeless and feminine, perfect for everyday elegance.',
    priceCents: 99900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=80',
    category: 'necklaces',
    stock: 14,
    weightGrams: 40,
    featured: true,
  },
  {
    name: 'Rosée Diamond Earrings',
    slug: 'rosee-diamond-earrings',
    description:
      'Hand-crafted rose-gold studs set with conflict-free lab-grown diamonds. A whisper of light on the ear.',
    priceCents: 189900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=80',
    category: 'earrings',
    stock: 8,
    weightGrams: 20,
    featured: true,
  },
  {
    name: 'Lumière Solitaire Ring',
    slug: 'lumiere-solitaire-ring',
    description:
      'A single brilliant-cut stone on a slender band of recycled silver. Quiet confidence, refined finish.',
    priceCents: 249900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=80',
    category: 'rings',
    stock: 5,
    weightGrams: 30,
    featured: true,
  },
  {
    name: 'Brume Pearl Bracelet',
    slug: 'brume-pearl-bracelet',
    description:
      'Freshwater pearls strung on a soft champagne thread, finished with a 14k gold clasp.',
    priceCents: 119900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80',
    category: 'bracelets',
    stock: 11,
    weightGrams: 60,
    featured: false,
  },
  {
    name: 'Aurore Hoop Earrings',
    slug: 'aurore-hoop-earrings',
    description:
      'Featherlight gold hoops with a subtle hammered finish. The new everyday classic.',
    priceCents: 74900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=80',
    category: 'earrings',
    stock: 20,
    weightGrams: 25,
    featured: false,
  },
  {
    name: 'Velours Chain Necklace',
    slug: 'velours-chain-necklace',
    description:
      'A statement curb-link chain crafted from recycled 18k gold vermeil. Layer it or wear it alone.',
    priceCents: 164900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80',
    category: 'necklaces',
    stock: 0,
    weightGrams: 80,
    featured: false,
  },
  {
    name: 'Coquette Signet Ring',
    slug: 'coquette-signet-ring',
    description:
      'A modern take on the classic signet, in brushed gold with engraving option.',
    priceCents: 139900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1200&q=80',
    category: 'rings',
    stock: 7,
    weightGrams: 35,
    featured: false,
  },
  {
    name: 'Mademoiselle Tennis Bracelet',
    slug: 'mademoiselle-tennis-bracelet',
    description:
      'A continuous line of brilliant-cut stones — the ultimate evening bracelet.',
    priceCents: 319900,
    currency: 'dkk',
    imageUrl:
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80',
    category: 'bracelets',
    stock: 3,
    weightGrams: 45,
    featured: true,
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@diyanara.test';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Diyanara Admin',
      role: Role.ADMIN,
      country: 'DK',
    },
  });
  console.log(`Admin ready: ${adminEmail}`);

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
