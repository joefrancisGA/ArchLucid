import { ManifestDetailSummaryPanel } from "@/components/ManifestDetailSummaryPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ManifestSummary } from "@/types/authority";

type ManifestDetailOverviewCardProps = {
  readonly summary: ManifestSummary;
  readonly buyerPolishedLayout: boolean;
};

export function ManifestDetailOverviewCard(props: ManifestDetailOverviewCardProps): React.JSX.Element {
  const { summary, buyerPolishedLayout } = props;

  return (
    <Card id="manifest-overview" className="scroll-mt-24">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{buyerPolishedLayout ? "Overview" : "Summary"}</CardTitle>
        <CardDescription>
          {buyerPolishedLayout
            ? "Status, policy posture, and what is included in this package."
            : "Status, rules, and counts for this review."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ManifestDetailSummaryPanel
          summary={summary}
          buyerPolishedLayout={buyerPolishedLayout}
          includeBundleDownload={!buyerPolishedLayout}
        />
      </CardContent>
    </Card>
  );
}
