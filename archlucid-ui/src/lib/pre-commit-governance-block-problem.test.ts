import { describe, expect, it } from "vitest";

import { tryParseApiProblemDetails } from "@/lib/api-problem";

import {
  findingSeverityLabelFromOrdinal,
  isPreCommitGovernanceBlockProblem,
  readPreCommitGovernanceBlockFieldsFromRecord,
  resolvePreCommitGovernanceBlockView,
} from "./pre-commit-governance-block-problem";

describe("pre-commit governance block problem", () => {
  it("maps severity ordinals to labels", () => {
    expect(findingSeverityLabelFromOrdinal(3)).toBe("Critical");
    expect(findingSeverityLabelFromOrdinal(99)).toBeNull();
  });

  it("detects governance block from errorCode and extensions", () => {
    const problem = tryParseApiProblemDetails(
      JSON.stringify({
        title: "Conflict",
        detail: "Commit blocked by governance policy.",
        errorCode: "GOVERNANCE_PRE_COMMIT_BLOCKED",
        blockingFindingIds: ["finding-1"],
        policyPackId: "sec-baseline",
        minimumBlockingSeverity: 3,
        blockExplanation: "Add a private endpoint before finalizing.",
      }),
      "application/problem+json",
    );

    expect(isPreCommitGovernanceBlockProblem(problem)).toBe(true);

    expect(resolvePreCommitGovernanceBlockView(problem)).toEqual({
      reason: "Commit blocked by governance policy.",
      blockingFindingIds: ["finding-1"],
      policyPackId: "sec-baseline",
      minimumBlockingSeverityLabel: "Critical",
      blockExplanation: "Add a private endpoint before finalizing.",
    });
  });

  it("reads nested extensions when root fields are absent", () => {
    const fields = readPreCommitGovernanceBlockFieldsFromRecord({
      extensions: {
        blockingFindingIds: ["f-2"],
        policyPackId: "pack-2",
        minimumBlockingSeverity: 2,
      },
    });

    expect(fields).toEqual({
      blockingFindingIds: ["f-2"],
      policyPackId: "pack-2",
      minimumBlockingSeverity: 2,
    });
  });

  it("returns null for unrelated problems", () => {
    const problem = tryParseApiProblemDetails(
      JSON.stringify({ title: "Not found", errorCode: "RUN_NOT_FOUND" }),
      "application/json",
    );

    expect(resolvePreCommitGovernanceBlockView(problem)).toBeNull();
  });
});
