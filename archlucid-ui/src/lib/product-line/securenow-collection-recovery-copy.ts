/** Primary CTA label for the single blocking collection step. */
export function resolveSecureNowCollectionRecoveryLinkLabel(stepId: string): string {
  switch (stepId) {
    case "provider":
      return "Grant Reader on one subscription";
    case "subscription":
      return "Select one Azure subscription";
    case "capture":
      return "Run or upload a capture";
    default:
      return "Fix this step";
  }
}
