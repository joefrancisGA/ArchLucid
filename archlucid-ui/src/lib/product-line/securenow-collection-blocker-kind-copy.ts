/** Explicit blocker kind when collection setup is incomplete — reader role vs subscription vs capture. */
export function resolveSecureNowCollectionBlockerKindLine(stepId: string): string | null {
  switch (stepId) {
    case "provider":
      return "Blocking kind: Azure Reader role is not confirmed on the subscription in scope.";
    case "subscription":
      return "Blocking kind: no Azure subscription is selected for SecureNow scope.";
    case "capture":
      return "Blocking kind: latest inventory capture has not succeeded.";
    default:
      return null;
  }
}