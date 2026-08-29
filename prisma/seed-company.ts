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
  console.log('Starting company backfill...');

  /*
   * =========================================================
   * 1. Create the initial company
   * =========================================================
   */

  const company = await prisma.company.upsert({
    where: {
      name: 'TTK',
    },
    update: {},
    create: {
      name: 'TTK',
      isActive: true,
    },
  });

  console.log(`Company: ${company.name} (${company.id})`);

  /*
   * =========================================================
   * 2. Assign existing non-admin users to the company
   *
   * Admins remain global and do not need a company.
   * =========================================================
   */

  const usersUpdated = await prisma.user.updateMany({
    where: {
      role: {
        in: ['PICKER'],
      },
      companyId: null,
    },
    data: {
      companyId: company.id,
    },
  });

  console.log(`Users assigned: ${usersUpdated.count}`);

  /*
   * =========================================================
   * 3. Backfill existing packlists
   *
   * Existing packlists used packlistNumber.
   * We now use referenceNumber.
   * =========================================================
   */

  const packlists = await prisma.packlistEntry.findMany({
    where: {
      referenceNumber: null,
    },
    select: {
      id: true,
      packlistNumber: true,
    },
  });

  for (const packlist of packlists) {
    if (!packlist.packlistNumber) {
      console.warn(
        `Skipping packlist ${packlist.id}: no packlist number found.`,
      );
      continue;
    }

    await prisma.packlistEntry.update({
      where: {
        id: packlist.id,
      },
      data: {
        referenceNumber: packlist.packlistNumber,
        companyId: company.id,
      },
    });
  }

  console.log(`Packlists processed: ${packlists.length}`);

  /*
   * =========================================================
   * 4. Assign company to any existing packlists that already
   *    have a referenceNumber but no company.
   * =========================================================
   */

  const packlistsWithCompanyMissing = await prisma.packlistEntry.updateMany({
    where: {
      companyId: null,
    },
    data: {
      companyId: company.id,
    },
  });

  console.log(
    `Packlists assigned company: ${packlistsWithCompanyMissing.count}`,
  );

  /*
   * =========================================================
   * 5. Assign company to existing RST entries
   * =========================================================
   */

  const rstUpdated = await prisma.rstEntry.updateMany({
    where: {
      companyId: null,
    },
    data: {
      companyId: company.id,
    },
  });

  console.log(`RST entries assigned: ${rstUpdated.count}`);

  console.log('Company backfill completed successfully.');
}

main()
  .catch((error) => {
    console.error('Company backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
