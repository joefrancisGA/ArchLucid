import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ManifestSummary } from "@/types/authority";

type ManifestDetailMonitoredRiskCardProps = {
  readonly summary: ManifestSummary;
  readonly buyerPolishedLayout: boolean;
  readonly primaryFindingHref: string | null;
};

export function ManifestDetailMonitoredRiskCard(props: ManifestDetailMonitoredRiskCardProps): React.JSX.Element | null {
  const { summary, buyerPolishedLayout, primaryFindingHref } = props;
  const showMonitoredRisk = summary.warningCount > 0 || summary.unresolvedIssueCount > 0;

  if (!showMonitoredRisk) {
    return null;
  }

  return (
    <Card
      id={buyerPolishedLayout ? "manifest-monitored-risk" : undefined}
      className={buyerPolishedLayout ? "scroll-mt-24" : undefined}
    >
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
          {buyerPolishedLayout ? "Related monitored risk" : "Related findings"}
        </CardTitle>
        <CardDescription>
          {buyerPolishedLayout
            ? "This package records a monitored risk that maps back to the originating review and evidence trail."
            : "Warnings or unresolved issues on this review correspond to surfaced findings on the originating review."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className={cn("m-0 max-w-prose text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolishedLayout
            ? "Use the review summary to open each finding with full context and trace detail when available."
            : "Open the aggregate architecture review summary on review detail — per-finding links appear when trace confidence rows are available."}
        </p>
        {buyerPolishedLayout && primaryFindingHref ? (
          <p className={cn("m-0 mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Severity, disposition, and risk area were not loaded on this card.
          </p>
        ) : null}
        <div className="mt-4">
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={
                primaryFindingHref ?? `/architecture/reviews/${encodeURIComponent(summary.runId)}#run-explanation`
              }
            >
              {primaryFindingHref
                ? "Open the linked finding."
                : buyerPolishedLayout
                  ? "View findings on review"
                  : "Open review findings"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
