import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_KPI_CARD_TITLE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Disabled KPI-style cards so the sponsor dashboard reads as a dashboard before data exists. */
export function SponsorDashboardPreviewMetricCards(): React.JSX.Element {
  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;

  return (
    <section
      aria-labelledby="sponsor-dashboard-preview-metrics-heading"
      className="space-y-3"
      data-testid="sponsor-dashboard-preview-metrics"
    >
      <h2 id="sponsor-dashboard-preview-metrics-heading" className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>
        {v.metricsPreviewSectionTitle}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {v.metricsPreviewCards.map((metric) => (
          <Card
            key={metric.title}
            className="border-neutral-200 bg-neutral-50/40 opacity-95 dark:border-neutral-800 dark:bg-neutral-950/30"
            data-testid={`sponsor-dashboard-preview-metric-${metric.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className={OPERATOR_KPI_CARD_TITLE}>{metric.title}</CardTitle>
              <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p
                className={cn("m-0 tabular-nums text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.executiveDashboardMetric)}
                aria-hidden="true"
              >
                —
              </p>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{v.metricsPreviewUnavailableFootnote}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
