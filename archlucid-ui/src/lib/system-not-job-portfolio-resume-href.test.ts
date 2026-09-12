import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveRunIdFromWorkingReviewHref,
  resolveSystemNotJobWorkingResumeReviewHref,
  SYSTEM_NOT_JOB_PORTFOLIO_RESUME_DOC_ANCHOR,
} from "@/lib/system-not-job-portfolio-resume-href";

const repoRoot = join(__dirname, "..", "..", "..");

describe("SN-012 portfolio resume href resolver", () => {
  it("nests Working resume review href when architecture id is known", () => {
    expect(
      resolveSystemNotJobWorkingResumeReviewHref({
        runId: "run-42",
        requestId: "architecture-identity-001",
        workingMode: true,
      }),
    ).toBe("/architecture/architectures/architecture-identity-001/reviews/run-42");
    expect(
      resolveSystemNotJobWorkingResumeReviewHref({
        runId: "run-42",
        requestId: "architecture-identity-001",
        workingMode: true,
      }),
    ).not.toBe("/architecture/reviews/run-42");
  });

  it("keeps Guided peer resume href outside Working mode", () => {
    expect(
      resolveSystemNotJobWorkingResumeReviewHref({
        runId: "run-42",
        requestId: "architecture-identity-001",
        workingMode: false,
      }),
    ).toBe("/architecture/reviews/run-42");
  });

  it("parses run id from nested and peer review hrefs", () => {
    expect(
      resolveRunIdFromWorkingReviewHref(
        "/architecture/architectures/architecture-identity-001/reviews/run-42",
      ),
    ).toBe("run-42");
    expect(resolveRunIdFromWorkingReviewHref("/architecture/reviews/run-42")).toBe("run-42");
    expect(resolveRunIdFromWorkingReviewHref("/architecture/reviews/new")).toBeNull();
  });

  it("runs list continue-last row uses SN-012 resume resolver", () => {
    const row = readFileSync(
      join(
        repoRoot,
        "archlucid-ui",
        "src",
        "app",
        "(operator)",
        "architecture",
        "reviews",
        "RunsListContinueLastViewedRow.tsx",
      ),
      "utf8",
    );

    expect(row).toContain("resolveSystemNotJobWorkingResumeReviewHref");
  });

  it("points at ADR 0079 for portfolio resume contract", () => {
    const adr = readFileSync(join(repoRoot, SYSTEM_NOT_JOB_PORTFOLIO_RESUME_DOC_ANCHOR), "utf8");

    expect(adr).toContain("last-open");
    expect(adr).toContain("Inbox");
  });
});
