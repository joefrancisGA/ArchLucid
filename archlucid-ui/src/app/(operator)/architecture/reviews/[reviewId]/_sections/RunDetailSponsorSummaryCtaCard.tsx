import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_OPEN_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_CARD, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

type RunDetailSponsorSummaryCtaCardProps = {
  readonly runId: string;
  readonly manifestId?: string | null;
  /** Secondary placement when the summary header owns the page primary CTA (TB-618). */
  readonly demoted?: boolean;
};

/** Buyer-polished CTA that jumps to the sponsor report route before manifest drill-down. */
export function RunDetailSponsorSummaryCtaCard(props: RunDetailSponsorSummaryCtaCardProps) {
  const { runId, manifestId = null, demoted = false } = props;
  const sponsorReportHref = `${SPONSOR_REPORT_PATH}?runId=${encodeURIComponent(runId)}`;
  const hasManifest = (manifestId ?? "").trim().length > 0;

  return (
    <Card className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Sponsor report
        </CardTitle>
        <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
          Board-ready risk posture, evidence basis, and approval status. Start here before the Finalized review record and
          deliverables.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, OPERATOR_LAYOUT.sectionHeadingStack)}>
        <Button type="button" variant={demoted ? "outline" : "primary"} asChild>
          <Link href={sponsorReportHref}>Open sponsor report</Link>
        </Button>
        {hasManifest ? (
          <p className="m-0">
            <Link href="#manifest-summary" className={OPERATOR_LINK.nav}>
              {BUYER_OPEN_SIGNED_RECORD_CTA} →
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
