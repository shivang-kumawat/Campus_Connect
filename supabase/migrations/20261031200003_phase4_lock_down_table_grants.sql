/*
# Lock down table privileges for complaints and Lost & Found

## 1. What was wrong
- New tables in the public schema were created with full read, write and delete privileges for the anon and authenticated roles.
- Row level security still blocked the writes, but the privileges were wider than the design required.
- The complaint insert restriction to specific columns was also overridden by a table-wide insert privilege.

## 2. What this migration does
- Removes all table privileges from anon and authenticated on: complaints, complaint_updates, lost_found_items, lost_found_owners, lost_found_settings, lost_found_matches, lost_found_history and notifications.
- Grants back only what the app uses:
  - complaints: read, and insert on the client-supplied columns only.
  - complaint_updates: read.
  - lost_found_items: read, and insert on the client-supplied columns only.
  - lost_found_owners, lost_found_settings, lost_found_matches, lost_found_history: read.
  - notifications: read, and update of the read flag only.
- Status changes, recovery, matching and ownership are done only through database functions or triggers.

## 3. Important notes
- No row policies are changed. Row level security still decides which rows each role sees.
- Anonymous visitors have no privileges on these tables.
*/

REVOKE ALL ON public.complaints, public.complaint_updates FROM anon, authenticated;
REVOKE ALL ON public.lost_found_items, public.lost_found_owners, public.lost_found_settings,
  public.lost_found_matches, public.lost_found_history, public.notifications FROM anon, authenticated;

GRANT SELECT ON public.complaints TO authenticated;
GRANT INSERT (id, category, issue_type, description, image_path) ON public.complaints TO authenticated;
GRANT SELECT ON public.complaint_updates TO authenticated;

GRANT SELECT ON public.lost_found_items TO authenticated;
GRANT INSERT (id, report_type, name, category, description, location, item_date, approx_time, image_path) ON public.lost_found_items TO authenticated;
GRANT SELECT ON public.lost_found_owners TO authenticated;
GRANT SELECT ON public.lost_found_settings TO authenticated;
GRANT SELECT ON public.lost_found_matches TO authenticated;
GRANT SELECT ON public.lost_found_history TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;
