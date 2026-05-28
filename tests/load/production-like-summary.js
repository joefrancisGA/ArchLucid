/**
 * Shared production-like k6 summary envelope for trend comparison.
 */
export function buildProductionLikeSummaryEnvelope(data, options) {
  const metrics = (data && data.metrics) || {};
  const httpFailed = metrics.http_req_failed || {};
  const httpDuration = metrics.http_req_duration || {};
  const failedValues = httpFailed.values || {};
  const durationValues = httpDuration.values || {};

  return {
    schema: "archlucid.k6-production-like-summary.v1",
    profile: options.profile,
    mode: options.mode || "simulator",
    baseUrl: options.baseUrl,
    evidencePayloadBytes: options.evidencePayloadBytes || 0,
    llmCallCount: options.llmCallCount || 0,
    estimatedTokenCostUsd: options.estimatedTokenCostUsd || 0,
    p95Ms: durationValues["p(95)"],
    errorRate: failedValues.rate,
    slowestRouteTag: options.slowestRouteTag || "*none*",
    generatedUtc: new Date().toISOString(),
    k6: data,
  };
}

export function slowestK6Tag(data, tagPrefix) {
  const metrics = data && data.metrics;

  if (!metrics) {
    return "*none*";
  }

  let bestTag = "";
  let bestP95 = -1;

  for (const key of Object.keys(metrics)) {
    if (!key.startsWith(tagPrefix)) {
      continue;
    }

    const p95 = metrics[key].values && metrics[key].values["p(95)"];

    if (typeof p95 === "number" && p95 > bestP95) {
      bestP95 = p95;
      bestTag = key;
    }
  }

  if (bestTag.length === 0) {
    return "*none*";
  }

  return `${bestTag} p95=${Math.round(bestP95)}ms`;
}
