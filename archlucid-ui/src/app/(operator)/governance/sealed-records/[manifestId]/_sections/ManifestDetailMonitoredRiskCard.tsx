import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_MANIFEST_TOP_RISK_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
          <div className={cn("mt-3 space-y-3 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50 p-3", OPERATOR_TYPOGRAPHY.body)}>
            <dl className={cn("m-0 grid gap-2 text-al-text-primary sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Severity
                </dt>
                <dd className="m-0 mt-0.5">High</dd>
              </div>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Risk area
                </dt>
                <dd className="m-0 mt-0.5">PHI minimization</dd>
              </div>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Disposition
                </dt>
                <dd className="m-0 mt-0.5">Accepted with monitoring</dd>
              </div>
              <div>
                <dt className={OPERATOR_NAV_GROUP_LABEL}>
                  Blocking status
                </dt>
                <dd className="m-0 mt-0.5">Non-blocking</dd>
              </div>
            </dl>
            <ul className={cn("m-0 list-none space-y-2 p-0 leading-snug text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                <strong className="text-neutral-900 dark:text-neutral-100">Risk:</strong> expanded breach and audit
                scope if minimization is understated.
              </li>
              <li>
                <strong className="text-neutral-900 dark:text-neutral-100">Mitigation:</strong> classification at
                ingress, adapter boundaries, retention controls tied to evidence in this package.
              </li>
              <li>
                <strong className="text-neutral-900 dark:text-neutral-100">Validation:</strong> trace exception paths
                and attachment volume through go-live monitoring.
              </li>
            </ul>
          </div>
        ) : null}
        <div className="mt-4">
          <Button variant="secondary" size="sm" asChild>
            <Link
              href={
                primaryFindingHref ?? `/architecture/reviews/${encodeURIComponent(summary.runId)}#run-explanation`
              }
            >
              {primaryFindingHref
                ? BUYER_MANIFEST_TOP_RISK_CTA
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
