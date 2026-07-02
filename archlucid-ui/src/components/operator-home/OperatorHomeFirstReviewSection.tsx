import type { ReactNode } from "react";

import { OperatorHomeFirstReviewPathStrip } from "@/components/operator-home/OperatorHomeFirstReviewPathStrip";
import { OperatorHomeFirstReviewProgressCard } from "@/components/operator-home/OperatorHomeFirstReviewProgressCard";
import { OperatorHomeFirstValueCallout } from "@/components/operator-home/OperatorHomeDeferredOnboarding";
import { OperatorHomeProductOutcomesRow } from "@/components/operator-home/OperatorHomeProductOutcomesRow";
import { OperatorHomeSampleReviewPreview } from "@/components/operator-home/OperatorHomeSampleReviewPreview";
import { OPERATOR_HOME_FIRST_REVIEW_SECTION_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_HOME_PRIMARY_SECTION_HEADING, OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator-home-recent-reviews-heading";

import type { OperatorHomePageViewModel } from "@/app/(operator)/_sections/operator-home-page-view-model";
import { OperatorHomeRunsPanel } from "@/components/operator-home/OperatorHomeDeferredPanels";

type OperatorHomeFirstReviewSectionProps = {
  readonly model: OperatorHomePageViewModel;
  readonly hero: ReactNode;
  readonly checklistVariant?: "full" | "compact";
  readonly showFirstValueCallout?: boolean;
};

function HomeSectionHeading(props: { readonly id?: string; readonly children: string }) {
  return (
    <h2 id={props.id} className={OPERATOR_HOME_PRIMARY_SECTION_HEADING}>
      {props.children}
    </h2>
  );
}

/** Section A — first review package: hero, path, outcomes, sample, workspace list, and progress. */
export function OperatorHomeFirstReviewSection(props: OperatorHomeFirstReviewSectionProps): React.JSX.Element {
  const checklistVariant = props.checklistVariant ?? "compact";

  return (
    <section aria-labelledby="operator-home-first-review-section-heading" className={OPERATOR_LAYOUT.majorSectionGap}>
      <HomeSectionHeading id="operator-home-first-review-section-heading">
        {OPERATOR_HOME_FIRST_REVIEW_SECTION_TITLE}
      </HomeSectionHeading>

      <div className={OPERATOR_LAYOUT.sectionStack}>
        {props.hero}
        {props.showFirstValueCallout === true ? <OperatorHomeFirstValueCallout /> : null}
        <OperatorHomeFirstReviewPathStrip />
        <OperatorHomeProductOutcomesRow />
        <OperatorHomeSampleReviewPreview />
        <section aria-labelledby="operator-home-reviews-heading" className={OPERATOR_LAYOUT.sectionHeadingStack}>
          <HomeSectionHeading id="operator-home-reviews-heading">{OPERATOR_HOME_RECENT_REVIEWS_HEADING}</HomeSectionHeading>
          <OperatorHomeRunsPanel hideHeading />
        </section>
        <OperatorHomeFirstReviewProgressCard checklistVariant={checklistVariant} />
      </div>
    </section>
  );
}
