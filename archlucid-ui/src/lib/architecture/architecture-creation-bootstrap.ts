/** Internal marker prefix for placeholder drafts created before the user enters intent. */
export const ARCHITECTURE_CREATION_BOOTSTRAP_INTENT_PREFIX = "[archlucid:architecture-draft-bootstrap]";

/**
 * Satisfies server minimum intent length while remaining obviously replaceable.
 * Never shown to customers — wizard clears fields when this marker is detected.
 */
export const ARCHITECTURE_CREATION_BOOTSTRAP_INTENT =
  `${ARCHITECTURE_CREATION_BOOTSTRAP_INTENT_PREFIX} Describe the system you are designing. Replace this placeholder with your architecture intent, business outcome, actors, and constraints before continuing.`;

export function isArchitectureCreationBootstrapIntent(intent: string | null | undefined): boolean {
  if (intent === null || intent === undefined) {
    return false;
  }

  return intent.trim().startsWith(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT_PREFIX);
}
