/** Work-queue filter alone matches no rows — not a failed explorer read. */
export const RESOURCE_EXPLORER_WORK_QUEUE_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE =
  "No resources match this work queue. That is not an empty snapshot and not a failed catalog read. Choose All or another queue." as const;