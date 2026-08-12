import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import {
  SAMPLE_REVIEW_AHA_DECISION_LABEL,
  SAMPLE_REVIEW_AHA_EVIDENCE_LABEL,
  SAMPLE_REVIEW_AHA_FINDING_LABEL,
  SAMPLE_REVIEW_AHA_WHY_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import {
  OPERATOR_LAYOUT,
  OPERATOR_SURFACE_CARD_CLASS,
  OPERATOR_TYPOGRAPHY,
  OPERATOR_TYPE_SCALE,
} from "@/lib/design-tokens";
import type { ShowcaseHomeAhaMoment } from "@/lib/showcase-home-aha-moment";

type SampleReviewAhaMomentPanelProps = {
  readonly moment: ShowcaseHomeAhaMoment;
  readonly findingHref: string;
  readonly ctaLabel: string;
  readonly ctaTestId?: string;
  readonly heading: string;
  readonly lead?: string;
  readonly demoLabel?: string;
};

function AhaDetail(props: { readonly label: string; readonly body: string }): ReactElement {
  return (
    <div className="space-y-1">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label, "text-al-text-primary")}>{props.label}</p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary leading-relaxed")}>{props.body}</p>
    </div>
  );
}

/** First-run value moment: one finding, why it matters, evidence, and decision impact. */
export function SampleReviewAhaMomentPanel(props: SampleReviewAhaMomentPanelProps): ReactElement {
  const { moment, findingHref, ctaLabel, ctaTestId, heading, lead, demoLabel } = props;

  return (
    <section
      aria-labelledby="sample-review-aha-moment-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "space-y-4 p-4")}
      data-testid="sample-review-aha-moment-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {demoLabel ? (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200")}>
              {demoLabel}
            </p>
          ) : null}
          <h3
            id="sample-review-aha-moment-heading"
            className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}
          >
            {heading}
          </h3>
          {lead ? (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-al-text-secondary")}>{lead}</p>
          ) : null}
        </div>
        <Button asChild variant="outline" size="sm" className="h-8 shrink-0">
          <Link href={findingHref} data-testid={ctaTestId}>
            {ctaLabel}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border border-neutral-200/80 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className={cn("flex flex-wrap items-center gap-2", OPERATOR_LAYOUT.inlineGap)}>
          <SeverityTag severity={moment.severity} />
          <span className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>{moment.title}</span>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AhaDetail label={SAMPLE_REVIEW_AHA_FINDING_LABEL} body={moment.finding} />
          <AhaDetail label={SAMPLE_REVIEW_AHA_WHY_LABEL} body={moment.whyItMatters} />
          <AhaDetail label={SAMPLE_REVIEW_AHA_EVIDENCE_LABEL} body={moment.evidenceSupport} />
          <AhaDetail label={SAMPLE_REVIEW_AHA_DECISION_LABEL} body={moment.decisionChange} />
        </div>
      </div>
    </section>
  );
}
