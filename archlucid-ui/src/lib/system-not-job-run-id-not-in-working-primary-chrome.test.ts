import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { formatRunListTitleWithDisambiguator } from "@/lib/operator/run-home-list-disambiguator";
import {
  resolveSystemNotJobWorkingPrimaryListTitle,
  SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_DOC_ANCHOR,
  SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_OWNER,
  SYSTEM_NOT_JOB_WORKING_PRIMARY_LIST_TITLE_SURFACES,
} from "@/lib/system-not-job-run-id-not-in-working-primary-chrome";
import { toReviewsHubReviewRowDisplay } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-package-display";
import type { RunSummary } from "@/types/authority";

const REPO_ROOT = join(process.cwd(), "..");

function untitledRun(runId: string, createdUtc?: string): RunSummary {
  return {
    runId,
    projectId: "default",
    ...(createdUtc !== undefined ? { createdUtc } : {}),
  };
}

describe("SN-021 run id not in Working primary chrome", () => {
  it("omits run id suffix for duplicate Working list titles without start time", () => {
    const siblings = [untitledRun("851472cf-aaaa-bbbb-cccc-ddd083248324"), untitledRun("851472cf-1111-2222-3333-444083248325")];

    expect(resolveSystemNotJobWorkingPrimaryListTitle(siblings[0], siblings)).toBe("Untitled review");
    expect(resolveSystemNotJobWorkingPrimaryListTitle(siblings[1], siblings)).toBe("Untitled review");
    expect(formatRunListTitleWithDisambiguator(siblings[0], siblings)).toBe("Untitled review · 248324");
  });

  it("still disambiguates duplicate Working titles with relative start time", () => {
    const siblings: RunSummary[] = [
      {
        runId: "run-a",
        projectId: "default",
        description: "Payments platform",
        createdUtc: "2026-01-15T12:00:00.000Z",
      },
      {
        runId: "run-b",
        projectId: "default",
        description: "Payments platform",
        createdUtc: "2026-01-20T12:00:00.000Z",
      },
    ];

    const workingTitle = resolveSystemNotJobWorkingPrimaryListTitle(siblings[0], siblings);

    expect(workingTitle).toContain("Payments platform");
    expect(workingTitle).toContain("Started");
    expect(workingTitle).not.toContain("run-a");
    expect(workingTitle).not.toMatch(/[a-f0-9]{6}$/i);
  });

  it("wires Working inbox rows through the SN-021 resolver", () => {
    const siblings: RunSummary[] = [
      untitledRun("851472cf-aaaa-bbbb-cccc-ddd083248324"),
      untitledRun("851472cf-1111-2222-3333-444083248325"),
    ];

    const row = toReviewsHubReviewRowDisplay(
      untitledRun("851472cf-aaaa-bbbb-cccc-ddd083248324", ""),
      {},
      siblings,
      { isWorkingMode: true },
    );

    expect(row.reviewTitlePrimary).toBe("Untitled review");
    expect(row.reviewTitlePrimary).not.toContain("248324");
  });

  it("keeps Guided inbox disambiguation with run id suffix when start time is missing", () => {
    const siblings = [untitledRun("851472cf-aaaa-bbbb-cccc-ddd083248324"), untitledRun("851472cf-1111-2222-3333-444083248325")];

    const row = toReviewsHubReviewRowDisplay(
      untitledRun("851472cf-aaaa-bbbb-cccc-ddd083248324", ""),
      {},
      siblings,
      { isWorkingMode: false },
    );

    expect(row.reviewTitlePrimary).toBe("Untitled review · 248324");
  });

  it("names ADR 0074 anchor and hub/desk inventory surfaces", () => {
    expect(SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_OWNER).toBe("SN-021");
    expect(SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_DOC_ANCHOR).toContain("0074");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_RUN_ID_NOT_IN_WORKING_PRIMARY_CHROME_DOC_ANCHOR))).toBe(true);
    expect(SYSTEM_NOT_JOB_WORKING_PRIMARY_LIST_TITLE_SURFACES).toContain(
      "archlucid-ui/src/app/(operator)/architecture/reviews/_sections/reviews-hub-package-display.ts",
    );
    expect(SYSTEM_NOT_JOB_WORKING_PRIMARY_LIST_TITLE_SURFACES).toContain(
      "archlucid-ui/src/components/operator-home/OperatorHomeReviewSummaryCard.tsx",
    );
  });

  it("wires Working summary cards through the SN-021 resolver", () => {
    const summaryCard = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/operator-home/OperatorHomeReviewSummaryCard.tsx"),
      "utf8",
    );

    expect(summaryCard).toContain("resolveSystemNotJobWorkingPrimaryListTitle");
    expect(summaryCard).toContain("workingMode");
  });
});
