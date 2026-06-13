-- Remove the ":3rd" suffix convention for Best 3rd wildcard picks.
-- The app now stores the R32 match winner directly (one row per match),
-- and derives the Best 3rd qualifier from that winner vs the auto-assigned slotA team.

DELETE FROM knockout_predictions WHERE match_id LIKE '%:3rd';

DELETE FROM actual_results WHERE result_type = 'knockout' AND ref_id LIKE '%:3rd';
