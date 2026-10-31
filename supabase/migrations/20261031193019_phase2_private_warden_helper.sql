/*
# Phase 2 follow-up: move the warden helper out of the public API schema

1. Changes
- New private schema `private` (not exposed by the data API). Signed-in users get usage on it only.
- `private.current_warden_hostel()` replaces `public.current_warden_hostel()`. It returns the signed-in hostel warden's hostel.
- The student-visibility policy for hostel wardens now calls the private helper.
- `review_student_hostel` now calls the private helper. It remains the only way to record a decision.

2. Why
- The helper runs with elevated rights so the profile policy can read the warden's own row without recursing into itself. Keeping it out of the public API prevents direct calls.

3. Security
- The helper's execute right is revoked from anonymous and public roles.
- No student or warden data is changed.
*/

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

DROP POLICY IF EXISTS "hostel_warden_select_hostel_students" ON profiles;
DROP FUNCTION IF EXISTS public.current_warden_hostel();

CREATE OR REPLACE FUNCTION private.current_warden_hostel()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hostel FROM public.profiles WHERE id = auth.uid() AND role = 'hostel_warden';
$$;

REVOKE EXECUTE ON FUNCTION private.current_warden_hostel() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_warden_hostel() TO authenticated;

CREATE POLICY "hostel_warden_select_hostel_students" ON profiles
  FOR SELECT TO authenticated
  USING (role = 'student' AND hostel IS NOT NULL AND hostel = private.current_warden_hostel());

CREATE OR REPLACE FUNCTION review_student_hostel(p_student uuid, p_decision text, p_remark text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warden_hostel text := private.current_warden_hostel();
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
