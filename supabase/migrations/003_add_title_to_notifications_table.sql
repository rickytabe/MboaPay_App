-- Add missing columns to notifications table for compatibility with app code
ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure the title column is never null for legacy rows
UPDATE notifications
SET title = ''
WHERE title IS NULL;