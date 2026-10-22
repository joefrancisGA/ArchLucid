import { HelpFirstReviewEvidenceChecklistGuideView } from "@/app/(operator)/help/_sections/HelpFirstReviewEvidenceChecklistGuideView";
import { HelpFirstValue20GuideView } from "@/app/(operator)/help/_sections/HelpFirstValue20GuideView";
import { HelpTopicAuthorityGate } from "@/app/(operator)/help/_sections/HelpTopicAuthorityGate";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS } from "@/lib/design-tokens";
import { tryLoadFoldedInternalRunbook } from "@/lib/load-product-documentation";

/** Admin-only runbooks folded into `/help/first-architecture-review` (Batch R — FI / HEF). */
export function HelpCorePilotFoldedAdminRunbookSections(): React.ReactElement | null {
  const firstReview = tryLoadFoldedInternalRunbook("first-review");
  const firstValue20 = tryLoadFoldedInternalRunbook("first-value-20-minutes");

  if (firstReview === null && firstValue20 === null) {
    return null;
  }

  return (
    <>
      {firstReview !== null ? (
        <section
          id="printable-first-run-evidence-checklist"
          className={OPERATOR_SHELL_SCROLL_OFFSET_CLASS}
          data-testid="help-core-pilot-folded-first-review"
        >
          <HelpTopicAuthorityGate entry={firstReview.entry} denied={null}>
            <HelpFirstReviewEvidenceChecklistGuideView
              entry={firstReview.entry}
              markdown={firstReview.markdown}
            />
          </HelpTopicAuthorityGate>
        </section>
      ) : null}

      {firstValue20 !== null ? (
        <section
          id="first-value-in-20-minutes"
          className={OPERATOR_SHELL_SCROLL_OFFSET_CLASS}
          data-testid="help-core-pilot-folded-first-value-20"
        >
          <HelpTopicAuthorityGate entry={firstValue20.entry} denied={null}>
            <HelpFirstValue20GuideView entry={firstValue20.entry} markdown={firstValue20.markdown} />
          </HelpTopicAuthorityGate>
        </section>
      ) : null}
    </>
  );
}
