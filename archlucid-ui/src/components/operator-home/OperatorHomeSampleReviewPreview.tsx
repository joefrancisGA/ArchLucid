import Link from "next/link";

import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { SampleReviewAhaMomentPanel } from "@/components/operator-home/SampleReviewAhaMomentPanel";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  BUYER_HOME_PRIMARY_CTA,
  OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA,
  OPERATOR_HOME_SAMPLE_FINDINGS_HEADING,
  OPERATOR_HOME_SAMPLE_FINDINGS_LEAD,
  OPERATOR_HOME_SAMPLE_REVIEW_DISCOVERED_SUMMARY,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { SHOWCASE_HOME_AHA_MOMENT, showcasePrimaryFindingHref } from "@/lib/showcase-home-aha-moment";
import { SHOWCASE_HOME_SAMPLE_FINDINGS } from "@/lib/showcase-home-sample-findings";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

const fullExampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/**
 * First-run sample review preview — primary aha moment plus compact secondary findings (TB-353).
 */
export function OperatorHomeSampleReviewPreview(): React.JSX.Element | null {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  if (hasCommittedArchitectureReview) {
    return null;
  }

  const secondaryFindings = SHOWCASE_HOME_SAMPLE_FINDINGS.slice(1);

  return (
    <div className={cn(OPERATOR_LAYOUT.sectionStack, OPERATOR_CARD.nested)} data-testid="operator-home-sample-review-preview">
      <SampleReviewAhaMomentPanel
        moment={SHOWCASE_HOME_AHA_MOMENT}
        findingHref={showcasePrimaryFindingHref(SHOWCASE_STATIC_DEMO_RUN_ID)}
        ctaLabel={BUYER_HOME_PRIMARY_CTA}
        ctaTestId="operator-home-sample-review-open"
        heading={OPERATOR_HOME_SAMPLE_FINDINGS_HEADING}
        lead={OPERATOR_HOME_SAMPLE_FINDINGS_LEAD}
        demoLabel={undefined}
      />

      <p className={cn("m-0", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>
        {OPERATOR_HOME_SAMPLE_REVIEW_DISCOVERED_SUMMARY}
      </p>

      <ul
        className="m-0 list-none space-y-2 p-0"
        data-testid="operator-home-sample-review-finding-list"
      >
        {secondaryFindings.map((finding) => (
          <li
            key={finding.id}
            className="rounded-md border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
            data-testid={`operator-home-sample-review-finding-${finding.id}`}
          >
            <div className={cn("flex flex-wrap items-center gap-2", OPERATOR_LAYOUT.inlineGap)}>
              <SeverityTag severity={finding.severity} />
              <span className={cn(OPERATOR_TYPE_SCALE.meta, "font-semibold text-al-text-primary")}>{finding.title}</span>
            </div>
            <p className={cn("m-0 mt-1", OPERATOR_TYPE_SCALE.meta, "text-al-text-secondary")}>{finding.summary}</p>
          </li>
        ))}
      </ul>

      <div>
        <Button asChild variant="primary" size="sm" className="h-8">
          <Link href={fullExampleReviewHref} data-testid="operator-home-sample-review-open-full">
            {OPERATOR_HOME_OPEN_FULL_EXAMPLE_REVIEW_CTA}
          </Link>
        </Button>
      </div>
    </div>
  );
}
