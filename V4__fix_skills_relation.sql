-- This script rebuilds the volunteer_skills table to make the relationship explicit for Supabase.
-- It preserves all existing data.

-- Step 1: Create a temporary table to back up the data
CREATE TEMP TABLE volunteer_skills_backup AS TABLE volunteer_skills;

-- Step 2: Drop the existing volunteer_skills table
DROP TABLE volunteer_skills;

-- Step 3: Recreate the volunteer_skills table with explicitly named foreign key constraints
CREATE TABLE volunteer_skills (
  volunteer_id UUID NOT NULL,
  skill_id UUID NOT NULL,
  CONSTRAINT volunteer_skills_pkey PRIMARY KEY (volunteer_id, skill_id),
  CONSTRAINT volunteer_skills_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
  CONSTRAINT volunteer_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Step 4: Copy the data back from the temporary table
INSERT INTO volunteer_skills (volunteer_id, skill_id)
SELECT volunteer_id, skill_id FROM volunteer_skills_backup;

-- Step 5: Drop the temporary table
DROP TABLE volunteer_skills_backup;

-- Step 6: Re-create indexes and policies
CREATE INDEX idx_volunteer_skills_skill_id ON volunteer_skills(skill_id);

ALTER TABLE volunteer_skills ENABLE ROW LEVEL SECURITY;

-- Note: Dropping the table also drops the policies. We must recreate them.
CREATE POLICY "Users can view volunteer skills" ON volunteer_skills FOR SELECT USING (true);

CREATE POLICY "Volunteers can manage their own skills" ON volunteer_skills
FOR ALL
USING (auth.uid() = (SELECT user_id FROM volunteers WHERE id = volunteer_id));
