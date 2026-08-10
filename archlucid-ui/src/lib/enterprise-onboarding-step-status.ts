import { ENTERPRISE_ONBOARDING_STEP_COUNT } from "@/lib/enterprise-onboarding-checklist-storage";

export type EnterpriseOnboardingStepDerivedStatus = "not-tracked";

export type EnterpriseOnboardingProgressSnapshot = {
  readonly completedCount: number;
  readonly totalCount: number;
};

export function resolveEnterpriseOnboardingStepStatuses(): readonly EnterpriseOnboardingStepDerivedStatus[] {
  return Array.from({ length: ENTERPRISE_ONBOARDING_STEP_COUNT }, () => "not-tracked");
}

export function buildEnterpriseOnboardingProgressFromStatuses(
  statuses: readonly EnterpriseOnboardingStepDerivedStatus[],
): EnterpriseOnboardingProgressSnapshot {
  return {
    completedCount: statuses.filter((status) => status !== "not-tracked").length,
    totalCount: ENTERPRISE_ONBOARDING_STEP_COUNT,
  };
}

export function enterpriseOnboardingStepStatusTag(
  status: EnterpriseOnboardingStepDerivedStatus,
): { readonly kind: "neutral"; readonly label: string } {
  switch (status) {
    case "not-tracked":
      return { kind: "neutral", label: "Tracked outside ArchLucid" };
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}
