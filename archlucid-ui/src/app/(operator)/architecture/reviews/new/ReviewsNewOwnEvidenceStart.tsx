"use client";

import { ReviewsNewFirstPilotIntakeWizardDeferred } from "./reviews-new-path-switcher-deferred-chunks";

/**
 * Primary first-run path — describe or upload your own architecture evidence (TB-2136).
 * No section heading here: the wizard's own "Create review" card is self-labelling.
 */
export function ReviewsNewOwnEvidenceStart(): React.JSX.Element {
  return (
    <section data-testid="reviews-new-own-evidence-start">
      <ReviewsNewFirstPilotIntakeWizardDeferred />
    </section>
  );
}
