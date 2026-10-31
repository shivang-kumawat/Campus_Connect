/*
# CampusConnect: profiles and configurable email domains

1. New Tables
- `allowed_email_domains`: the email domains accepted at registration. Editable by the platform owner through the database, not by users.
  - `domain` (text, primary key, lowercase, e.g. "example.edu")
  - `label` (text) human readable name
  - `is_demo` (boolean) marks development-only domains that must be removed before production
- `profiles`: one row per registered user, linked to the built-in sign-in table.
  - `id` (uuid, primary key, same as the sign-in user id)
  - `full_name`, `email`, `role` (one of seven roles, defaults to student)
  - `hostel` (one of BH1, BH2, BH3, BH4, GH, GH Extension), required for students
  - `mess` (one of Mess A, Mess B, Mess C), required for students
  - `created_at`, `updated_at`

2. Automation
- `handle_new_user` trigger: when someone registers, it checks the email domain against `allowed_email_domains`, then creates the matching profile with the student role. Registration fails with a clear message if the domain is not allowed.

3. Security
- RLS enabled on both tables.
- `allowed_email_domains`: readable by anonymous and signed-in users (intentionally public list), no write access from the app.
- `profiles`: a signed-in user can read only their own profile and update only `full_name` and `mess`. The role can never be changed by the user. No insert or delete access from the app.
- The trigger function is not callable by app roles.

4. Notes
- Students must have a hostel and mess; other roles may leave them empty until assigned.
- Demo domain rows (`is_demo = true`) exist for development testing only. Remove them before production.
*/

CREATE TABLE IF NOT EXISTS allowed_email_domains (
  domain text PRIMARY KEY CHECK (domain = lower(domain) AND domain ~ '^[a-z0-9-]+(\.[a-z0-9-]+)+$'),
  label text NOT NULL,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE allowed_email_domains ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON allowed_email_domains TO anon, authenticated;

DROP POLICY IF EXISTS "anyone_read_allowed_domains" ON allowed_email_domains;
CREATE POLICY "anyone_read_allowed_domains" ON allowed_email_domains
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO allowed_email_domains (domain, label, is_demo)
VALUES ('demo.campusconnect.dev', 'Development demo accounts', true)
ON CONFLICT (domain) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 2 AND 100),
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'student' CHECK (role IN (
    'student', 'hostel_warden', 'chief_warden', 'it_department',
    'cosha', 'mess_warden', 'assistant_registrar'
  )),
  hostel text CHECK (hostel IN ('BH1', 'BH2', 'BH3', 'BH4', 'GH', 'GH Extension')),
  mess text CHECK (mess IN ('Mess A', 'Mess B', 'Mess C')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT student_requires_hostel_and_mess CHECK (
    role <> 'student' OR (hostel IS NOT NULL AND mess IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_hostel_idx ON profiles (hostel);
CREATE INDEX IF NOT EXISTS profiles_mess_idx ON profiles (mess);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (full_name, mess) ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION set_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_profile_updated_at();

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

  INSERT INTO profiles (id, full_name, email, role, hostel, mess)
  VALUES (NEW.id, meta_name, lower(NEW.email), 'student', meta_hostel, meta_mess);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_campus_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created_campus ON auth.users;
CREATE TRIGGER on_auth_user_created_campus
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_campus_user();
