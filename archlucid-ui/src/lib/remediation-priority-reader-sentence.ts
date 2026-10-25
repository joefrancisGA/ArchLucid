/**
 * Reader sentence for a remediation priority row.
 * The stored explanation stays `Rule=IE15-priority-v1; ...`. This reads breakdownJson only.
 */

export const REMEDIATION_PRIORITY_NO_LEADING_FACTOR = "This row does not name a leading factor." as const;

export const REMEDIATION_PRIORITY_BREAKDOWN_NOT_STORED = "Priority breakdown was not stored." as const;

export const REMEDIATION_PRIORITY_EXCEPTION_CLAUSE = "An exception is already in force." as const;

const FACTOR_CLAUSE = {
  Severity: "High severity",
  Exploitability: "Practical to exploit",
  KnownExploitation: "Known to be exploited",
  InternetExposure: "Reachable from the internet",
  IdentityControlPlaneImpact: "Affects identity or the control plane",
  AssetCriticality: "Critical asset",
  DataSensitivity: "Sensitive data",
  BlastRadius: "Wide blast radius",
  RemediationComplexity: "Hard to automate",
  RemediationRiskRecorded: "No rollback recorded",
  RemediationRiskNotStored: "Rollback plan was not stored",
} as const;

/**
 * Ordinals match ArchLucid.Core RemediationRiskFactor.
 * System.Text.Json stores that enum as a number inside breakdownJson.
 */
const FACTOR_NAMES_BY_ORDINAL = [
  "Severity",
  "Exploitability",
  "KnownExploitation",
  "InternetExposure",
  "IdentityControlPlaneImpact",
  "AssetCriticality",
  "DataSensitivity",
  "BlastRadius",
  "CompensatingControls",
  "RemediationComplexity",
  "RemediationRisk",
] as const;

type RemediationPriorityFactorName = (typeof FACTOR_NAMES_BY_ORDINAL)[number];

type ParsedContribution = {
  readonly factor: RemediationPriorityFactorName;
  readonly normalizedValue: number;
  readonly weightedContribution: number;
  readonly source: string;
  readonly order: number;
};

type LeadingClause = {
  readonly clause: string;
  readonly weightedContribution: number;
  readonly order: number;
};

export function formatRemediationPriorityReaderSentence(breakdownJson: string): string {
  if (breakdownJson.trim().length === 0) {
    return REMEDIATION_PRIORITY_BREAKDOWN_NOT_STORED;
  }

  const contributions = parseRemediationPriorityContributions(breakdownJson);

  if (contributions === null) {
    return REMEDIATION_PRIORITY_BREAKDOWN_NOT_STORED;
  }

  const leading = contributions
    .filter(isLeadingContribution)
    .map(toLeadingClause)
    .filter((item): item is LeadingClause => item !== null)
    .sort(compareLeadingClauses)
    .slice(0, 2)
    .map((item) => item.clause);

  const sentence = joinLeadingClauses(leading);
  const exceptionInForce = contributions.some(isActiveException);

  if (!exceptionInForce) {
    return sentence;
  }

  return `${sentence} ${REMEDIATION_PRIORITY_EXCEPTION_CLAUSE}`;
}

function parseRemediationPriorityContributions(breakdownJson: string): ParsedContribution[] | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(breakdownJson);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  const contributions: ParsedContribution[] = [];

  for (let index = 0; index < parsed.length; index += 1) {
    const contribution = readContribution(parsed[index], index);

    if (contribution !== null) {
      contributions.push(contribution);
    }
  }

  return contributions;
}

function readContribution(value: unknown, order: number): ParsedContribution | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const factor = readFactorName(readField(record, "factor", "Factor"));
  const normalizedValue = readFiniteNumber(readField(record, "normalizedValue", "NormalizedValue"));
  const weightedContribution = readFiniteNumber(readField(record, "weightedContribution", "WeightedContribution"));

  if (factor === null || normalizedValue === null || weightedContribution === null) {
    return null;
  }

  const sourceValue = readField(record, "source", "Source");
  const source = typeof sourceValue === "string" ? sourceValue : "";

  return {
    factor,
    normalizedValue,
    weightedContribution,
    source,
    order,
  };
}

function readField(record: Record<string, unknown>, camel: string, pascal: string): unknown {
  if (Object.prototype.hasOwnProperty.call(record, camel)) {
    return record[camel];
  }

  return record[pascal];
}

function readFactorName(value: unknown): RemediationPriorityFactorName | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return FACTOR_NAMES_BY_ORDINAL[value] ?? null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const asOrdinal = Number(trimmed);

  if (Number.isInteger(asOrdinal) && String(asOrdinal) === trimmed) {
    return FACTOR_NAMES_BY_ORDINAL[asOrdinal] ?? null;
  }

  return FACTOR_NAMES_BY_ORDINAL.find((name) => name.toLowerCase() === trimmed.toLowerCase()) ?? null;
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function isLeadingContribution(contribution: ParsedContribution): boolean {
  if (contribution.factor === "CompensatingControls") {
    return false;
  }

  if (contribution.normalizedValue <= 0) {
    return false;
  }

  if (contribution.factor === "RemediationRisk") {
    return true;
  }

  return !isBlockedSource(contribution.source, contribution.factor);
}

function isActiveException(contribution: ParsedContribution): boolean {
  return contribution.factor === "CompensatingControls" && contribution.weightedContribution < 0;
}

function isBlockedSource(source: string, factor: RemediationPriorityFactorName): boolean {
  const normalized = source.trim().toLowerCase();

  if (factor === "RemediationRisk" && normalized === "none") {
    return false;
  }

  return normalized === "unknown" || normalized === "none";
}

function toLeadingClause(contribution: ParsedContribution): LeadingClause | null {
  if (contribution.factor === "CompensatingControls") {
    return null;
  }

  const clause =
    contribution.factor === "RemediationRisk"
      ? remediationRiskClause(contribution.source)
      : FACTOR_CLAUSE[contribution.factor];

  return {
    clause,
    weightedContribution: contribution.weightedContribution,
    order: contribution.order,
  };
}

function compareLeadingClauses(left: LeadingClause, right: LeadingClause): number {
  if (left.weightedContribution !== right.weightedContribution) {
    return right.weightedContribution - left.weightedContribution;
  }

  return left.order - right.order;
}

function remediationRiskClause(source: string): string {
  const normalized = source.trim().toLowerCase();

  if (normalized.length === 0 || normalized === "unknown") {
    return FACTOR_CLAUSE.RemediationRiskNotStored;
  }

  if (normalized === "none") {
    return FACTOR_CLAUSE.RemediationRiskRecorded;
  }

  return FACTOR_CLAUSE.RemediationRiskNotStored;
}

function joinLeadingClauses(clauses: readonly string[]): string {
  if (clauses.length === 0) {
    return REMEDIATION_PRIORITY_NO_LEADING_FACTOR;
  }

  if (clauses.length === 1) {
    return `${clauses[0]}.`;
  }

  return `${clauses[0]}. ${clauses[1]}.`;
}
