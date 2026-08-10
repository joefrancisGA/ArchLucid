"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getEnterpriseOnboardingChecklistStorageServerSnapshot,
  getEnterpriseOnboardingChecklistStorageSnapshot,
  subscribeEnterpriseOnboardingChecklist,
} from "@/lib/enterprise-onboarding-checklist-storage";
import {
  buildEnterpriseOnboardingProgressFromStatuses,
  resolveEnterpriseOnboardingStepStatuses,
  type EnterpriseOnboardingProgressSnapshot,
  type EnterpriseOnboardingStepDerivedStatus,
} from "@/lib/enterprise-onboarding-step-status";

export type EnterpriseOnboardingDerivedStepStatusState = {
  readonly statuses: readonly EnterpriseOnboardingStepDerivedStatus[];
  readonly progress: EnterpriseOnboardingProgressSnapshot;
};

export function useEnterpriseOnboardingDerivedStepStatus(): EnterpriseOnboardingDerivedStepStatusState {
  useSyncExternalStore(
    subscribeEnterpriseOnboardingChecklist,
    getEnterpriseOnboardingChecklistStorageSnapshot,
    getEnterpriseOnboardingChecklistStorageServerSnapshot,
  );

  return useMemo((): EnterpriseOnboardingDerivedStepStatusState => {
    const statuses = resolveEnterpriseOnboardingStepStatuses();
    const progress = buildEnterpriseOnboardingProgressFromStatuses(statuses);

    return { statuses, progress };
  }, []);
}
