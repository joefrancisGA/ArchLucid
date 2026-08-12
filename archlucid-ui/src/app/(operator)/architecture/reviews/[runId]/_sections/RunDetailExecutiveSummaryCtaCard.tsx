import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_OPEN_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type RunDetailExecutiveSummaryCtaCardProps = {
  readonly runId: string;
  /** Secondary placement when the summary header owns the page primary CTA (TB-618). */
  readonly demoted?: boolean;
};

/** Buyer-polished CTA that jumps to the executive summary route before manifest drill-down. */
export function RunDetailExecutiveSummaryCtaCard(props: RunDetailExecutiveSummaryCtaCardProps) {
  const { runId, demoted = false } = props;

  return (
    <Card className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Executive summary
        </CardTitle>
        <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
          Board-ready risk posture, evidence basis, and governance status. Start here before the signed review record and
          deliverables.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, OPERATOR_LAYOUT.sectionHeadingStack)}>
        <Button type="button" variant={demoted ? "outline" : "primary"} asChild>
          <Link href={`/architecture/reviews/${encodeURIComponent(runId)}`}>Open executive summary</Link>
        </Button>
        <p className="m-0">
          <Link
            href="#manifest-summary"
            className={OPERATOR_LINK.nav}
          >
            {BUYER_OPEN_SIGNED_RECORD_CTA} →
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
