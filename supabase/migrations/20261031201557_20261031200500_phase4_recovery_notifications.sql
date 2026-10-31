/*
# Phase 4: recovery notifications

## Plain-English summary
When a student marks a lost or found item as recovered, every other student whose
possible match or confirmed match involved that item now receives an in-app
notification naming the recovered item and stating that it was recovered. Recovery
notifications appear in the existing notifications list with the same read/unread
behavior as match notifications.

## Changes
1. notifications.kind check: adds the new kind `lost_found_item_recovered`. Existing
   kinds are kept unchanged.
2. New unique index on notifications (recipient_id, match_id) for recovery notifications.
   It guarantees one recovery notification per recipient per match, even if the
   function is ever invoked again.
3. public.mark_lost_found_recovered(uuid): same authorization, status checks, history,
   and match closing as before. After the item is marked recovered, it inserts one
   notification for each owner of the other item in every suggested or confirmed match
   involving the item. The notification is written in the same transaction, so if the
   recovery fails no notification is sent.

## Security
- No table grants or RLS policies change.
- The function remains SECURITY DEFINER with an empty search_path and the same
  EXECUTE grants as before.
- Notification text contains only item names. Owner identity is never included.
- Only the item owner can trigger recovery, so only that owner's counterparts are notified.

## Notes
- Recovery notifications are not sent to the student who marked the item recovered.
- Students can still only read and mark-as-read their own notifications.
*/

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('lost_found_match_suggested', 'lost_found_match_confirmed', 'lost_found_item_recovered'));

CREATE UNIQUE INDEX IF NOT EXISTS notifications_recovery_once_idx
  ON public.notifications (recipient_id, match_id)
  WHERE kind = 'lost_found_item_recovered';

CREATE OR REPLACE FUNCTION public.mark_lost_found_recovered(p_item uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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

INSERT INTO public.notifications (recipient_id, kind, title, body, item_id, match_id)
SELECT
o.owner_id,
'lost_found_item_recovered',
'Item marked as recovered',
'Good news: "' || i.name || '" has been marked as Recovered. Your report "' || other_item.name || '" is no longer matched to it.',
other_item.id,
m.id
FROM public.lost_found_matches m
JOIN public.lost_found_items other_item
  ON other_item.id = CASE WHEN m.lost_item_id = i.id THEN m.found_item_id ELSE m.lost_item_id END
JOIN public.lost_found_owners o ON o.item_id = other_item.id
WHERE m.status IN ('suggested', 'confirmed')
  AND (m.lost_item_id = i.id OR m.found_item_id = i.id)
ON CONFLICT (recipient_id, match_id) WHERE kind = 'lost_found_item_recovered' DO NOTHING;
END;
$function$;
