CREATE OR REPLACE FUNCTION update_volunteer_skills(p_volunteer_id UUID, p_skill_names TEXT[])
RETURNS void AS $$
DECLARE
  skill_name TEXT;
  v_skill_id UUID;
BEGIN
  -- Step 1: Delete old skills for the volunteer
  DELETE FROM volunteer_skills WHERE volunteer_id = p_volunteer_id;

  -- Step 2: Loop through the new skill names
  IF p_skill_names IS NOT NULL THEN
    FOREACH skill_name IN ARRAY p_skill_names
    LOOP
      -- Step 3: Find the skill_id for the current skill name.
      -- If it doesn't exist, insert it into the skills table and get the new id.
      INSERT INTO skills (name)
      VALUES (skill_name)
      ON CONFLICT (name) DO NOTHING;

      SELECT id INTO v_skill_id FROM skills WHERE name = skill_name;

      -- Step 4: Insert the new skill relationship into volunteer_skills
      INSERT INTO volunteer_skills (volunteer_id, skill_id)
      VALUES (p_volunteer_id, v_skill_id)
      ON CONFLICT (volunteer_id, skill_id) DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;