import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  filterSystemNotJobWorkingPortfolioOpenDrafts,
  resolveSystemNotJobWorkingArchitecturesListNavTitle,
  resolveSystemNotJobWorkingPortfolioSaveAndExitHref,
  resolveSystemNotJobWorkingPortfolioShowsDraftSection,
  SYSTEM_NOT_JOB_DRAFT_LIST_REACHABLE_FROM_PORTFOLIO_DOC_ANCHOR,
  SYSTEM_NOT_JOB_DRAFT_LIST_REACHABLE_FROM_PORTFOLIO_OWNER,
  SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SECTION_ID,
} from "@/lib/system-not-job-draft-list-reachable-from-portfolio";

const REPO_ROOT = join(process.cwd(), "..");

function draftEntry(
  draftId: string,
  customerStatus: ArchitectureDraftRegistryEntry["customerStatus"],
): ArchitectureDraftRegistryEntry {
  return {
    draftId,
    displayName: `Draft ${draftId}`,
    ownerLabel: "You",
    lastUpdatedUtc: "2026-01-02T00:00:00Z",
    serverUpdatedUtc: "2026-01-02T00:00:00Z",
    linkedReviewId: null,
    parentArchitectureId: null,
    customerStatus,
    createdByUserId: "user-1",
  };
}

describe("SN-029 drafts reachable from Working portfolio", () => {
  it("anchors save-and-exit on the open-drafts section", () => {
    expect(resolveSystemNotJobWorkingPortfolioSaveAndExitHref()).toBe(
      `/architecture/architectures#${SYSTEM_NOT_JOB_WORKING_PORTFOLIO_OPEN_DRAFTS_SECTION_ID}`,
    );
  });

  it("shows the draft band only in Working mode", () => {
    expect(resolveSystemNotJobWorkingPortfolioShowsDraftSection(true)).toBe(true);
    expect(resolveSystemNotJobWorkingPortfolioShowsDraftSection(false)).toBe(false);
  });

  it("lists non-archived drafts on the portfolio band", () => {
    const entries = [
      draftEntry("draft-open", "draft"),
      draftEntry("draft-archived", "archived"),
      draftEntry("draft-ready", "ready-for-review"),
    ];

    expect(filterSystemNotJobWorkingPortfolioOpenDrafts(entries).map((entry) => entry.draftId)).toEqual([
      "draft-open",
      "draft-ready",
    ]);
  });

  it("Working nav title mentions drafts on the portfolio page", () => {
    expect(resolveSystemNotJobWorkingArchitecturesListNavTitle()).toContain("Drafts are listed on this page");
  });

  it("ratchet module documents SN-029 anchor and surfaces", () => {
    const modulePath = join(
      REPO_ROOT,
      "archlucid-ui",
      "src",
      "lib",
      "system-not-job-draft-list-reachable-from-portfolio.ts",
    );

    expect(existsSync(modulePath)).toBe(true);

    const source = readFileSync(modulePath, "utf8");

    expect(source).toContain(SYSTEM_NOT_JOB_DRAFT_LIST_REACHABLE_FROM_PORTFOLIO_OWNER);
    expect(source).toContain(SYSTEM_NOT_JOB_DRAFT_LIST_REACHABLE_FROM_PORTFOLIO_DOC_ANCHOR);
    expect(source).toContain("ArchitectureWorkingPortfolioDraftsSection");
  });
});
