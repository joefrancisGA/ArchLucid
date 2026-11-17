/** Resource hub overview reads stored snapshot inventory for this resource. */
export const RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_LINE =
  "Overview fields read stored snapshot inventory. Partial capture may omit related resources until recovery succeeds." as const;

/** Diagram tab correspondence uses the pinned snapshot, not live Azure. */
export const RESOURCE_HUB_DIAGRAM_TAB_PARTIAL_CAPTURE_LINE =
  "Diagram correspondence on this tab reflects the pinned inventory snapshot. Partial capture may hide matches." as const;

/** Terraform mapping and advisory text read stored snapshot inventory for this resource. */
export const RESOURCE_HUB_TERRAFORM_TAB_PARTIAL_CAPTURE_LINE =
  "Terraform mapping reads stored snapshot inventory on this tab. Partial capture may omit resource context." as const;

/** Drift tab recent changes read stored snapshot inventory for this resource. */
export const RESOURCE_HUB_DRIFT_TAB_PARTIAL_CAPTURE_LINE =
  "Drift changes on this tab read stored snapshot inventory. Partial capture may hide configuration changes." as const;

/** Remediation instances on this tab read stored evaluation and factory records for this resource. */
export const RESOURCE_HUB_REMEDIATION_TAB_PARTIAL_CAPTURE_LINE =
  "Remediation instances on this tab read stored records for this resource. Partial capture may omit open remediation work." as const;