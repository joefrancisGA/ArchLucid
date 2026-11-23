/** Name prefix filter alone matches no rows — not a failed explorer read. */
export const RESOURCE_EXPLORER_NAME_PREFIX_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "No resources match this name prefix filter. That is not an empty snapshot and not a failed catalog read. Shorten or clear the prefix." as const;