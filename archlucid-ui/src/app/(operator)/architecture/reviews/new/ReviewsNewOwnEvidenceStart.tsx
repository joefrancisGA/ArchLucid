"use client";

import dynamic from "next/dynamic";

import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";

const FirstPilotIntakeWizard = dynamic(
  () => import("./FirstPilotIntakeWizard").then((module) => module.FirstPilotIntakeWizard),
  { loading: () => <NewRunWizardSkeleton /> },
);

/**
 * Primary first-run path — describe or upload your own architecture evidence (TB-2136).
 * No section heading here: the wizard's own "Create review" card is self-labelling.
 */
export function ReviewsNewOwnEvidenceStart(): React.JSX.Element {
  return (
    <section data-testid="reviews-new-own-evidence-start">
      <FirstPilotIntakeWizard />
    </section>
  );
}
