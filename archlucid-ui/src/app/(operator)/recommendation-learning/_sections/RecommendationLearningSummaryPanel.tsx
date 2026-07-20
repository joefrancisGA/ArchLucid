import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MetadataStatusLabel } from "@/components/ui/metadata-status-label";
import { OPERATOR_CARD, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { LearningProfile } from "@/types/recommendation-learning";

import {
  RECOMMENDATION_LEARNING_AUTOMATION_STATUS,
  RECOMMENDATION_LEARNING_MODEL_VERSION,
} from "./recommendation-learning-copy";
import {
  aggregateOutcomeTotals,
  buildCategoryAcceptanceTrends,
  buildLearningTimeline,
  buildMostImprovedCategories,
  buildRecommendationsByCategory,
  buildTopLearnedSignals,
  computeCoveragePercent,
  computeLearningConfidence,
  countRecordsAnalyzed,
  deriveLearningHealth,
  formatProfileGeneratedUtc,
  learningHealthLabel,
  listTunedCategories,
  profileHistoryCapLabel,
} from "./recommendation-learning-display";
import {
  RecommendationLearningCategoryVolumeChart,
  RecommendationLearningOutcomeBarChart,
} from "./RecommendationLearningCharts";

type Props = {
  readonly profile: LearningProfile;
};

function learningHealthClass(health: ReturnType<typeof deriveLearningHealth>): string {
  switch (health) {
    case "healthy":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100";
    case "building":
      return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100";
    case "limited":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100";
    case "not-started":
      return "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100";
    default: {
      const exhaustive: never = health;
      return exhaustive;
    }
  }
}

export function RecommendationLearningSummaryPanel(props: Props): ReactElement {
  const { profile } = props;
  const totals = aggregateOutcomeTotals(profile);
  const health = deriveLearningHealth(profile);
  const confidence = computeLearningConfidence(profile);
  const coverage = computeCoveragePercent(profile);
  const improvedCategories = buildMostImprovedCategories(profile);
  const learnedSignals = buildTopLearnedSignals(profile);
  const timeline = buildLearningTimeline(profile);

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200 dark:border-neutral-700">
        <CardHeader className={OPERATOR_CARD.header}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Learning summary</h3>
            <MetadataStatusLabel
              className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", learningHealthClass(health))}
              statusAriaLabel={`Learning health: ${learningHealthLabel(health)}`}
            >
              {learningHealthLabel(health)}
            </MetadataStatusLabel>
          </div>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-4")}>
          <dl className="m-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Status</dt>
              <dd className="m-0 text-al-text-primary">Active learning profile</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Recommendations learned from</dt>
              <dd className="m-0 text-al-text-primary">{countRecordsAnalyzed(profile).toLocaleString()}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Organizations</dt>
              <dd className="m-0 text-al-text-primary">1 (current workspace)</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Accepted</dt>
              <dd className="m-0 text-al-text-primary">{totals.accepted.toLocaleString()}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Rejected</dt>
              <dd className="m-0 text-al-text-primary">{totals.rejected.toLocaleString()}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Deferred</dt>
              <dd className="m-0 text-al-text-primary">{totals.deferred.toLocaleString()}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Implemented</dt>
              <dd className="m-0 text-al-text-primary">{totals.implemented.toLocaleString()}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Recommendation confidence</dt>
              <dd className="m-0 text-al-text-primary">{confidence}%</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Coverage</dt>
              <dd className="m-0 text-al-text-primary">{coverage}% of tuned categories</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Last refreshed</dt>
              <dd className="m-0 text-al-text-primary">{formatProfileGeneratedUtc(profile.generatedUtc)}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Model version</dt>
              <dd className="m-0 text-al-text-primary">{RECOMMENDATION_LEARNING_MODEL_VERSION}</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Categories in learning model</dt>
              <dd className="m-0 text-al-text-primary">
                {listTunedCategories(profile).length > 0
                  ? listTunedCategories(profile).join(", ")
                  : "None yet"}
              </dd>
            </div>
          </dl>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{profileHistoryCapLabel()}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-neutral-200 dark:border-neutral-700">
          <CardHeader className={OPERATOR_CARD.header}>
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Recommendation acceptance trends</h3>
          </CardHeader>
          <CardContent className={OPERATOR_CARD.content}>
            <RecommendationLearningOutcomeBarChart rows={buildCategoryAcceptanceTrends(profile)} />
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-700">
          <CardHeader className={OPERATOR_CARD.header}>
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Recommendations by category</h3>
          </CardHeader>
          <CardContent className={OPERATOR_CARD.content}>
            <RecommendationLearningCategoryVolumeChart rows={buildRecommendationsByCategory(profile)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-neutral-200 dark:border-neutral-700">
          <CardHeader className={OPERATOR_CARD.header}>
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Most improved recommendation categories</h3>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
            {improvedCategories.length > 0 ? (
              <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {improvedCategories.map((row) => (
                  <li key={row.category}>
                    {row.category} — ranking weight +{row.liftPercent}% (model weight {row.weight.toFixed(2)})
                  </li>
                ))}
              </ul>
            ) : (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Category ranking lifts appear once enough outcomes differentiate acceptance patterns.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-700">
          <CardHeader className={OPERATOR_CARD.header}>
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Recommendation confidence</h3>
          </CardHeader>
          <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
            <p className={cn("m-0 text-3xl font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              {confidence}%
            </p>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Confidence grows as more recommendation outcomes are recorded across categories. Historical confidence
              trends require multiple learning refreshes over time.
            </p>
          </CardContent>
        </Card>
      </div>

      {learnedSignals.length > 0 ? (
        <Card className="border-neutral-200 dark:border-neutral-700">
          <CardHeader className={OPERATOR_CARD.header}>
            <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Top learned signals</h3>
          </CardHeader>
          <CardContent className={OPERATOR_CARD.content}>
            <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {learnedSignals.map((signal) => (
                <li key={signal.label}>{signal.label}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-neutral-200 dark:border-neutral-700">
        <CardHeader className={OPERATOR_CARD.header}>
          <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Learning history timeline</h3>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
          <ol className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
            {timeline.map((event) => (
              <li key={event.id} className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700">
                <p className="m-0 font-medium text-al-text-primary">{event.label}</p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {formatProfileGeneratedUtc(event.occurredUtc)}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="border-neutral-200 dark:border-neutral-700">
        <CardHeader className={OPERATOR_CARD.header}>
          <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Automation</h3>
        </CardHeader>
        <CardContent className={cn(OPERATOR_CARD.content, "space-y-2")}>
          <dl className="m-0 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Last automatic refresh</dt>
              <dd className="m-0 text-al-text-primary">Not enabled</dd>
            </div>
            <div>
              <dt className={OPERATOR_NAV_GROUP_LABEL}>Next scheduled refresh</dt>
              <dd className="m-0 text-al-text-primary">Manual recalculation only</dd>
            </div>
          </dl>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {RECOMMENDATION_LEARNING_AUTOMATION_STATUS}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
