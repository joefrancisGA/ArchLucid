import type {
  RemediationFactoryMetrics,
  RemediationPrioritizedFinding,
  RemediationPrioritizationExplanation,
} from "@/lib/remediation-factory-types";
import { finiteNonNegativeNumberOrDefault, finiteNumberOrDefault } from "@/lib/parse-finite-number";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

async function proxyGet<T>(path: string): Promise<T> {
  const response = await fetch(
    `/api/proxy/${path}`,
    mergeRegistrationScopeForProxy({ credentials: "include" }),
  );

  if (!response.ok)
    throw new Error(`Request failed (${response.status})`);

  return (await response.json()) as T;
}

function mapText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapMetrics(raw: unknown): RemediationFactoryMetrics {
  const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
  const mapCount = (key: string): number => finiteNonNegativeNumberOrDefault(row[key], 0);
  const mapKeyCounts = (value: unknown): ReadonlyArray<{ key: string; count: number }> =>
    Array.isArray(value)
      ? value.flatMap((item) => {
          if (item === null || typeof item !== "object" || Array.isArray(item)) {
            return [];
          }

          const itemRecord = item as Record<string, unknown>;
          const key = mapText(itemRecord.key);

          return key.length > 0
            ? [{ key, count: finiteNonNegativeNumberOrDefault(itemRecord.count, 0) }]
            : [];
        })
      : [];

  return {
    openFindings: mapCount("openFindings"),
    riskWeightedOpen: mapCount("riskWeightedOpen"),
    criticalExposureCount: mapCount("criticalExposureCount"),
    createdThisWeek: mapCount("createdThisWeek"),
    remediatedThisWeek: mapCount("remediatedThisWeek"),
    netBurn: finiteNumberOrDefault(row.netBurn, 0),
    recurrenceCount: mapCount("recurrenceCount"),
    patternCoverageExactMatchPercent: mapCount("patternCoverageExactMatchPercent"),
    automationPercent: mapCount("automationPercent"),
    verificationFailureCount: mapCount("verificationFailureCount"),
    exceptionsActive: mapCount("exceptionsActive"),
    exceptionsExpiringSoon: mapCount("exceptionsExpiringSoon"),
    exceptionsExpired: mapCount("exceptionsExpired"),
    businessBlockedCount: mapCount("businessBlockedCount"),
    averageAgeDays: mapCount("averageAgeDays"),
    topControlIds: mapKeyCounts(row.topControlIds),
    topPatternKeys: mapKeyCounts(row.topPatternKeys),
  };
}

export async function fetchRemediationRankedFindings(): Promise<RemediationPrioritizedFinding[]> {
  const raw = await proxyGet<unknown>("v1/operational-security/remediation-prioritization/ranked");

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const row = item as Record<string, unknown>;

    return [{
      findingId: mapText(row.findingId),
      rankOrder: finiteNonNegativeNumberOrDefault(row.rankOrder, 0),
      totalScore: finiteNonNegativeNumberOrDefault(row.totalScore, 0),
      explanationSummary: mapText(row.explanationSummary),
      breakdownJson: mapText(row.breakdownJson),
      cloudResourceId: mapText(row.cloudResourceId) || null,
      controlId: mapText(row.controlId) || null,
      patternKey: mapText(row.patternKey) || null,
    }];
  });
}

export async function fetchRemediationFactoryMetrics(): Promise<RemediationFactoryMetrics> {
  return mapMetrics(await proxyGet<unknown>("v1/operational-security/remediation-metrics"));
}

export async function fetchRemediationScoreExplanation(
  findingId: string,
): Promise<RemediationPrioritizationExplanation> {
  const raw = await proxyGet<unknown>(
    `v1/operational-security/remediation-prioritization/findings/${encodeURIComponent(findingId.trim())}/score`,
  );
  const row = raw !== null && typeof raw === "object" && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};

  return {
    findingId: mapText(row.findingId),
    totalScore: finiteNonNegativeNumberOrDefault(row.totalScore, 0),
    explanationSummary: mapText(row.explanationSummary),
    breakdownJson: mapText(row.breakdownJson),
    ruleVersion: mapText(row.ruleVersion),
    weights: row.weights !== null && typeof row.weights === "object" && !Array.isArray(row.weights)
      ? Object.fromEntries(
          Object.entries(row.weights as Record<string, unknown>)
            .flatMap(([key, value]) => {
              const mapped = finiteNonNegativeNumberOrDefault(value, -1);

              return mapped >= 0 ? [[key, mapped]] : [];
            }),
        )
      : {},
  };
}

export async function fetchSuggestedWaveSizes(): Promise<number[]> {
  return proxyGet<number[]>("v1/operational-security/remediation-prioritization/suggested-wave-sizes");
}
