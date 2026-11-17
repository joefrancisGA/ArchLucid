export const REMEDIATION_FACTORY_SIMULATOR_RANK_DISCIPLINE =
  "This explains the queue ranking for the selected finding. It does not change path rank or apply a remediation." as const;

/** Simulator breakdown does not re-run ranking or substitute for a fuller inventory capture. */
export const REMEDIATION_FACTORY_SIMULATOR_NOT_INVENTORY_CAPTURE_LINE =
  "This breakdown uses stored ranks on the current snapshot only — it does not run another capture or re-rank paths." as const;