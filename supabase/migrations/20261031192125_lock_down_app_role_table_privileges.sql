/*
# Lock down app-role privileges on profiles and allowed_email_domains

1. Problem
- Supabase grants every table in the public schema to the `anon` and `authenticated` roles by default.
- The earlier migration only intended read access plus a column-limited update, but those broader default grants were still in place.
- As a result, a signed-in user could have changed their own `role` column, and anonymous callers could insert or delete profile rows.

2. Changes
- `profiles`: remove all privileges from `anon` and `authenticated`, then grant only SELECT and column-limited UPDATE (`full_name`, `mess`) to `authenticated`.
- `allowed_email_domains`: remove all privileges from `anon` and `authenticated`, then grant SELECT to both.

3. Security
- Row level security policies are unchanged.
- Profile rows are still created only by the sign-up trigger, which runs with elevated rights.
- The role column is no longer writable by any app role.

4. Notes
- No data is changed or removed.
*/

REVOKE ALL ON profiles FROM anon, authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (full_name, mess) ON profiles TO authenticated;

REVOKE ALL ON allowed_email_domains FROM anon, authenticated;
GRANT SELECT ON allowed_email_domains TO anon, authenticated;
