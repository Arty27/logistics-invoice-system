import 'dotenv/config';
import argon2 from 'argon2';

import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const phoneNumber = process.env.ADMIN_PHONE_NUMBER;
  const name = process.env.ADMIN_NAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!phoneNumber || !name || !password) {
    throw new Error(
      'ADMIN_PHONENUMBER, ADMIN_NAME, ADMIN_PASSWORD must be defined',
    );
  }
  const passwordHash = await argon2.hash(password);

  const admin = await prisma.user.upsert({
    where: {
      phoneNumber,
    },
    update: {
      name,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: { phoneNumber, name, passwordHash, role: UserRole.ADMIN },
  });
  console.log(`Admin user ready: ${admin.phoneNumber}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
