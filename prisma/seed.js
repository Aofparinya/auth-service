const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    ["users.read", "Read users"],
    ["users.write", "Create and update users"],
    ["roles.read", "Read roles"],
    ["permissions.read", "Read permissions"],
    ["profile.read", "Read own profile"],
    ["customers.read", "Read customers"],
    ["customers.write", "Create and update customers"],
  ];

  for (const [code, name] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name },
      create: { code, name },
    });
  }

  const adminRole = await prisma.role.upsert({
    where: { code: "ADMIN" },
    update: { name: "Administrator" },
    create: { code: "ADMIN", name: "Administrator" },
  });
  const userRole = await prisma.role.upsert({
    where: { code: "USER" },
    update: { name: "User" },
    create: { code: "USER", name: "User" },
  });
  const allPermissions = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });
  const profilePermission = allPermissions.find(
    ({ code }) => code === "profile.read",
  );
  if (profilePermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: profilePermission.id,
        },
      },
      update: {},
      create: {
        roleId: userRole.id,
        permissionId: profilePermission.id,
      },
    });
  }

  const email = (process.env.ADMIN_EMAIL ?? "admin@order-platform.local")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  await prisma.user.upsert({
    where: { email },
    update: {
      isActive: true,
      userRoles: {
        deleteMany: {},
        create: { roleId: adminRole.id },
      },
    },
    create: {
      email,
      passwordHash: await argon2.hash(password),
      firstName: "Platform",
      lastName: "Administrator",
      userRoles: { create: { roleId: adminRole.id } },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
