/**
 * Reader sentence for a ranked architect path row.
 * Dimension scores come from the rank API; do not parse explanationSummary.
 */

export const SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON =
  "This path does not name a leading reason." as const;

export type SecurityEvidencePathRankReaderInput = {
  readonly technicalExposureScore: number | null;
  readonly privilegeDepthScore: number | null;
  readonly blastRadiusScore: number | null;
  readonly businessConsequenceScore: number | null;
};

type PathRankDimensionKey =
  | "technicalExposure"
  | "privilegeDepth"
  | "blastRadius"
  | "businessConsequence";

const PATH_RANK_DIMENSION_CLAUSE: Record<PathRankDimensionKey, string> = {
  technicalExposure: "Exposed on the network",
  privilegeDepth: "Deep privilege",
  blastRadius: "Wide blast radius",
  businessConsequence: "Tied to a crown jewel",
};

const PATH_RANK_DIMENSION_TIE_ORDER: readonly PathRankDimensionKey[] = [
  "technicalExposure",
  "privilegeDepth",
  "blastRadius",
  "businessConsequence",
];

type RankedDimension = {
  readonly key: PathRankDimensionKey;
  readonly score: number;
  readonly tieOrder: number;
};

function dimensionScoreIsStored(score: number | null): score is number {
  return score !== null && Number.isFinite(score);
}

export function formatSecurityEvidencePathRankReaderSentence(
  input: SecurityEvidencePathRankReaderInput,
): string {
  if (
    input.technicalExposureScore === null
    && input.privilegeDepthScore === null
    && input.blastRadiusScore === null
    && input.businessConsequenceScore === null
  ) {
    return "Path rank scores were not stored.";
  }

  const leading = PATH_RANK_DIMENSION_TIE_ORDER
    .filter((key) => isEligibleDimension(input, key))
    .map((key, tieOrder) => toRankedDimension(input, key, tieOrder))
    .sort(compareRankedDimensions)
    .slice(0, 2)
    .map((item) => PATH_RANK_DIMENSION_CLAUSE[item.key]);

  return joinPathRankClauses(leading);
}

function isEligibleDimension(input: SecurityEvidencePathRankReaderInput, key: PathRankDimensionKey): boolean {
  const score = readDimensionScore(input, key);

  if (!dimensionScoreIsStored(score)) {
    return false;
  }

  return score > 0;
}

function toRankedDimension(
  input: SecurityEvidencePathRankReaderInput,
  key: PathRankDimensionKey,
  tieOrder: number,
): RankedDimension {
  const score = readDimensionScore(input, key);

  return {
    key,
    score: score ?? Number.NEGATIVE_INFINITY,
    tieOrder,
  };
}

function readDimensionScore(
  input: SecurityEvidencePathRankReaderInput,
  key: PathRankDimensionKey,
): number | null {
  if (key === "technicalExposure") {
    return input.technicalExposureScore;
  }

  if (key === "privilegeDepth") {
    return input.privilegeDepthScore;
  }

  if (key === "blastRadius") {
    return input.blastRadiusScore;
  }

  return input.businessConsequenceScore;
}

function compareRankedDimensions(left: RankedDimension, right: RankedDimension): number {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return left.tieOrder - right.tieOrder;
}

function joinPathRankClauses(clauses: readonly string[]): string {
  if (clauses.length === 0) {
    return SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON;
  }

  if (clauses.length === 1) {
    return `${clauses[0]}.`;
  }

  return `${clauses[0]}. ${clauses[1]}.`;
}
