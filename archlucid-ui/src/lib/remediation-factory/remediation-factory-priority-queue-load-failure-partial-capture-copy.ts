/** Priority queue read failure does not prove the snapshot has no ranked findings under partial capture. */
export const REMEDIATION_FACTORY_PRIORITY_QUEUE_LOAD_FAILURE_PARTIAL_CAPTURE_LINE =
  "Priority queue could not be read; that is not proof this snapshot has no ranked findings when inventory capture completed with gaps." as const;