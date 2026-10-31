/*
# Phase 3: complaint reporting, tracking and authority handling

## 1. New tables
- `complaints`: one row per student complaint.
  - `student_id` (defaults to the signed-in student), `student_name`, `hostel` and `mess` are copied from the student's profile by the database. The app cannot set them.
  - `category`: hostel_issue, hostel_internet or mess_issue. `issue_type` must match the category.
  - `description` (10 to 1000 characters), optional `image_path` in the private complaint-images bucket.
  - `status`: pending, in_progress or resolved. `resolved_at` is set only when resolved.
- `complaint_updates`: full history. Each row is created, a status change with an optional authority remark, or a student reminder.

## 2. Access rules
- Students can see and create their own complaints, and read their own history.
- Authorities see complaints in their scope only:
  - Hostel Warden: hostel issues from their hostel.
  - Chief Warden: hostel issues and mess issues.
  - IT Department: hostel internet complaints.
  - COSHA: mess issues from all messes.
  - Mess Warden: mess issues from their mess.
- Status changes and remarks go only through `update_complaint_status`, which checks the caller's scope.
- Reminders go only through `request_complaint_reminder`. A reminder is allowed for an open complaint that is at least 48 hours old, at most once every 24 hours.
- Complaints cannot be edited or deleted by any app role.

## 3. Storage
- New private bucket `complaint-images`: JPEG, PNG or WebP only, 5 MB maximum.
- Students upload only into their own folder. Images are read through short-lived signed links, and only for complaints the caller can see.

## 4. Important notes
- Functions with elevated rights set a fixed search path and are not callable by anonymous users.
- The scope check lives in a private schema so it is not exposed through the data API.
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('hostel_issue', 'hostel_internet', 'mess_issue')),
  issue_type text NOT NULL,
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 1000),
  hostel text CHECK (hostel IN ('BH1', 'BH2', 'BH3', 'BH4', 'GH', 'GH Extension')),
  mess text CHECK (mess IN ('Mess A', 'Mess B', 'Mess C')),
  image_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  last_reminded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT complaints_issue_matches_category CHECK (
    (category = 'hostel_issue' AND issue_type IN ('Electricity', 'Water', 'Cleaning', 'AC', 'Fans', 'Maintenance'))
    OR (category = 'hostel_internet' AND issue_type IN ('Wi-Fi', 'Slow internet', 'Connectivity'))
    OR (category = 'mess_issue' AND issue_type IN ('Food quality', 'Hygiene', 'Cleanliness', 'Drinking water'))
  ),
  CONSTRAINT complaints_location_required CHECK (
    (category = 'mess_issue' AND mess IS NOT NULL)
    OR (category <> 'mess_issue' AND hostel IS NOT NULL)
  ),
  CONSTRAINT complaints_resolved_consistent CHECK ((status = 'resolved') = (resolved_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS complaints_student_idx ON complaints (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_scope_idx ON complaints (category, hostel, mess);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints (status);

CREATE TABLE IF NOT EXISTS complaint_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role text,
  kind text NOT NULL CHECK (kind IN ('created', 'status', 'reminder')),
  status text CHECK (status IN ('pending', 'in_progress', 'resolved')),
  remark text CHECK (remark IS NULL OR char_length(remark) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS complaint_updates_complaint_idx ON complaint_updates (complaint_id, created_at);

CREATE OR REPLACE FUNCTION private.can_handle_complaint(p_category text, p_hostel text, p_mess text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles me
    WHERE me.id = auth.uid()
      AND (
        (me.role = 'chief_warden' AND p_category IN ('hostel_issue', 'mess_issue'))
        OR (me.role = 'hostel_warden' AND p_category = 'hostel_issue' AND me.hostel = p_hostel)
        OR (me.role = 'it_department' AND p_category = 'hostel_internet')
        OR (me.role = 'cosha' AND p_category = 'mess_issue')
        OR (me.role = 'mess_warden' AND p_category = 'mess_issue' AND me.mess = p_mess)
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION private.can_handle_complaint(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_handle_complaint(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.snapshot_complaint_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me profiles%ROWTYPE;
BEGIN
  SELECT * INTO me FROM profiles WHERE id = NEW.student_id AND role = 'student';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only students can report complaints' USING ERRCODE = 'insufficient_privilege';
  END IF;
  NEW.student_name := me.full_name;
  NEW.hostel := me.hostel;
  NEW.mess := me.mess;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.snapshot_complaint_student() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS complaints_snapshot_student ON complaints;
CREATE TRIGGER complaints_snapshot_student
  BEFORE INSERT ON complaints
  FOR EACH ROW EXECUTE FUNCTION private.snapshot_complaint_student();

CREATE OR REPLACE FUNCTION private.record_complaint_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO complaint_updates (complaint_id, actor_id, actor_role, kind, status)
  VALUES (NEW.id, NEW.student_id, 'student', 'created', 'pending');
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.record_complaint_created() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS complaints_record_created ON complaints;
CREATE TRIGGER complaints_record_created
  AFTER INSERT ON complaints
  FOR EACH ROW EXECUTE FUNCTION private.record_complaint_created();

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON complaints TO authenticated;
GRANT INSERT (id, category, issue_type, description, image_path) ON complaints TO authenticated;
GRANT SELECT ON complaint_updates TO authenticated;

DROP POLICY IF EXISTS "select_visible_complaints" ON complaints;
CREATE POLICY "select_visible_complaints" ON complaints FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR private.can_handle_complaint(category, hostel, mess));

DROP POLICY IF EXISTS "insert_own_complaint" ON complaints;
CREATE POLICY "insert_own_complaint" ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'student')
    AND (image_path IS NULL OR split_part(image_path, '/', 1) = auth.uid()::text)
  );

DROP POLICY IF EXISTS "select_visible_complaint_updates" ON complaint_updates;
CREATE POLICY "select_visible_complaint_updates" ON complaint_updates FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM complaints c WHERE c.id = complaint_updates.complaint_id));

CREATE OR REPLACE FUNCTION public.update_complaint_status(p_complaint uuid, p_status text, p_remark text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c complaints%ROWTYPE;
  v_remark text := nullif(btrim(COALESCE(p_remark, '')), '');
  v_role text;
BEGIN
  SELECT * INTO c FROM complaints WHERE id = p_complaint;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complaint not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF NOT private.can_handle_complaint(c.category, c.hostel, c.mess) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_status NOT IN ('pending', 'in_progress', 'resolved') THEN
    RAISE EXCEPTION 'Invalid status' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF v_remark IS NOT NULL AND char_length(v_remark) > 500 THEN
    RAISE EXCEPTION 'Remark must be 500 characters or fewer' USING ERRCODE = 'string_data_right_truncation';
  END IF;
  IF p_status = c.status AND v_remark IS NULL THEN
    RAISE EXCEPTION 'Choose a different status or add a remark' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();

  UPDATE complaints
  SET status = p_status,
      resolved_at = CASE WHEN p_status = 'resolved' THEN COALESCE(c.resolved_at, now()) ELSE NULL END,
      updated_at = now()
  WHERE id = c.id;

  INSERT INTO complaint_updates (complaint_id, actor_id, actor_role, kind, status, remark)
  VALUES (c.id, auth.uid(), v_role, 'status', p_status, v_remark);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_complaint_status(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_complaint_status(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_complaint_reminder(p_complaint uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c complaints%ROWTYPE;
BEGIN
  SELECT * INTO c FROM complaints WHERE id = p_complaint AND student_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complaint not found' USING ERRCODE = 'no_data_found';
  END IF;
  IF c.status = 'resolved' THEN
    RAISE EXCEPTION 'Resolved complaints cannot be reminded' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF c.created_at > now() - interval '48 hours' THEN
    RAISE EXCEPTION 'This complaint is not delayed yet' USING ERRCODE = 'invalid_parameter_value';
  END IF;
  IF c.last_reminded_at IS NOT NULL AND c.last_reminded_at > now() - interval '24 hours' THEN
    RAISE EXCEPTION 'A reminder was sent recently' USING ERRCODE = '53400';
  END IF;

  UPDATE complaints SET last_reminded_at = now() WHERE id = c.id;

  INSERT INTO complaint_updates (complaint_id, actor_id, actor_role, kind, status)
  VALUES (c.id, auth.uid(), 'student', 'reminder', c.status);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_complaint_reminder(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_complaint_reminder(uuid) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('complaint-images', 'complaint-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "complaint_images_insert_own_folder" ON storage.objects;
CREATE POLICY "complaint_images_insert_own_folder" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'complaint-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "complaint_images_select_visible" ON storage.objects;
CREATE POLICY "complaint_images_select_visible" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'complaint-images'
    AND EXISTS (SELECT 1 FROM public.complaints c WHERE c.image_path = storage.objects.name)
  );

DROP POLICY IF EXISTS "complaint_images_delete_own_folder" ON storage.objects;
CREATE POLICY "complaint_images_delete_own_folder" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'complaint-images' AND (storage.foldername(name))[1] = auth.uid()::text);
