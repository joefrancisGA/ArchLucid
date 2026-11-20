/** Executive metrics read failure does not prove the snapshot has no remediation KPIs under partial capture. */
export const REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOAD_FAILURE_PARTIAL_CAPTURE_LINE =
  "Executive metrics could not be read; that is not proof this snapshot has no ranked findings when inventory capture completed with gaps." as const;