import { describe, expect, it } from "vitest";

import {
  architectureNestedAskPath,
  architectureNestedComparePath,
  architectureNestedFindingsPath,
  architectureNestedGraphPath,
} from "@/lib/architecture/architecture-routes";
import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import {
  comparePageHrefOnBase,
  resolveWorkingDeskToolHref,
} from "@/lib/resolve-working-desk-tool-href";
import { resolveSystemNotJobWorkingAskPortfolioHref } from "@/lib/system-not-job-ask-bound-to-open-package";

describe("resolveWorkingDeskToolHref (SY-08–11 / ADR 0079)", () => {
  const architectureId = "architecture-identity-001";

  it("opens nested Ask on the architecture desk", () => {
    expect(
      resolveWorkingDeskToolHref({
        tool: "ask",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(architectureNestedAskPath(architectureId));
  });

  it("scopes Ask to the open package run on nested Ask", () => {
    expect(
      resolveWorkingDeskToolHref({
        tool: "ask",
        lastOpenArchitectureId: architectureId,
        pathname: `/architecture/architectures/${architectureId}/reviews/run-1`,
        lastOpenReviewId: "run-1",
      }),
    ).toBe(`${architectureNestedAskPath(architectureId)}?runId=run-1`);
  });

  it("opens nested Compare, Graph, and Findings — never bare peer Insights", () => {
    expect(
      resolveWorkingDeskToolHref({ tool: "compare", lastOpenArchitectureId: architectureId }),
    ).toBe(architectureNestedComparePath(architectureId));
    expect(
      resolveWorkingDeskToolHref({ tool: "graph", lastOpenArchitectureId: architectureId }),
    ).toBe(architectureNestedGraphPath(architectureId));
    expect(
      resolveWorkingDeskToolHref({ tool: "findings", lastOpenArchitectureId: architectureId }),
    ).toContain(architectureNestedFindingsPath(architectureId));
    expect(
      resolveWorkingDeskToolHref({ tool: "compare", lastOpenArchitectureId: architectureId }),
    ).not.toBe(COMPARE_TWO_REVIEWS_PATH);
    expect(
      resolveWorkingDeskToolHref({ tool: "ask", lastOpenArchitectureId: architectureId }),
    ).not.toBe(ASK_REVIEW_QUESTIONS_PATH);
    expect(
      resolveWorkingDeskToolHref({ tool: "graph", lastOpenArchitectureId: architectureId }),
    ).not.toBe(EVIDENCE_GRAPH_PATH);
  });

  it("falls back to portfolio with Ask bind honesty when no architecture is in scope", () => {
    expect(resolveWorkingDeskToolHref({ tool: "ask" })).toBe(resolveSystemNotJobWorkingAskPortfolioHref());
    expect(resolveWorkingDeskToolHref({ tool: "compare" })).toBe("/architecture/architectures");
  });

  it("SN-027: pre-fills nested Compare base from desk continuity when no open package run", () => {
    expect(
      resolveWorkingDeskToolHref({
        tool: "compare",
        lastOpenArchitectureId: architectureId,
        compareBaseRunId: "run-career-latest",
      }),
    ).toBe(`${architectureNestedComparePath(architectureId)}?leftRunId=run-career-latest`);
  });

  it("comparePageHrefOnBase keeps query on nested compare path", () => {
    expect(
      comparePageHrefOnBase(
        architectureNestedComparePath(architectureId),
        "run-prior",
        "run-later",
      ),
    ).toBe(
      `${architectureNestedComparePath(architectureId)}?leftRunId=run-prior&rightRunId=run-later`,
    );
  });
});
