/** Resource type filter alone matches no rows — not a failed explorer read. */
export const RESOURCE_EXPLORER_CATEGORY_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "No resources match this resource type filter. That is not an empty snapshot and not a failed catalog read. Clear the type filter or pick a broader type." as const;