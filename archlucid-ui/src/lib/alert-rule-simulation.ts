import type { SimulateAlertRuleRequestBody } from "@/lib/api";
import type { AlertRule } from "@/types/alerts";

/** Draft simulation envelope for operators to edit before calling `simulateAlertRule`. */
export function buildDefaultSimulationRequestForRule(rule: AlertRule): SimulateAlertRuleRequestBody {
  return {
    ruleKind: "Simple",
    simpleRule: { ...rule },
    runId: null,
    comparedToRunId: null,
    recentRunCount: 10,
    useHistoricalWindow: true,
    runProjectSlug: "default",
  };
}

/** When the key exists in parsed JSON it must be `null` or a string (omit the key entirely to leave server defaults). */
function optionalRootRunIdField(parsed: Record<string, unknown>, key: "runId" | "comparedToRunId"): string | null {
  if (!(key in parsed)) {
    return null;
  }

  const value = parsed[key];

  if (value === null || typeof value === "string") {
    return null;
  }

  return `${key} must be null or a string when the field is included.`;
}

/**
 * Validates operator-edited JSON for `simulateAlertRule` when exercising a persisted simple rule.
 * Composite rules belong on the Alerts “Simulation” composite flow.
 */
export function normalizeSimulateAlertRuleBody(parsed: unknown): SimulateAlertRuleRequestBody | string {
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "Simulation payload must be a JSON object.";
  }

  const o = parsed as Record<string, unknown>;

  if (o.ruleKind !== "Simple") {
    return 'Only ruleKind \"Simple\" is supported from this dialog (use Alerts → Simulation → Composite tab for composite rules).';
  }

  const runProbe = optionalRootRunIdField(o, "runId");

  if (runProbe !== null) {
    return runProbe;
  }

  const comparedProbe = optionalRootRunIdField(o, "comparedToRunId");

  if (comparedProbe !== null) {
    return comparedProbe;
  }

  if (typeof o.simpleRule !== "object" || o.simpleRule === null || Array.isArray(o.simpleRule)) {
    return "simpleRule must be an object matching a persisted alert rule.";
  }

  const simple = o.simpleRule as Record<string, unknown>;

  const ids = ["ruleId", "tenantId", "workspaceId", "projectId", "name", "ruleType", "severity"] as const;

  for (const key of ids) {
    const v = simple[key];

    if (typeof v !== "string") {
      return `simpleRule.${key} must be a string.`;
    }
  }

  if (typeof simple.thresholdValue !== "number") {
    return "simpleRule.thresholdValue must be a number.";
  }

  if (typeof simple.isEnabled !== "boolean") {
    return "simpleRule.isEnabled must be a boolean.";
  }

  if (typeof simple.targetChannelType !== "string") {
    return "simpleRule.targetChannelType must be a string.";
  }

  if (typeof simple.metadataJson !== "string") {
    return "simpleRule.metadataJson must be a string (use \"{}\" if empty).";
  }

  if (typeof simple.createdUtc !== "string") {
    return "simpleRule.createdUtc must be a string.";
  }

  let recentRunCount = 10;

  if ("recentRunCount" in o) {
    if (typeof o.recentRunCount !== "number") {
      return "recentRunCount must be a number.";
    }

    recentRunCount = o.recentRunCount;
  }

  let useHistoricalWindow = true;

  if ("useHistoricalWindow" in o) {
    if (typeof o.useHistoricalWindow !== "boolean") {
      return "useHistoricalWindow must be a boolean.";
    }

    useHistoricalWindow = o.useHistoricalWindow;
  }

  let runProjectSlug = "default";

  if ("runProjectSlug" in o) {
    if (typeof o.runProjectSlug !== "string") {
      return "runProjectSlug must be a string.";
    }

    runProjectSlug = o.runProjectSlug;
  }

  const body: SimulateAlertRuleRequestBody = {
    ruleKind: "Simple",
    simpleRule: { ...simple },
    recentRunCount,
    useHistoricalWindow,
    runProjectSlug,
  };

  if ("runId" in o) {
    body.runId = o.runId as string | null;
  }

  if ("comparedToRunId" in o) {
    body.comparedToRunId = o.comparedToRunId as string | null;
  }

  return body;
}
