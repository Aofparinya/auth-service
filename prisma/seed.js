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
    ["catalog.read", "Read catalog data"],
    ["catalog.write", "Create and update catalog data"],
    ["inventory.read", "Read inventory data"],
    ["inventory.write", "Adjust inventory and manage reservations"],
    ["orders.read", "Read orders"],
    ["orders.write", "Create and manage orders"],
    ["payments.read", "Read payments"],
    ["payments.write", "Create, capture and void payments"],
    ["invoices.read", "Read invoices"],
    ["refunds.read", "Read refunds"],
    ["refunds.write", "Create refunds"],
    ["common.read", "Read master data and configuration"],
    ["common.write", "Manage master data and configuration"],
    ["storage.read", "Read file metadata and download files"],
    ["storage.write", "Upload and delete files"],
    ["notifications.read", "Read notifications"],
    ["notifications.write", "Send notifications"],
    ["notification-templates.read", "Read notification templates"],
    ["notification-templates.write", "Manage notification templates"],
    ["audit.read", "Read audit logs"],
    ["reports.read", "Read reports"],
    ["reports.export", "Create report exports"],
    ["document-numbers.issue", "Issue document numbers"],
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
  const notificationsPermission = allPermissions.find(
    ({ code }) => code === "notifications.read",
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

  if (notificationsPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: userRole.id,
          permissionId: notificationsPermission.id,
        },
      },
      update: {},
      create: { roleId: userRole.id, permissionId: notificationsPermission.id },
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

  const serviceClientId =
    process.env.ORDER_SERVICE_CLIENT_ID ?? "order-service";
  const serviceClientSecret =
    process.env.ORDER_SERVICE_CLIENT_SECRET ??
    "development-order-service-secret-change-me";
  await prisma.serviceClient.upsert({
    where: { clientId: serviceClientId },
    update: {
      name: "Order Service",
      secretHash: await argon2.hash(serviceClientSecret),
      permissions: [
        "customers.read",
        "catalog.read",
        "inventory.read",
        "inventory.write",
        "document-numbers.issue",
      ],
      isActive: true,
    },
    create: {
      clientId: serviceClientId,
      name: "Order Service",
      secretHash: await argon2.hash(serviceClientSecret),
      permissions: [
        "customers.read",
        "catalog.read",
        "inventory.read",
        "inventory.write",
        "document-numbers.issue",
      ],
    },
  });

  const serviceClients = [
    {
      clientId: process.env.WEB_STOREFRONT_CLIENT_ID ?? "web-storefront",
      secret:
        process.env.WEB_STOREFRONT_CLIENT_SECRET ??
        "development-web-storefront-secret-change-me",
      name: "Web Storefront",
      permissions: [
        "customers.read",
        "customers.write",
        "catalog.read",
        "inventory.read",
        "orders.read",
        "orders.write",
        "payments.read",
        "payments.write",
        "storage.read",
        "common.read",
      ],
    },
    {
      clientId: process.env.CUSTOMER_SERVICE_CLIENT_ID ?? "customer-service",
      secret:
        process.env.CUSTOMER_SERVICE_CLIENT_SECRET ??
        "development-customer-secret-change-me",
      name: "Customer Service",
      permissions: ["document-numbers.issue"],
    },
    {
      clientId: process.env.CATALOG_SERVICE_CLIENT_ID ?? "catalog-service",
      secret:
        process.env.CATALOG_SERVICE_CLIENT_SECRET ??
        "development-catalog-secret-change-me",
      name: "Catalog Service",
      permissions: ["document-numbers.issue", "storage.read"],
    },
    {
      clientId:
        process.env.NOTIFICATION_SERVICE_CLIENT_ID ?? "notification-service",
      secret:
        process.env.NOTIFICATION_SERVICE_CLIENT_SECRET ??
        "development-notification-secret-change-me",
      name: "Notification Service",
      permissions: ["customers.read"],
    },
    {
      clientId: process.env.REPORT_SERVICE_CLIENT_ID ?? "report-service",
      secret:
        process.env.REPORT_SERVICE_CLIENT_SECRET ??
        "development-report-secret-change-me",
      name: "Report Service",
      permissions: ["orders.read", "storage.write", "storage.read"],
    },
  ];
  for (const client of serviceClients) {
    await prisma.serviceClient.upsert({
      where: { clientId: client.clientId },
      update: {
        name: client.name,
        secretHash: await argon2.hash(client.secret),
        permissions: client.permissions,
        isActive: true,
      },
      create: {
        clientId: client.clientId,
        name: client.name,
        secretHash: await argon2.hash(client.secret),
        permissions: client.permissions,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
