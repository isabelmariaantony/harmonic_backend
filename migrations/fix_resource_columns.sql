-- First, drop the not-null constraint on author_id if it exists
ALTER TABLE resources
ALTER COLUMN author_id DROP NOT NULL;

-- Add created_by column if it doesn't exist
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- Copy data from author_id to created_by
UPDATE resources
SET created_by = author_id
WHERE author_id IS NOT NULL;

-- Drop the author_id column
ALTER TABLE resources
DROP COLUMN IF EXISTS author_id;

-- Add not-null constraint to created_by
ALTER TABLE resources
ALTER COLUMN created_by SET NOT NULL; 