-- Migration: Add first_name and last_name columns to user_profiles table
-- This migration adds support for displaying user initials in the Avatar component
-- instead of showing email addresses in the navbar

ALTER TABLE user_profiles
ADD COLUMN first_name TEXT DEFAULT '',
ADD COLUMN last_name TEXT DEFAULT '';

-- Create indexes for better query performance if needed
CREATE INDEX idx_user_profiles_first_name ON user_profiles(first_name);
CREATE INDEX idx_user_profiles_last_name ON user_profiles(last_name);

-- Add constraints to ensure names are not too long
ALTER TABLE user_profiles
ADD CONSTRAINT check_first_name_length CHECK (LENGTH(first_name) <= 100),
ADD CONSTRAINT check_last_name_length CHECK (LENGTH(last_name) <= 100);
