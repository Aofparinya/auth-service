CREATE SCHEMA IF NOT EXISTS "auth";

CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth"."roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth"."permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "auth"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "auth"."login_history" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");
CREATE UNIQUE INDEX "roles_code_key" ON "auth"."roles"("code");
CREATE UNIQUE INDEX "permissions_code_key" ON "auth"."permissions"("code");
CREATE INDEX "login_history_user_id_created_at_idx" ON "auth"."login_history"("user_id", "created_at");

ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth"."login_history" ADD CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
