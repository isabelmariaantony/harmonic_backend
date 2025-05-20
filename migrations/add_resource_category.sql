-- Add category column to resources table
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'general';

-- Update existing resources to have a category
UPDATE resources
SET category = type
WHERE category IS NULL; 