/** Empty priority queue after a successful read is not proof the snapshot has no findings under partial capture. */
export const REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY_PARTIAL_CAPTURE_LINE =
  "An empty priority queue is not proof this snapshot has no ranked findings when inventory capture completed with gaps." as const;