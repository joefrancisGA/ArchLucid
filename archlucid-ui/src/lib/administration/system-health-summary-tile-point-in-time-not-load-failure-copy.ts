/** Each system health summary tile is a point-in-time slice, not a live probe failure. */
export const SYSTEM_HEALTH_SUMMARY_TILE_POINT_IN_TIME_NOT_LOAD_FAILURE_LINE =
  "This tile reflects a point-in-time rollup — refresh for a new read, not evidence of a failed health load." as const;
