/** An empty signed-records list under partial capture does not create a sealed review record. */
export const SIGNED_RECORDS_EMPTY_PARTIAL_CAPTURE_LINE =
  "An empty signed-records list is not a failed load. Partial inventory capture does not by itself produce a tenant-sealed golden manifest." as const;