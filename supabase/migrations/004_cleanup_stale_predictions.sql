-- Expand group_predictions position range to include 4th place.
-- The save code sends all 4 positions but the original check (1-3) silently
-- dropped position-4 rows via the upsert's error path.
ALTER TABLE group_predictions
  DROP CONSTRAINT group_predictions_predicted_pos_check;
ALTER TABLE group_predictions
  ADD CONSTRAINT group_predictions_predicted_pos_check
  CHECK (predicted_pos BETWEEN 1 AND 4);

-- Remove stale :3rd knockout predictions whose predicted team is no longer
-- ranked 3rd in any group for that bracket. These accumulate when a player
-- changes group rankings (the app's cleanup effect removes the pick from
-- state but the old row survived the upsert).
DELETE FROM knockout_predictions
WHERE match_id LIKE '%:3rd'
  AND NOT EXISTS (
    SELECT 1 FROM group_predictions gp
    WHERE gp.bracket_id = knockout_predictions.bracket_id
      AND gp.team_code = knockout_predictions.predicted_winner
      AND gp.predicted_pos = 3
  );

-- Deduplicate actual_results before adding unique indexes.
-- Keep the most-recently entered row per (ref_id, position) for group results.
DELETE FROM actual_results
WHERE result_type = 'group'
  AND id NOT IN (
    SELECT DISTINCT ON (ref_id, position) id
    FROM actual_results
    WHERE result_type = 'group'
    ORDER BY ref_id, position, entered_at DESC
  );

-- Keep the most-recently entered row per ref_id for knockout results.
DELETE FROM actual_results
WHERE result_type = 'knockout'
  AND id NOT IN (
    SELECT DISTINCT ON (ref_id) id
    FROM actual_results
    WHERE result_type = 'knockout'
    ORDER BY ref_id, entered_at DESC
  );

-- Enforce uniqueness on actual_results going forward.
CREATE UNIQUE INDEX actual_results_group_pos_unique
  ON actual_results (ref_id, position)
  WHERE result_type = 'group';

CREATE UNIQUE INDEX actual_results_knockout_unique
  ON actual_results (ref_id)
  WHERE result_type = 'knockout';
