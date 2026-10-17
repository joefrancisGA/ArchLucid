import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

export const SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON =
  "This path does not name a leading reason." as const;

type PathRankScoreInput = Pick<
  SecurityEvidencePathRankSummary,
  | "technicalExposureScore"
  | "privilegeDepthScore"
  | "blastRadiusScore"
  | "businessConsequenceScore"
>;

type RankedDimension = {
  readonly score: number;
  readonly clause: string;
  readonly tieOrder: number;
};

const DIMENSION_SPECS: readonly {
  readonly readScore: (input: PathRankScoreInput) => number | null;
  readonly clause: string;
  readonly tieOrder: number;
}[] = [
  {
    readScore: (input) => input.technicalExposureScore,
    clause: "Exposed on the network",
    tieOrder: 0,
  },
  {
    readScore: (input) => input.privilegeDepthScore,
    clause: "Deep privilege",
    tieOrder: 1,
  },
  {
    readScore: (input) => input.blastRadiusScore,
    clause: "Wide blast radius",
    tieOrder: 2,
  },
  {
    readScore: (input) => input.businessConsequenceScore,
    clause: "Tied to a crown jewel",
    tieOrder: 3,
  },
];

export function formatSecurityEvidencePathRankReaderSentence(input: PathRankScoreInput): string {
  const ranked = DIMENSION_SPECS
    .map((spec) => {
      const score = spec.readScore(input);

      if (score === null || score <= 0) {
        return null;
      }

      return {
        score,
        clause: spec.clause,
        tieOrder: spec.tieOrder,
      } satisfies RankedDimension;
    })
    .filter((item): item is RankedDimension => item !== null)
    .sort(compareRankedDimensions)
    .slice(0, 2)
    .map((item) => item.clause);

  if (ranked.length === 0) {
    return SECURITY_EVIDENCE_PATH_RANK_NO_LEADING_REASON;
  }

  if (ranked.length === 1) {
    return `${ranked[0]}.`;
  }

  return `${ranked[0]}. ${ranked[1]}.`;
}

function compareRankedDimensions(left: RankedDimension, right: RankedDimension): number {
  if (left.score !== right.score) {
    return right.score - left.score;
  }

  return left.tieOrder - right.tieOrder;
}
