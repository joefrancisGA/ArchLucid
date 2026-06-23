import type { LearningProfile, OutcomeStats } from "@/types/recommendation-learning";

const MIN_OUTCOMES_FOR_SIGNAL = 3;

export type RecommendationLearnedSignal = {
  readonly label: string;
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
