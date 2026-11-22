/**
 * The resource hub findings tab has no severity chip.
 * An empty architecture-review stream must not be read as that chip or as a failed read.
 */
export const RESOURCE_HUB_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_EMPTY_LINE =
  "This architecture-review stream has no findings for this resource. That is not a severity filter result and not a failed findings read." as const;
