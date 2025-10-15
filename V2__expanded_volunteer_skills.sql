-- Step 1: Create the skills table
CREATE TABLE skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Step 2: Create the volunteer_skills join table
CREATE TABLE volunteer_skills (
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (volunteer_id, skill_id)
);

-- Step 3: Populate the skills table from the existing skills array
INSERT INTO skills (name)
SELECT DISTINCT unnest(skills)
FROM volunteers
WHERE skills IS NOT NULL AND cardinality(skills) > 0
ON CONFLICT (name) DO NOTHING;

-- Step 4: Populate the volunteer_skills join table
INSERT INTO volunteer_skills (volunteer_id, skill_id)
SELECT v.id, s.id
FROM volunteers v
CROSS JOIN unnest(v.skills) as skill_name
JOIN skills s ON s.name = skill_name
ON CONFLICT (volunteer_id, skill_id) DO NOTHING;

-- Step 5: Remove the old skills column from the volunteers table
-- First, drop the index on the skills column
DROP INDEX IF EXISTS idx_volunteers_skills;
-- Then, drop the column itself
ALTER TABLE volunteers DROP COLUMN skills;

-- Step 6: Create new RLS policies for the new tables
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_skills ENABLE ROW LEVEL SECURITY;

-- Anyone can view skills
CREATE POLICY "Users can view all skills" ON skills FOR SELECT USING (true);

-- Volunteers can view their own skills, and clients can view any volunteer's skills
CREATE POLICY "Users can view volunteer skills" ON volunteer_skills FOR SELECT USING (true);

-- Volunteers can insert/delete their own skills
CREATE POLICY "Volunteers can manage their own skills" ON volunteer_skills
FOR ALL
USING (auth.uid() = (SELECT user_id FROM volunteers WHERE id = volunteer_id));

-- Optional: Create an index on the new tables for performance
CREATE INDEX idx_volunteer_skills_skill_id ON volunteer_skills(skill_id);
