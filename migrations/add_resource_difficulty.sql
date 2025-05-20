-- Add difficulty column to resources table
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) NOT NULL DEFAULT 'beginner';

-- Update existing resources to have a difficulty level
UPDATE resources
SET difficulty = 'beginner'
WHERE difficulty IS NULL; 