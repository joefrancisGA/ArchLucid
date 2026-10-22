import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import { resolveWorkingBackHref } from "@/lib/architecture/working-back-href";
import { LIVELIHOOD_DAY_SG_LEFTOVER_CLOSE_ROWS } from "@/lib/livelihood-day-sg-leftover-close";
import {
  MUTATION_REVERSIBILITY_REGISTRY,
  MUTATION_UNDO_WINDOW_SECONDS,
} from "@/lib/mutation-reversibility-registry";
import { resolveWorkingFindingsInstrumentHref } from "@/lib/resolve-working-findings-instrument-href";

const SRC_ROOT = join(process.cwd(), "src");
const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-day leftover close (LY-021–105)", () => {
  it("keeps leftover test files named by LY close rows", () => {
    for (const row of LIVELIHOOD_DAY_SG_LEFTOVER_CLOSE_ROWS) {
      const path =
        row.root === "repo"
          ? join(REPO_ROOT, row.relativeTestPath)
          : join(SRC_ROOT, row.relativeTestPath);

      expect(existsSync(path), row.relativeTestPath).toBe(true);
      expect(readFileSync(path, "utf8")).toContain(row.marker);
    }
  });

  it("LY-021 findings work stays nested on the open architecture when ArchitectureId is known", () => {
    const architectureId = "architecture-identity-001";
    const href = resolveWorkingFindingsInstrumentHref({
      architectureId,
      runId: "run-abc",
      filter: "all",
      isWorkingMode: true,
    });

    expect(href).toBe(`${architectureNestedFindingsPath(architectureId)}?runId=run-abc`);
    expect(href).not.toBe("/governance/findings?runId=run-abc");
  });

  it("LY-024 nested review back is the architecture job, not Reviews hub", () => {
    const href = resolveWorkingBackHref({
      reviewId: "run-001",
      architectureId: "architecture-identity-001",
    });

    expect(href).toBe("/architecture/architectures/architecture-identity-001/reviews/run-001");
    expect(href).not.toMatch(/^\/architecture\/reviews(\/|$)/);
  });

  it("LY-051/052/055 undo toast stays 300s and finalize does not unseal", () => {
    expect(MUTATION_UNDO_WINDOW_SECONDS).toBe(300);

    const leads = Object.values(MUTATION_REVERSIBILITY_REGISTRY)
      .map((entry) => entry.confirmationLead)
      .join(" ");

    expect(leads.toLowerCase()).not.toMatch(/unlimited undo/);
    expect(MUTATION_REVERSIBILITY_REGISTRY.governance_architecture_review_finalize.confirmationLead).toMatch(
      /cannot be unsealed/i,
    );
  });

  it("LY-075 trust-center names sessionStorage as a known residual, not session source of truth", () => {
    const trustCenter = readFileSync(join(REPO_ROOT, "docs/go-to-market/trust-center.md"), "utf8");

    expect(trustCenter).toMatch(/sessionStorage/);
    expect(trustCenter).toMatch(/known residual/i);
    expect(trustCenter).toMatch(/ADR \[0059\]/);
    expect(trustCenter).not.toMatch(/sessionStorage is the session source of truth/i);
  });

  it("LY-101/102 CLI and digest leftovers nest review URLs when ArchitectureId is known", () => {
    const cli = readFileSync(join(REPO_ROOT, "ArchLucid.Cli/Commands/SecondRunCommand.cs"), "utf8");
    const digest = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/WeeklyExecutiveSummary/WeeklyExecutiveSummaryDeliveryScanner.cs"),
      "utf8",
    );
    const sponsorDigest = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/WeeklyExecutiveSummary/WeeklySponsorSummaryDeliveryScanner.cs"),
      "utf8",
    );
    const recurrence = readFileSync(
      join(REPO_ROOT, "ArchLucid.Application/Notifications/Email/RecurrenceCompletionEmailDispatcher.cs"),
      "utf8",
    );

    expect(cli).toContain("WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath");
    expect(digest).toContain("WorkingOperatorReviewLinks.BuildReviewWorkspaceUrlForRunAsync");
    expect(sponsorDigest).toContain("WorkingOperatorReviewLinks.BuildReviewWorkspaceUrlForRunAsync");
    expect(recurrence).toContain("WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath");
    expect(recurrence).not.toMatch(/presence avatar|occupancy heartbeat|finding-comment chat/i);
  });

  it("LY-103 notification deep links restore architecture plus nested job, not inbox Home", () => {
    const architectureId = "architecture-identity-001";
    const runId = "run-nested-1";
    const locator = resolveWorkingRunReviewLocator({ runId, architectureId });

    expect(locator.href).toBe(`/architecture/architectures/${architectureId}/reviews/${runId}`);
    expect(locator.href).not.toBe("/architecture/reviews");
    expect(locator.href).not.toBe("/");
  });
});
