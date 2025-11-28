-- Update agenda_status enum to include new status values
-- Note: PostgreSQL doesn't allow removing enum values, so we add new ones
-- Existing values: voting, reviewing, passed, rejected
-- New values to add: created, proposing, answered, executing, executed

-- Add new enum values
-- Note: ALTER TYPE ... ADD VALUE can only be executed in a transaction block
DO $$ 
BEGIN
    -- Check if 'created' exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'created' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agenda_status')
    ) THEN
        ALTER TYPE agenda_status ADD VALUE 'created';
    END IF;

    -- Check if 'proposing' exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'proposing' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agenda_status')
    ) THEN
        ALTER TYPE agenda_status ADD VALUE 'proposing';
    END IF;

    -- Check if 'answered' exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'answered' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agenda_status')
    ) THEN
        ALTER TYPE agenda_status ADD VALUE 'answered';
    END IF;

    -- Check if 'executing' exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'executing' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agenda_status')
    ) THEN
        ALTER TYPE agenda_status ADD VALUE 'executing';
    END IF;

    -- Check if 'executed' exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'executed' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'agenda_status')
    ) THEN
        ALTER TYPE agenda_status ADD VALUE 'executed';
    END IF;
END $$;

