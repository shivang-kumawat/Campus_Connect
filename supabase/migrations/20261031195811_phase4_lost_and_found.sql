/*
# Phase 4: Lost & Found, AI-assisted matching, recovery and notifications

## 1. New tables
- `lost_found_items`: one row per Lost or Found report.
  - `report_type` (lost | found), `name`, `category` (eight fixed categories), `description`, `location`, `item_date`, optional `approx_time`, optional `image_path` in the private `lost-found-images` bucket.
  - `status`: open | recovered. `recovered_at` is set only when recovered.
- `lost_found_owners`: which student filed each report. Kept in its own table so that reporter identity is never returned with item data. Only the owner can read their own rows.
- `lost_found_settings`: single row holding the minimum similarity score (`min_match_score`) that a pair must reach before it is suggested. Readable by signed-in users, not writable by the app.
- `lost_found_matches`: AI-suggested pairs of one lost item and one found item, with the score and each component score (name, description, location, category, date). Status: suggested | confirmed | dismissed | closed.
- `lost_found_history`: timeline per item (created, match_suggested, match_confirmed, match_dismissed, recovered).
- `notifications`: in-app notifications for a recipient. Messages never include contact details or the other student's name.

## 2. Matching
- Runs automatically inside the database when a report is inserted. Compares the new report with every open report of the opposite type from a different student.
- Text similarity uses TF-IDF weighting with cosine similarity over name, description and location tokens.
- Weighted score: name 25%, description 25%, location 15%, category 15%, date proximity 20% (linear over 14 days).
- Only pairs at or above `min_match_score` are stored. Suggestions are never confirmed automatically.

## 3. Actions
- `respond_lost_found_match(match, decision)`: a student who owns either item confirms or dismisses a suggested match. Confirming notifies the other student without revealing identity.
- `mark_lost_found_recovered(item)`: the owner marks an item recovered. The item leaves active listings and matching, its open suggestions are closed, and the history is kept.

## 4. Security
- RLS is enabled on every new table. Students read active and recovered reports from all students. Owner identity is hidden.
- Only students can create reports. Students cannot edit or delete reports from the app.
- Assistant Registrar has read-only access to reports, matches and history. No write grants or policies exist for that role.
- Matches and history are visible to the two owners of the items involved and to the Assistant Registrar.
- Notifications are readable and mark-as-read only by their recipient.
- Photos are private. Students upload only into their own folder. Reads use signed links, and only for reports the caller can see.
- Functions that change data set a fixed search path and are not callable by anonymous users.

## 5. Important notes
- Matching functions live in the private schema and are not exposed through the data API.
- Confirmed and dismissed matches are kept as records. Recovered items keep their reports.
*/

CREATE OR REPLACE FUNCTION private.current_role_in(p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = ANY (p_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION private.current_role_in(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_role_in(text[]) TO authenticated;

CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('lost', 'found')),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 3 AND 80),
  category text NOT NULL CHECK (category IN (
    'electronics', 'wallets', 'id_cards', 'books_stationery', 'bags', 'clothing', 'accessories', 'other'
  )),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 10 AND 1000),
  location text NOT NULL CHECK (char_length(btrim(location)) BETWEEN 3 AND 120),
  item_date date NOT NULL,
  approx_time time,
  image_path text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'recovered')),
  recovered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lost_found_items_recovered_consistent CHECK ((status = 'recovered') = (recovered_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS lost_found_items_status_idx ON public.lost_found_items (status, report_type, created_at DESC);
CREATE INDEX IF NOT EXISTS lost_found_items_category_idx ON public.lost_found_items (category);

CREATE TABLE IF NOT EXISTS public.lost_found_owners (
  item_id uuid PRIMARY KEY REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lost_found_owners_owner_idx ON public.lost_found_owners (owner_id);

CREATE TABLE IF NOT EXISTS public.lost_found_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  min_match_score numeric(4,3) NOT NULL DEFAULT 0.350 CHECK (min_match_score BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.lost_found_settings (id, min_match_score)
VALUES (1, 0.350)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.lost_found_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id uuid NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  found_item_id uuid NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  score numeric(5,4) NOT NULL CHECK (score BETWEEN 0 AND 1),
  name_similarity numeric(5,4) NOT NULL CHECK (name_similarity BETWEEN 0 AND 1),
  description_similarity numeric(5,4) NOT NULL CHECK (description_similarity BETWEEN 0 AND 1),
  location_similarity numeric(5,4) NOT NULL CHECK (location_similarity BETWEEN 0 AND 1),
  category_score numeric(5,4) NOT NULL CHECK (category_score BETWEEN 0 AND 1),
  date_score numeric(5,4) NOT NULL CHECK (date_score BETWEEN 0 AND 1),
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'confirmed', 'dismissed', 'closed')),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lost_found_matches_pair_unique UNIQUE (lost_item_id, found_item_id)
);

CREATE INDEX IF NOT EXISTS lost_found_matches_found_idx ON public.lost_found_matches (found_item_id);

CREATE TABLE IF NOT EXISTS public.lost_found_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.lost_found_matches(id) ON DELETE CASCADE,
  actor_role text,
  kind text NOT NULL CHECK (kind IN ('created', 'match_suggested', 'match_confirmed', 'match_dismissed', 'recovered')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lost_found_history_item_idx ON public.lost_found_history (item_id, created_at);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('lost_found_match_suggested', 'lost_found_match_confirmed')),
  title text NOT NULL,
  body text NOT NULL,
  item_id uuid REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.lost_found_matches(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications (recipient_id, created_at DESC);

CREATE OR REPLACE FUNCTION private.lost_found_tokens(p_text text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(raw.tok), ARRAY[]::text[])
  FROM (SELECT regexp_split_to_table(lower(COALESCE(p_text, '')), '[^a-z0-9]+') AS tok) raw
  WHERE char_length(raw.tok) >= 2
    AND raw.tok <> ALL (ARRAY[
      'the', 'and', 'for', 'with', 'was', 'were', 'this', 'that', 'from', 'near', 'have', 'has', 'had',
      'are', 'his', 'her', 'its', 'not', 'but', 'you', 'your', 'our', 'into', 'just', 'there', 'then',
      'when', 'while', 'after', 'before', 'about', 'some', 'any', 'it', 'is', 'in', 'on', 'at', 'of', 'to',
      'a', 'an', 'by', 'or', 'my', 'me', 'i', 'we', 'they', 'item', 'lost', 'found'
    ]);
$$;

REVOKE EXECUTE ON FUNCTION private.lost_found_tokens(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.lost_found_match_scores(p_item uuid)
RETURNS TABLE (
  candidate_id uuid,
  name_similarity numeric,
  description_similarity numeric,
  location_similarity numeric,
  category_score numeric,
  date_score numeric,
  total_score numeric
)
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH me AS (
    SELECT i.* FROM public.lost_found_items i WHERE i.id = p_item
  ),
  candidates AS (
    SELECT c.*
    FROM public.lost_found_items c
    CROSS JOIN me
    WHERE c.report_type <> me.report_type
      AND c.status = 'open'
      AND c.id <> me.id
      AND NOT EXISTS (
        SELECT 1
        FROM public.lost_found_owners mine
        JOIN public.lost_found_owners theirs ON theirs.owner_id = mine.owner_id
        WHERE mine.item_id = me.id AND theirs.item_id = c.id
      )
  ),
  corpus AS (
    SELECT * FROM me
    UNION ALL
    SELECT * FROM candidates
  ),
  tokens AS (
    SELECT doc.id AS doc, 'name'::text AS field, u.tok
    FROM corpus doc CROSS JOIN LATERAL unnest(private.lost_found_tokens(doc.name)) AS u(tok)
    UNION ALL
    SELECT doc.id, 'description'::text, u.tok
    FROM corpus doc CROSS JOIN LATERAL unnest(private.lost_found_tokens(doc.description)) AS u(tok)
    UNION ALL
    SELECT doc.id, 'location'::text, u.tok
    FROM corpus doc CROSS JOIN LATERAL unnest(private.lost_found_tokens(doc.location)) AS u(tok)
  ),
  term_counts AS (
    SELECT t.doc, t.field, t.tok, count(*)::numeric AS tf
    FROM tokens t
    GROUP BY t.doc, t.field, t.tok
  ),
  doc_freq AS (
    SELECT t.field, t.tok, count(DISTINCT t.doc)::numeric AS df
    FROM tokens t
    GROUP BY t.field, t.tok
  ),
  corpus_size AS (
    SELECT count(*)::numeric AS n FROM corpus
  ),
  weights AS (
    SELECT tc.doc, tc.field, tc.tok,
           tc.tf * (ln((cs.n + 1) / (df.df + 1)) + 1) AS w
    FROM term_counts tc
    JOIN doc_freq df ON df.field = tc.field AND df.tok = tc.tok
    CROSS JOIN corpus_size cs
  ),
  norms AS (
    SELECT w.doc, w.field, sqrt(sum(w.w * w.w)) AS norm
    FROM weights w
    GROUP BY w.doc, w.field
  ),
  dots AS (
    SELECT cand.doc AS candidate_id, mine.field, sum(mine.w * cand.w) AS dot
    FROM weights mine
    JOIN weights cand ON cand.field = mine.field AND cand.tok = mine.tok
    WHERE mine.doc = (SELECT id FROM me) AND cand.doc <> mine.doc
    GROUP BY cand.doc, mine.field
  ),
  similarities AS (
    SELECT c.id AS candidate_id,
           f.field,
           COALESCE(d.dot / NULLIF(nm.norm * nc.norm, 0), 0) AS sim
    FROM candidates c
    CROSS JOIN (VALUES ('name'::text), ('description'::text), ('location'::text)) AS f(field)
    LEFT JOIN dots d ON d.candidate_id = c.id AND d.field = f.field
    LEFT JOIN norms nc ON nc.doc = c.id AND nc.field = f.field
    LEFT JOIN norms nm ON nm.doc = (SELECT id FROM me) AND nm.field = f.field
  ),
  scored AS (
    SELECT c.id AS candidate_id,
           COALESCE(MAX(s.sim) FILTER (WHERE s.field = 'name'), 0) AS name_sim,
           COALESCE(MAX(s.sim) FILTER (WHERE s.field = 'description'), 0) AS description_sim,
           COALESCE(MAX(s.sim) FILTER (WHERE s.field = 'location'), 0) AS location_sim
    FROM candidates c
    LEFT JOIN similarities s ON s.candidate_id = c.id
    GROUP BY c.id
  )
  SELECT sc.candidate_id,
         round(sc.name_sim, 4),
         round(sc.description_sim, 4),
         round(sc.location_sim, 4),
         CASE WHEN c.category = me.category THEN 1::numeric ELSE 0::numeric END,
         round(greatest(0::numeric, 1 - abs(c.item_date - me.item_date)::numeric / 14), 4),
         round(
           0.25 * sc.name_sim
           + 0.25 * sc.description_sim
           + 0.15 * sc.location_sim
           + 0.15 * (CASE WHEN c.category = me.category THEN 1::numeric ELSE 0::numeric END)
           + 0.20 * greatest(0::numeric, 1 - abs(c.item_date - me.item_date)::numeric / 14),
           4)
  FROM scored sc
  JOIN candidates c ON c.id = sc.candidate_id
  CROSS JOIN me;
$$;

REVOKE EXECUTE ON FUNCTION private.lost_found_match_scores(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.lost_found_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_threshold numeric;
  v_candidate record;
  v_lost uuid;
  v_found uuid;
  v_new_match uuid;
  v_counterpart_owner uuid;
  v_counterpart_name text;
BEGIN
  INSERT INTO public.lost_found_owners (item_id, owner_id) VALUES (NEW.id, auth.uid());
  INSERT INTO public.lost_found_history (item_id, actor_role, kind) VALUES (NEW.id, 'student', 'created');

  SELECT s.min_match_score INTO v_threshold FROM public.lost_found_settings s WHERE s.id = 1;

  FOR v_candidate IN
    SELECT * FROM private.lost_found_match_scores(NEW.id) m WHERE m.total_score >= v_threshold
  LOOP
    IF NEW.report_type = 'lost' THEN
      v_lost := NEW.id;
      v_found := v_candidate.candidate_id;
    ELSE
      v_lost := v_candidate.candidate_id;
      v_found := NEW.id;
    END IF;

    INSERT INTO public.lost_found_matches (
      lost_item_id, found_item_id, score, name_similarity, description_similarity,
      location_similarity, category_score, date_score
    )
    VALUES (
      v_lost, v_found, v_candidate.total_score, v_candidate.name_similarity, v_candidate.description_similarity,
      v_candidate.location_similarity, v_candidate.category_score, v_candidate.date_score
    )
    ON CONFLICT (lost_item_id, found_item_id) DO NOTHING
    RETURNING id INTO v_new_match;

    IF v_new_match IS NOT NULL THEN
      INSERT INTO public.lost_found_history (item_id, match_id, actor_role, kind)
      VALUES
        (NEW.id, v_new_match, 'system', 'match_suggested'),
        (v_candidate.candidate_id, v_new_match, 'system', 'match_suggested');

      INSERT INTO public.notifications (recipient_id, kind, title, body, item_id, match_id)
      VALUES (
        auth.uid(),
        'lost_found_match_suggested',
        'Possible match suggested',
        'Your item "' || NEW.name || '" may match a report. Similarity: ' || round(v_candidate.total_score * 100) || '%. Open it to review.',
        NEW.id,
        v_new_match
      );

      SELECT o.owner_id INTO v_counterpart_owner FROM public.lost_found_owners o WHERE o.item_id = v_candidate.candidate_id;
      SELECT i.name INTO v_counterpart_name FROM public.lost_found_items i WHERE i.id = v_candidate.candidate_id;

      INSERT INTO public.notifications (recipient_id, kind, title, body, item_id, match_id)
      VALUES (
        v_counterpart_owner,
        'lost_found_match_suggested',
        'Possible match suggested',
        'Your item "' || v_counterpart_name || '" may match a report. Similarity: ' || round(v_candidate.total_score * 100) || '%. Open it to review.',
        v_candidate.candidate_id,
        v_new_match
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.lost_found_after_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS lost_found_items_after_insert ON public.lost_found_items;
CREATE TRIGGER lost_found_items_after_insert
  AFTER INSERT ON public.lost_found_items
  FOR EACH ROW EXECUTE FUNCTION private.lost_found_after_insert();

CREATE OR REPLACE FUNCTION public.respond_lost_found_match(p_match uuid, p_decision text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  m public.lost_found_matches%ROWTYPE;
  v_my_item uuid;
  v_other_item uuid;
  v_other_owner uuid;
  v_other_name text;
  v_role text;
BEGIN
  IF p_decision NOT IN ('confirm', 'dismiss') THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT * INTO m FROM public.lost_found_matches WHERE id = p_match;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT o.item_id INTO v_my_item
  FROM public.lost_found_owners o
  WHERE o.owner_id = auth.uid() AND o.item_id IN (m.lost_item_id, m.found_item_id)
  LIMIT 1;
  IF v_my_item IS NULL THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF m.status <> 'suggested' THEN
    RAISE EXCEPTION 'This match has already been answered' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  v_other_item := CASE WHEN v_my_item = m.lost_item_id THEN m.found_item_id ELSE m.lost_item_id END;
  SELECT o.owner_id INTO v_other_owner FROM public.lost_found_owners o WHERE o.item_id = v_other_item;
  SELECT i.name INTO v_other_name FROM public.lost_found_items i WHERE i.id = v_other_item;
  SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = auth.uid();

  UPDATE public.lost_found_matches
  SET status = CASE WHEN p_decision = 'confirm' THEN 'confirmed' ELSE 'dismissed' END,
      responded_at = now()
  WHERE id = m.id;

  INSERT INTO public.lost_found_history (item_id, match_id, actor_role, kind)
  VALUES
    (m.lost_item_id, m.id, v_role, CASE WHEN p_decision = 'confirm' THEN 'match_confirmed' ELSE 'match_dismissed' END),
    (m.found_item_id, m.id, v_role, CASE WHEN p_decision = 'confirm' THEN 'match_confirmed' ELSE 'match_dismissed' END);

  IF p_decision = 'confirm' THEN
    INSERT INTO public.notifications (recipient_id, kind, title, body, item_id, match_id)
    VALUES (
      v_other_owner,
      'lost_found_match_confirmed',
      'Possible match confirmed',
      'The other student confirmed the possible match for your item "' || v_other_name || '".',
      v_other_item,
      m.id
    );
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_lost_found_match(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_lost_found_match(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_lost_found_recovered(p_item uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  i public.lost_found_items%ROWTYPE;
  v_role text;
BEGIN
  SELECT * INTO i FROM public.lost_found_items WHERE id = p_item;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.lost_found_owners o WHERE o.item_id = i.id AND o.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF i.status <> 'open' THEN
    RAISE EXCEPTION 'This item is already marked as recovered' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT p.role INTO v_role FROM public.profiles p WHERE p.id = auth.uid();

  UPDATE public.lost_found_items
  SET status = 'recovered', recovered_at = now(), updated_at = now()
  WHERE id = i.id;

  INSERT INTO public.lost_found_history (item_id, actor_role, kind) VALUES (i.id, v_role, 'recovered');

  UPDATE public.lost_found_matches
  SET status = 'closed'
  WHERE status = 'suggested' AND (lost_item_id = i.id OR found_item_id = i.id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_lost_found_recovered(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_lost_found_recovered(uuid) TO authenticated;

ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.lost_found_items TO authenticated;
GRANT INSERT (id, report_type, name, category, description, location, item_date, approx_time, image_path) ON public.lost_found_items TO authenticated;
GRANT SELECT ON public.lost_found_owners TO authenticated;
GRANT SELECT ON public.lost_found_settings TO authenticated;
GRANT SELECT ON public.lost_found_matches TO authenticated;
GRANT SELECT ON public.lost_found_history TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "select_lost_found_items" ON public.lost_found_items;
CREATE POLICY "select_lost_found_items" ON public.lost_found_items FOR SELECT
  TO authenticated
  USING (private.current_role_in(ARRAY['student', 'assistant_registrar']));

DROP POLICY IF EXISTS "insert_own_lost_found_item" ON public.lost_found_items;
CREATE POLICY "insert_own_lost_found_item" ON public.lost_found_items FOR INSERT
  TO authenticated
  WITH CHECK (
    private.current_role_in(ARRAY['student'])
    AND item_date <= current_date
    AND (image_path IS NULL OR split_part(image_path, '/', 1) = auth.uid()::text)
  );

DROP POLICY IF EXISTS "select_own_lost_found_owner" ON public.lost_found_owners;
CREATE POLICY "select_own_lost_found_owner" ON public.lost_found_owners FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "select_lost_found_settings" ON public.lost_found_settings;
CREATE POLICY "select_lost_found_settings" ON public.lost_found_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "select_visible_lost_found_matches" ON public.lost_found_matches;
CREATE POLICY "select_visible_lost_found_matches" ON public.lost_found_matches FOR SELECT
  TO authenticated
  USING (
    private.current_role_in(ARRAY['assistant_registrar'])
    OR EXISTS (
      SELECT 1 FROM public.lost_found_owners o
      WHERE o.owner_id = auth.uid()
        AND o.item_id IN (lost_found_matches.lost_item_id, lost_found_matches.found_item_id)
    )
  );

DROP POLICY IF EXISTS "select_visible_lost_found_history" ON public.lost_found_history;
CREATE POLICY "select_visible_lost_found_history" ON public.lost_found_history FOR SELECT
  TO authenticated
  USING (
    private.current_role_in(ARRAY['assistant_registrar'])
    OR EXISTS (
      SELECT 1 FROM public.lost_found_owners o
      WHERE o.owner_id = auth.uid() AND o.item_id = lost_found_history.item_id
    )
  );

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lost-found-images', 'lost-found-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "lost_found_images_insert_own_folder" ON storage.objects;
CREATE POLICY "lost_found_images_insert_own_folder" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lost-found-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "lost_found_images_select_visible" ON storage.objects;
CREATE POLICY "lost_found_images_select_visible" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lost-found-images'
    AND EXISTS (SELECT 1 FROM public.lost_found_items i WHERE i.image_path = storage.objects.name)
  );

DROP POLICY IF EXISTS "lost_found_images_delete_own_folder" ON storage.objects;
CREATE POLICY "lost_found_images_delete_own_folder" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lost-found-images' AND (storage.foldername(name))[1] = auth.uid()::text);
