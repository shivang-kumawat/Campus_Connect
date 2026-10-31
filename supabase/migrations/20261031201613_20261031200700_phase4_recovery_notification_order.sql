/*
# Phase 4: recovery notifications, step ordering fix

## Plain-English summary
The recovery notification step must run before open suggestions are closed. Otherwise
the notification query would no longer find the suggested matches and recipients of
suggested matches would not be notified. This migration recreates the recovery
function with notifications written first. Behavior is otherwise identical.

## Changes
1. public.mark_lost_found_recovered(uuid): reordered. Same authorization, status
   checks, history insert and match closing; the recovery notifications are inserted
   before the closing update.

## Security
- No grants, RLS policies, or table permissions change.
- The function stays SECURITY DEFINER with an empty search_path.
*/

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

UPDATE public.lost_found_matches
SET status = 'closed'
WHERE status = 'suggested' AND (lost_item_id = i.id OR found_item_id = i.id);
END;
$function$;
