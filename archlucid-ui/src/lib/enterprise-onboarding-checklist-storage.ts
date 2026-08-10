import { ENTERPRISE_ONBOARDING_HUB_STEP_COUNT } from "@/lib/enterprise-onboarding-hub-steps";

export { ENTERPRISE_ONBOARDING_HUB_STEP_COUNT as ENTERPRISE_ONBOARDING_STEP_COUNT };

export const ENTERPRISE_ONBOARDING_CHECKLIST_CHANGED_EVENT =
  "archlucid-enterprise-onboarding-checklist-changed";

const enterpriseOnboardingChecklistStoreListeners = new Set<() => void>();

export function subscribeEnterpriseOnboardingChecklist(onStoreChange: () => void): () => void {
  enterpriseOnboardingChecklistStoreListeners.add(onStoreChange);

  return () => {
    enterpriseOnboardingChecklistStoreListeners.delete(onStoreChange);
  };
}

export function getEnterpriseOnboardingChecklistStorageSnapshot(): string {
  return "";
}

export function getEnterpriseOnboardingChecklistStorageServerSnapshot(): string {
  return "";
}

export function emitEnterpriseOnboardingChecklistChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  setTimeout(() => {
    try {
      for (const listener of enterpriseOnboardingChecklistStoreListeners) {
        listener();
      }

      window.dispatchEvent(new CustomEvent(ENTERPRISE_ONBOARDING_CHECKLIST_CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  }, 0);
}
