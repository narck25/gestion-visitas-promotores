-- Fix User model issues causing null constraint violation on id field
-- 1. Add default UUID generation for User.id if not already present
-- 2. Ensure role column uses Role enum with default PROMOTER
-- 3. Ensure updatedAt has proper default

-- First, check if the uuid-ossp extension is available, if not create it
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if User.id column has a default value
DO $$ 
BEGIN
    -- Check if default constraint exists on User.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid%'
    ) THEN
        -- Add default UUID generation
        ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
    END IF;
END $$;

-- Ensure role column is using the Role enum type
-- First check if the Role enum exists
DO $$
BEGIN
    -- Check if Role enum type exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'Role'
    ) THEN
        -- Create Role enum
        CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'PROMOTER', 'VIEWER');
    END IF;
END $$;

-- Check if role column is of type Role
DO $$
BEGIN
    -- Check if role column exists and is not of type Role
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'role'
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- Convert role column to Role enum type
        -- First, add a temporary column
        ALTER TABLE "User" ADD COLUMN "role_temp" "Role";
        
        -- Update the temporary column with converted values
        UPDATE "User" SET "role_temp" = 
            CASE 
                WHEN role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"Role"
                WHEN role = 'ADMIN' THEN 'ADMIN'::"Role"
                WHEN role = 'MANAGER' THEN 'MANAGER'::"Role"
                WHEN role = 'PROMOTER' THEN 'PROMOTER'::"Role"
                WHEN role = 'VIEWER' THEN 'VIEWER'::"Role"
                ELSE 'PROMOTER'::"Role"
            END;
        
        -- Drop the old column
        ALTER TABLE "User" DROP COLUMN "role";
        
        -- Rename the temporary column
        ALTER TABLE "User" RENAME COLUMN "role_temp" TO "role";
        
        -- Add default value
        ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PROMOTER'::"Role";
    END IF;
END $$;

-- Ensure updatedAt column has proper default (should be @updatedAt in Prisma)
-- This is handled by Prisma Client, but we can ensure the column allows null and has no default
-- as @updatedAt will handle it at application level
DO $$
BEGIN
    -- Check if updatedAt has a default that might interfere
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'updatedAt' 
        AND column_default IS NOT NULL
        AND column_default LIKE '%CURRENT_TIMESTAMP%'
    ) THEN
        -- Remove the default as Prisma's @updatedAt will handle it
        ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");