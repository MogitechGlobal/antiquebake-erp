// api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Prisma v6 automatically reads the DATABASE_URL from your .env file
const prisma = new PrismaClient();

interface PermissionData {
  action: string;
  subject: string;
  description: string;
}

interface CreatedPermission {
  id: string;
  action: string;
  subject: string;
  description: string | null;
  createdAt: Date;
}

async function main() {
  console.log('Starting database seeding...');

  // Create the Main Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Antique Oven Ltd',
      address: 'P.O. Box 6681',
      city: 'Morogoro',
      country: 'Tanzania',
      email: 'info@antiqueoven.co.tz',
    },
  });
  console.log(`Created Organization: ${organization.name}`);

  // Create the Main Branch
  const mainBranch = await prisma.branch.create({
    data: {
      organizationId: organization.id,
      name: 'Morogoro Central Bakery',
      code: 'HQ-MRG-01',
      isMain: true,
      address: 'P.O. Box 6681, Morogoro',
    },
  });
  console.log(`Created Branch: ${mainBranch.name}`);

  // Define Core Permissions
  const permissionsData: PermissionData[] = [
    { action: 'manage', subject: 'All', description: 'Super Admin Access' },
    { action: 'read', subject: 'Dashboard', description: 'View Executive Dashboard' },
    { action: 'manage', subject: 'Production', description: 'Manage Manufacturing & Recipes' },
    { action: 'manage', subject: 'Inventory', description: 'Manage Warehouse & Stock' },
    { action: 'manage', subject: 'POS', description: 'Process Sales and Cashier Duties' },
  ];

  const permissions: CreatedPermission[] = await Promise.all(
    permissionsData.map((p: PermissionData) =>
      prisma.permission.upsert({
        where: { action_subject: { action: p.action, subject: p.subject } },
        update: {},
        create: p,
      })
    )
  );
  console.log(`Created ${permissions.length} core permissions.`);

  // Create Super Admin Role
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'Super Admin',
      description: 'Full system access across all modules',
      permissions: {
        create: permissions.map((p: CreatedPermission) => ({
          permission: { connect: { id: p.id } },
        })),
      },
    },
  });
  console.log(`Created Role: ${superAdminRole.name}`);

  // Create Default Executive Staff Member
  const executiveStaff = await prisma.staff.create({
    data: {
      organizationId: organization.id,
      firstName: 'System',
      lastName: 'Administrator',
      employeeCode: 'EMP-0001',
      email: 'admin@antiqueoven.co.tz',
    },
  });

  // Create Super Admin User Account
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AntiqueBake2026!', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@antiqueoven.co.tz',
      passwordHash: passwordHash,
      roleId: superAdminRole.id,
      branchId: mainBranch.id,
      staffId: executiveStaff.id,
    },
  });
  console.log(`Created Admin User: ${adminUser.email}`);
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });