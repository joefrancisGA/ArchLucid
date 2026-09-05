"use client";

import { useMemo, useSyncExternalStore } from "react";

import { OperatorHomeContinueLastReviewPackageSection } from "@/components/operator-home/OperatorHomeContinueLastReviewPackageSection";
import { OperatorHomeInFlightReviewsSection } from "@/components/operator-home/OperatorHomeInFlightReviewsSection";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { listIncompleteWizardSignals } from "@/lib/unfinished-work-rail";
import { resolveOperatorHomeResumeAffordancePlan } from "@/lib/operator/operator-home-resume-affordance";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeInFlightSectionProps = {
  readonly runs: readonly RunSummary[];
};

function subscribeWizardSessions(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent): void => {
    if (event.storageArea === window.sessionStorage) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
  };
}

function getIncompleteWizardSnapshot(): ReturnType<typeof listIncompleteWizardSignals> {
  return listIncompleteWizardSignals();
}

/** Working-mode in-flight reviews with a single primary resume affordance. */
export function OperatorHomeInFlightSection(props: OperatorHomeInFlightSectionProps): React.JSX.Element {
  const drafts = useArchitectureDraftRegistryEntries();
  const incompleteWizards = useSyncExternalStore(
    subscribeWizardSessions,
    getIncompleteWizardSnapshot,
    getIncompleteWizardSnapshot,
  );
  const resumePlan = useMemo(
    () =>
      resolveOperatorHomeResumeAffordancePlan({
        runs: props.runs,
        drafts,
        incompleteWizards,
      }),
    [drafts, incompleteWizards, props.runs],
  );

  return (
    <div className={OPERATOR_LAYOUT.sectionStack}>
      {resumePlan.showContinueLast ? (
        <OperatorHomeContinueLastReviewPackageSection
          runs={props.runs}
          buttonVariant={resumePlan.continueLastVariant}
        />
      ) : null}
      <OperatorHomeInFlightReviewsSection />
    </div>
  );
}
