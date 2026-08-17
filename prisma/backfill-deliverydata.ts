import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const packlists = await prisma.packlistEntry.findMany({
    select: {
      id: true,
      pickerId: true,
      createdBy: true,
      status: true,
    },
  });
  console.log(`Found ${packlists.length} existing packlists`);
  let updated = 0;
  let relationshipsCreated = 0;
  for (const packlist of packlists) {
    if (!packlist.createdBy) {
      await prisma.packlistEntry.update({
        where: {
          id: packlist.id,
        },
        data: {
          createdById: packlist.pickerId,
          status: 'LEGACY',
        },
      });
      updated++;
    }
    const existingRelationship = await prisma.packlistPicker.findUnique({
      where: {
        packlistId_pickerId: {
          packlistId: packlist.id,
          pickerId: packlist.pickerId,
        },
      },
    });
    if (!existingRelationship) {
      await prisma.packlistPicker.create({
        data: {
          packlistId: packlist.id,
          pickerId: packlist.pickerId,
        },
      });
      relationshipsCreated++;
    }
  }
  console.log(`Updated creator/status: ${updated}`);
  console.log(`Created picker relationships: ${relationshipsCreated}`);
}

main()
  .catch((error) => {
    console.error('Backfill failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
