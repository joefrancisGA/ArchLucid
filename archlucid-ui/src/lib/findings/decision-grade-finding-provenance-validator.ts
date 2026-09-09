import { FINDING_CLASSIFICATION_CHECKLIST_COVERAGE } from "@/lib/findings/review-detail-findings-classification-band";

type ParsedFinding = {
  readonly findingId: string;
  readonly findingType: string;
  readonly classification: string | null;
  readonly engineType: string | null;
  readonly relatedNodeIds: readonly string[];
  readonly traceCitations: readonly string[];
  readonly traceRulesApplied: readonly string[];
  readonly payload: Record<string, unknown> | null;
};

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    .map((entry) => entry.trim());
}

function readClassification(value: unknown): string | null {
  const raw = readTrimmedString(value);

  if (raw === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE || raw === "DecisionGradeFinding") {
    return raw;
  }

  return null;
}

function parseFinding(raw: unknown): ParsedFinding | null {
  if (raw === null || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const findingId = readTrimmedString(record.findingId);

  if (findingId === null) {
    return null;
  }

  const trace =
    record.trace !== null && typeof record.trace === "object"
      ? (record.trace as Record<string, unknown>)
      : null;
  const payload =
    record.payload !== null && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : null;

  return {
    findingId,
    findingType: readTrimmedString(record.findingType) ?? "",
    classification: readClassification(record.classification),
    engineType: readTrimmedString(record.engineType),
    relatedNodeIds: readStringArray(record.relatedNodeIds),
    traceCitations: trace !== null ? readStringArray(trace.citations) : [],
    traceRulesApplied: trace !== null ? readStringArray(trace.rulesApplied) : [],
    payload,
  };
}

function readFindingsFromSnapshot(findingsSnapshot: unknown): ParsedFinding[] {
  if (findingsSnapshot === null || typeof findingsSnapshot !== "object") {
    return [];
  }

  const findings = (findingsSnapshot as { findings?: unknown }).findings;

  if (!Array.isArray(findings)) {
    return [];
  }

  return findings
    .map((entry) => parseFinding(entry))
    .filter((entry): entry is ParsedFinding => entry !== null);
}

function isAgentArchitectureFinding(findingType: string): boolean {
  return findingType.startsWith("AgentArchitectureFinding");
}

const INVENTORY_DRIVEN_ENGINE_TYPES = new Set([
  "azure-inventory-reconciliation",
  "aws-inventory-reconciliation",
  "gcp-inventory-reconciliation",
  "azure-inventory-security-baseline",
  "aws-cost-recommendation",
  "gcp-cost-recommendation",
]);

function hasInventoryDrivenEngineProvenance(finding: ParsedFinding): boolean {
  const engineType = finding.engineType?.trim().toLowerCase() ?? "";

  if (!INVENTORY_DRIVEN_ENGINE_TYPES.has(engineType)) {
    return false;
  }

  if (finding.traceRulesApplied.length === 0) {
    return false;
  }

  if (finding.relatedNodeIds.length > 0) {
    return true;
  }

  const payload = finding.payload;

  if (payload === null) {
    return false;
  }

  const graphOnly = readStringArray(payload.graphOnlyResourceIds);
  const inventoryOnly = readStringArray(payload.inventoryOnlyResourceIds);

  if (graphOnly.length > 0 || inventoryOnly.length > 0) {
    return true;
  }

  const requirementName = readTrimmedString(payload.requirementName);
  const recommendationId = readTrimmedString(payload.recommendationId);

  return requirementName !== null || recommendationId !== null;
}

function hasTypedEngineProvenance(finding: ParsedFinding): boolean {
  if (hasInventoryDrivenEngineProvenance(finding)) {
    return true;
  }

  const hasNodes = finding.relatedNodeIds.length > 0;
  const hasRules = finding.traceRulesApplied.length > 0;

  if (hasNodes && hasRules) {
    return true;
  }

  return finding.traceCitations.length > 0;
}

function getViolation(finding: ParsedFinding): string | null {
  if (finding.classification === FINDING_CLASSIFICATION_CHECKLIST_COVERAGE) {
    return null;
  }

  if (isAgentArchitectureFinding(finding.findingType)) {
    if (finding.traceCitations.length > 0) {
      return null;
    }

    return `Finding '${finding.findingId}' (${finding.findingType}) lacks agent citation provenance.`;
  }

  if (hasTypedEngineProvenance(finding)) {
    return null;
  }

  return `Finding '${finding.findingId}' (${finding.findingType}) lacks typed-engine provenance.`;
}

/** Mirrors C# DecisionGradeFindingProvenanceValidator for Working career export gates (FC-38). */
export function getDecisionGradeFindingProvenanceViolations(findingsSnapshot: unknown): readonly string[] {
  const violations: string[] = [];

  for (const finding of readFindingsFromSnapshot(findingsSnapshot)) {
    const violation = getViolation(finding);

    if (violation !== null) {
      violations.push(violation);
    }
  }

  return violations;
}
