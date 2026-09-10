/**
 * Paths exempt from calling `evaluateCareerArtifactHonesty()` until migrated.
 * FC-07: every entry MUST have a matching `FC-0078-WAIVER` comment in this file — the ratchet guard fails otherwise.
 */
export const CAREER_ARTIFACT_HONESTY_GRANDFATHER_WAIVER_MARKER = "FC-0078-WAIVER" as const;

/** FC-0078-WAIVER: none — FC-18 migrated export formatters to evaluateCareerArtifactHonesty. */
export const CAREER_EXPORT_FORMATTER_GRANDFATHERED_PATHS = [] as const;

export const CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS = [
  ...CAREER_EXPORT_FORMATTER_GRANDFATHERED_PATHS,
] as const;
