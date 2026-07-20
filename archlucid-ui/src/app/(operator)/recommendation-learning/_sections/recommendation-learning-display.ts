import type { LearningProfile, OutcomeStats } from "@/types/recommendation-learning";

const MIN_OUTCOMES_FOR_SIGNAL = 3;
const MIN_RECORDS_FOR_HEALTHY = 30;
const MIN_RECORDS_FOR_BUILDING = 10;
const PROFILE_REBUILD_BATCH_CAP = 5000;

export type RecommendationLearnedSignal = {
  readonly label: string;
};

export type RecommendationOutcomeTotals = {
  readonly accepted: number;
  readonly rejected: number;
  readonly deferred: number;
  readonly implemented: number;
  readonly proposed: number;
};

export type RecommendationLearningHealth = "not-started" | "limited" | "building" | "healthy";

export type RecommendationCategoryTrendRow = {
  readonly category: string;
  readonly accepted: number;
  readonly rejected: number;
  readonly deferred: number;
  readonly implemented: number;
  readonly total: number;
};

export type RecommendationCategoryVolumeRow = {
  readonly category: string;
  readonly count: number;
};

export type RecommendationImprovedCategoryRow = {
  readonly category: string;
  readonly weight: number;
  readonly liftPercent: number;
};

export type RecommendationLearningTimelineEvent = {
  readonly id: string;
  readonly label: string;
  readonly occurredUtc: string;
};

/** Sum of analyzed recommendation rows (each row counted once via category buckets). */
export function countRecordsAnalyzed(profile: LearningProfile): number {
  return profile.categoryStats.reduce((total, stat) => total + stat.proposedCount, 0);
}

export function profileHasInsufficientHistory(profile: LearningProfile): boolean {
  return countRecordsAnalyzed(profile) === 0;
}

export function listTunedCategories(profile: LearningProfile): readonly string[] {
  return Object.keys(profile.categoryWeights).sort((left, right) => left.localeCompare(right));
}

export function aggregateOutcomeTotals(profile: LearningProfile): RecommendationOutcomeTotals {
  return profile.categoryStats.reduce<RecommendationOutcomeTotals>(
    (totals, stat) => ({
      proposed: totals.proposed + stat.proposedCount,
      accepted: totals.accepted + stat.acceptedCount,
      rejected: totals.rejected + stat.rejectedCount,
      deferred: totals.deferred + stat.deferredCount,
      implemented: totals.implemented + stat.implementedCount,
    }),
    { proposed: 0, accepted: 0, rejected: 0, deferred: 0, implemented: 0 },
  );
}

export function computeLearningConfidence(profile: LearningProfile): number {
  const totals = aggregateOutcomeTotals(profile);

  if (totals.proposed === 0) {
    return 0;
  }

  const volumeFactor = Math.min(1, totals.proposed / MIN_RECORDS_FOR_HEALTHY);
  const positiveRate = (totals.accepted + totals.implemented) / totals.proposed;
  const categoryCoverage = listTunedCategories(profile).length;
  const coverageFactor = Math.min(1, categoryCoverage / 4);

  return Math.round(volumeFactor * 55 + positiveRate * 25 + coverageFactor * 20);
}

export function computeCoveragePercent(profile: LearningProfile): number {
  const categoriesWithHistory = profile.categoryStats.filter((stat) => stat.proposedCount >= MIN_OUTCOMES_FOR_SIGNAL).length;
  const tunedCategories = listTunedCategories(profile).length;
  const denominator = Math.max(tunedCategories, categoriesWithHistory, 1);

  return Math.round((categoriesWithHistory / denominator) * 100);
}

export function deriveLearningHealth(profile: LearningProfile | null): RecommendationLearningHealth {
  if (profile === null || profileHasInsufficientHistory(profile)) {
    return "not-started";
  }

  const records = countRecordsAnalyzed(profile);

  if (records < MIN_RECORDS_FOR_BUILDING) {
    return "limited";
  }

  if (records < MIN_RECORDS_FOR_HEALTHY) {
    return "building";
  }

  return "healthy";
}

export function learningHealthLabel(health: RecommendationLearningHealth): string {
  switch (health) {
    case "healthy":
      return "Healthy";
    case "building":
      return "Building";
    case "limited":
      return "Limited history";
    case "not-started":
      return "Not started";
    default: {
      const exhaustive: never = health;
      return exhaustive;
    }
  }
}

export function buildCategoryAcceptanceTrends(profile: LearningProfile): readonly RecommendationCategoryTrendRow[] {
  return profile.categoryStats
    .filter((stat) => stat.proposedCount > 0)
    .map((stat) => ({
      category: stat.key,
      accepted: stat.acceptedCount,
      rejected: stat.rejectedCount,
      deferred: stat.deferredCount,
      implemented: stat.implementedCount,
      total: stat.proposedCount,
    }))
    .sort((left, right) => right.total - left.total);
}

export function buildRecommendationsByCategory(profile: LearningProfile): readonly RecommendationCategoryVolumeRow[] {
  return buildCategoryAcceptanceTrends(profile).map((row) => ({
    category: row.category,
    count: row.total,
  }));
}

export function buildMostImprovedCategories(profile: LearningProfile): readonly RecommendationImprovedCategoryRow[] {
  return Object.entries(profile.categoryWeights)
    .map(([category, weight]) => ({
      category,
      weight,
      liftPercent: Math.round((weight - 1) * 100),
    }))
    .filter((row) => row.liftPercent > 0)
    .sort((left, right) => right.liftPercent - left.liftPercent)
    .slice(0, 5);
}

export function buildLearningTimeline(profile: LearningProfile): readonly RecommendationLearningTimelineEvent[] {
  const events: RecommendationLearningTimelineEvent[] = [
    {
      id: "generated",
      label: `Learning summary refreshed (${countRecordsAnalyzed(profile).toLocaleString()} recommendations analyzed)`,
      occurredUtc: profile.generatedUtc,
    },
  ];

  for (const [index, note] of profile.notes.entries()) {
    events.push({
      id: `note-${index}`,
      label: note,
      occurredUtc: profile.generatedUtc,
    });
  }

  return events;
}

export function profileHistoryCapLabel(): string {
  return `Up to ${PROFILE_REBUILD_BATCH_CAP.toLocaleString()} historical outcomes per recalculation`;
}

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function pickHighestRateStat(
  stats: readonly OutcomeStats[],
  selector: (stat: OutcomeStats) => number,
): OutcomeStats | null {
  let best: OutcomeStats | null = null;
  let bestRate = -1;

  for (const stat of stats) {
    if (stat.proposedCount < MIN_OUTCOMES_FOR_SIGNAL) {
      continue;
    }

    const rate = selector(stat);

    if (rate > bestRate) {
      best = stat;
      bestRate = rate;
    }
  }

  return best;
}

/** Buyer-facing highlights derived from outcome stats already returned by the API. */
export function buildTopLearnedSignals(profile: LearningProfile): readonly RecommendationLearnedSignal[] {
  const signals: RecommendationLearnedSignal[] = [];
  const usedKeys = new Set<string>();

  const acceptanceLeader = pickHighestRateStat(profile.categoryStats, (stat) => stat.acceptanceRate);

  if (acceptanceLeader !== null) {
    usedKeys.add(acceptanceLeader.key.toLowerCase());
    signals.push({
      label: `${acceptanceLeader.key} recommendations accepted ${formatPercent(acceptanceLeader.acceptanceRate)} of the time`,
    });
  }

  const deferredLeader = pickHighestRateStat(profile.categoryStats, (stat) => stat.deferredRate);

  if (deferredLeader !== null && !usedKeys.has(deferredLeader.key.toLowerCase())) {
    usedKeys.add(deferredLeader.key.toLowerCase());
    signals.push({
      label: `${deferredLeader.key} recommendations deferred most often (${formatPercent(deferredLeader.deferredRate)})`,
    });
  }

  const implementationLeader = pickHighestRateStat(
    [...profile.categoryStats, ...profile.signalTypeStats],
    (stat) => stat.implementationRate,
  );

  if (implementationLeader !== null && !usedKeys.has(implementationLeader.key.toLowerCase())) {
    signals.push({
      label: `${implementationLeader.key} recommendations are more likely to be implemented (${formatPercent(implementationLeader.implementationRate)})`,
    });
  }

  if (signals.length === 0 && profile.notes.length > 0) {
    return profile.notes.slice(0, 3).map((note) => ({ label: note }));
  }

  return signals;
}

export function formatProfileGeneratedUtc(generatedUtc: string): string {
  return new Date(generatedUtc).toLocaleString();
}
