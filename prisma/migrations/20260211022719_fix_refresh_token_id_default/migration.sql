-- Fix RefreshToken model to generate id automatically with uuid()
-- This resolves the "Null constraint violation on the fields: (id)" error
-- when creating refresh tokens during user registration

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if RefreshToken.id column has a default value
DO $$ 
BEGIN
    -- Check if default constraint exists on RefreshToken.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RefreshToken' 
        AND column_name = 'id' 
        AND column_default LIKE '%uuid%'
    ) THEN
        -- Add default UUID generation
        ALTER TABLE "RefreshToken" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
    END IF;
END $$;