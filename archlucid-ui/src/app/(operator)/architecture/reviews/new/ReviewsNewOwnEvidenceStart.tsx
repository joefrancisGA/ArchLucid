"use client";

import dynamic from "next/dynamic";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { NewRunWizardSkeleton } from "@/components/skeletons/NewRunWizardSkeleton";
import {
  REVIEWS_NEW_OWN_EVIDENCE_SUMMARY,
  REVIEWS_NEW_OWN_EVIDENCE_TITLE,
} from "@/lib/accelerator-chooser-start-copy";

const FirstPilotIntakeWizard = dynamic(
  () => import("./FirstPilotIntakeWizard").then((module) => module.FirstPilotIntakeWizard),
  { loading: () => <NewRunWizardSkeleton /> },
);

/** Secondary first-run path — own evidence quick start without a starter pack (TB-2136). */
export function ReviewsNewOwnEvidenceStart(): React.JSX.Element {
  return (
    <CollapsibleSection
      title={REVIEWS_NEW_OWN_EVIDENCE_TITLE}
      summaryLine={REVIEWS_NEW_OWN_EVIDENCE_SUMMARY}
      sectionTestId="reviews-new-own-evidence-start"
    >
      <FirstPilotIntakeWizard />
    </CollapsibleSection>
  );
}
