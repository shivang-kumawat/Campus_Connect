/*
# Phase 2: hostel verification

1. Modified table `profiles` (new columns)
- `verification_status`: not_required, pending, approved or rejected. New student sign-ups start as pending.
- `verification_remark`: optional note from the hostel warden (max 500 characters).
- `verified_by`: the warden who made the decision.
- `verified_at`: when the decision was made.

2. Changed function `handle_new_campus_user`
- New student profiles are created with verification_status = pending.
- Existing student profiles still awaiting a status are set to pending.

3. New functions
- `current_warden_hostel()`: returns the hostel of the signed-in hostel warden, or nothing for anyone else.
- `review_student_hostel(student, decision, remark)`: lets a hostel warden approve or reject a pending student from their own hostel only.

4. Security
- Students still cannot change verification fields. Their update access stays limited to name and mess.
- Hostel wardens can read only student profiles from their own hostel (new policy).
- All decisions go through the review function, which checks the caller's role, hostel match and pending state in one atomic update.
- The helper and review functions are not callable by anonymous users.

5. Notes
- Existing rows are not deleted or changed beyond the status backfill for students.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'not_required'
    CHECK (verification_status IN ('not_required', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_remark text
    CHECK (verification_remark IS NULL OR char_length(verification_remark) <= 500),
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_hostel_verification_idx ON profiles (hostel, verification_status);

UPDATE profiles
SET verification_status = 'pending'
WHERE role = 'student' AND verification_status = 'not_required';

CREATE OR REPLACE FUNCTION handle_new_campus_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_domain text;
  meta_name text;
  meta_hostel text;
  meta_mess text;
BEGIN
  email_domain := lower(split_part(NEW.email, '@', 2));

  IF NOT EXISTS (SELECT 1 FROM allowed_email_domains WHERE domain = email_domain) THEN
    RAISE EXCEPTION 'This email domain is not allowed to register on CampusConnect.'
      USING ERRCODE = 'check_violation';
  END IF;

  meta_name := btrim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  meta_hostel := NEW.raw_user_meta_data ->> 'hostel';
  meta_mess := NEW.raw_user_meta_data ->> 'mess';

  INSERT INTO profiles (id, full_name, email, role, hostel, mess, verification_status)
  VALUES (NEW.id, meta_name, lower(NEW.email), 'student', meta_hostel, meta_mess, 'pending');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION current_warden_hostel()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hostel FROM profiles WHERE id = auth.uid() AND role = 'hostel_warden';
$$;

REVOKE EXECUTE ON FUNCTION current_warden_hostel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION current_warden_hostel() TO authenticated;

CREATE OR REPLACE FUNCTION review_student_hostel(p_student uuid, p_decision text, p_remark text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warden_hostel text := current_warden_hostel();
  v_remark text := nullif(btrim(COALESCE(p_remark, '')), '');
  v_updated integer;
BEGIN
  IF v_warden_hostel IS NULL THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF v_remark IS NOT NULL AND char_length(v_remark) > 500 THEN
    RAISE EXCEPTION 'Remark must be 500 characters or fewer' USING ERRCODE = 'string_data_right_truncation';
  END IF;

  UPDATE profiles
  SET verification_status = p_decision,
      verification_remark = v_remark,
      verified_by = auth.uid(),
      verified_at = now()
  WHERE id = p_student
    AND role = 'student'
    AND hostel = v_warden_hostel
    AND verification_status = 'pending';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'This student cannot be reviewed right now' USING ERRCODE = 'no_data_found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION review_student_hostel(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION review_student_hostel(uuid, text, text) TO authenticated;

DROP POLICY IF EXISTS "hostel_warden_select_hostel_students" ON profiles;
CREATE POLICY "hostel_warden_select_hostel_students" ON profiles
  FOR SELECT TO authenticated
  USING (role = 'student' AND hostel IS NOT NULL AND hostel = current_warden_hostel());
