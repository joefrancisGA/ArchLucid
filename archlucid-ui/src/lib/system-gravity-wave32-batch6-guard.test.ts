import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  WORKING_INSTRUMENT_AFTER_SPAWN_CONTRACT,
  WORKING_INSTRUMENT_AFTER_SPAWN_FAILURE_IDS,
  WORKING_MONDAY_OBJECT_CONTRACT,
} from "@/lib/architecture/working-monday-object-contract";
import { evaluateSystemGravityInstrumentAfterSpawnDoneTest } from "@/lib/system-gravity-instrument-after-spawn-done-test";
import {
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS,
} from "@/lib/system-gravity-out-of-wave-residuals";
import {
  SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS,
  SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES,
} from "@/lib/system-not-job-no-merge-kernels-ratchet";
import { DESK_IA_NO_COLLAPSE_TABS_TEST_PATH } from "@/lib/desk-ia-no-collapse-tabs-ratchet";
import { resolveInviteReviewerReviewHref } from "@/lib/resolve-invite-reviewer-review-href";
import { classifyWorkingRoutePathname } from "@/lib/routing/working-route-roles";
import { deriveWorkingInstrumentReviewHeaderPresentation } from "@/lib/run-detail-workspace-derive/review-presentation";

const REPO_ROOT = join(process.cwd(), "..");
const UI_SRC_ROOT = join(process.cwd(), "src");

/** ADR 0098 ratchets for SG-093–110 batch 6 close. */
describe("system-gravity wave 32 batch 6 ratchets (ADR 0098)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-nested-batch6";

  it("SG-093: after-spawn chrome keeps architecture name as H1", () => {
    const presentation = deriveWorkingInstrumentReviewHeaderPresentation({
      architectureDisplayName: "Payments platform",
      reviewTitle: "Q3 card capture migration",
      runId,
    });

    expect(presentation.h1Title).toBe("Payments platform");
    expect(presentation.h1Title).not.toBe("Q3 card capture migration");
  });

  it("SG-094: working desk surfaces deny reviewDetailPath imports (SY-77 guard on disk)", () => {
    const guardSource = readFileSync(
      join(UI_SRC_ROOT, "lib/working-review-detail-path-import-guard.test.ts"),
      "utf8",
    );

    expect(guardSource).toContain("WORKING_REVIEW_DETAIL_PATH_DENYLIST");
    expect(guardSource).toContain("ArchitectureIdentityDesk.tsx");
  });

  it("SG-095: RunSummary wire contract exposes optional architectureId", () => {
    const dtoSource = readFileSync(
      join(REPO_ROOT, "ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunSummaryDto.cs"),
      "utf8",
    );
    const responseSource = readFileSync(join(REPO_ROOT, "ArchLucid.Api/Contracts/RunSummaryResponse.cs"), "utf8");
    const schemaSource = readFileSync(join(UI_SRC_ROOT, "lib/api-types/schemas.generated.ts"), "utf8");

    expect(dtoSource).toContain("Guid? ArchitectureId");
    expect(responseSource).toContain("Guid? ArchitectureId");
    expect(schemaSource).toMatch(/RunSummaryResponse:[\s\S]*architectureId\?: null \| string/);
  });

  it("SG-096: E2E landing spec prefers architecture portfolio over reviews hub", () => {
    const e2eSource = readFileSync(join(process.cwd(), "e2e/working-desk-landing.spec.ts"), "utf8");

    expect(e2eSource).toContain("/architecture/architectures");
    expect(e2eSource).not.toMatch(/goto\(['"]\/architecture\/reviews['"]\)/);
  });

  it("SG-097: UX audit registry lists shell-home before reviews inbox", () => {
    const registrySource = readFileSync(join(process.cwd(), "e2e/ux-audit-route-registry.ts"), "utf8");

    expect(registrySource.indexOf('"shell-home"')).toBeLessThan(registrySource.indexOf('"shell-reviews-list"'));
  });

  it("SG-098: nested review routes classify as nestedJob, not locator home", () => {
    expect(
      classifyWorkingRoutePathname(`/architecture/architectures/${architectureId}/reviews/${runId}`),
    ).toBe("nestedJob");
    expect(classifyWorkingRoutePathname(`/architecture/architectures/${architectureId}`)).toBe("locator");
    expect(classifyWorkingRoutePathname("/architecture/reviews")).toBe("inbox");
  });

  it("SG-099: DraftRequests and Runs kernels stay separate (SN-034 ratchet)", () => {
    expect(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.synthesis).toBe("dbo.DraftRequests");
    expect(SYSTEM_NOT_JOB_KERNEL_TABLE_NAMES.review).toBe("dbo.Runs");
  });

  it("SG-100: spawn-lock clone CTA test id remains exported for desk palette discovery", () => {
    const entrySource = readFileSync(
      join(UI_SRC_ROOT, "lib/system-not-job-clone-from-snapshot-entry.ts"),
      "utf8",
    );

    expect(entrySource).toContain("architecture-spawn-lock-clone-snapshot");
  });

  it("SG-101: compare API keeps run-based query params only", () => {
    expect(SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS.left).toBe("leftRunId");
    expect(SYSTEM_NOT_JOB_COMPARE_API_RUN_QUERY_PARAMS.right).toBe("rightRunId");
  });

  it("SG-102: desktop review tabs ratchet path remains wired (DI-009)", () => {
    expect(existsSync(join(REPO_ROOT, DESK_IA_NO_COLLAPSE_TABS_TEST_PATH))).toBe(true);
  });

  it("SG-103: G-REAL-06 host Mode flip stays an explicit out-of-wave skip", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-118");

    expect(row?.item).toMatch(/G-REAL-06/i);
    expect(row?.status).toBe("not-shipped");
  });

  it("SG-104: ADR 0098 guard test file exists and reads ADR 0098 contract", () => {
    const adrGuard = readFileSync(join(UI_SRC_ROOT, "lib/system-gravity-adr-guard.test.ts"), "utf8");
    const adr = readFileSync(join(REPO_ROOT, "docs/architecture/adrs/0098-working-instrument-after-spawn-is-desk.md"), "utf8");

    expect(adrGuard).toContain("SG-104");
    expect(adrGuard).toContain("SYSTEM_GRAVITY_ADR_0098_RELATIVE_PATH");
    expect(adr).toMatch(/instrument after spawn/i);
    expect(adr).toMatch(/job inspector/i);
  });

  it("SG-105: Monday instrument contract extends SY-03 with ADR 0098 failure ids", () => {
    expect(WORKING_INSTRUMENT_AFTER_SPAWN_FAILURE_IDS).toContain("after-spawn-shell-identity-is-architecture");
    expect(WORKING_INSTRUMENT_AFTER_SPAWN_FAILURE_IDS).toContain("review-detail-is-job-not-home");
    expect(WORKING_INSTRUMENT_AFTER_SPAWN_CONTRACT.failureIds).toEqual(WORKING_INSTRUMENT_AFTER_SPAWN_FAILURE_IDS);
    expect(WORKING_MONDAY_OBJECT_CONTRACT.failureIds.length).toBeGreaterThan(0);
  });

  it("SG-106: instrument-after-spawn done-test module passes ADR 0098 predicates", () => {
    const result = evaluateSystemGravityInstrumentAfterSpawnDoneTest({
      architectureDisplayName: "Payments platform",
      reviewTitle: "Q3 card capture migration",
      runId,
      architectureId,
    });

    expect(result.shellIdentityIsArchitecture).toBe(true);
    expect(result.reviewDetailIsNestedJob).toBe(true);
    expect(result.guidedKeepsPeerReviewUrls).toBe(true);
    expect(result.findingsReachableAsVerbs).toBe(true);
  });

  it("SG-107: system-gravity help topic is registered in guided slugs", () => {
    const loaderSource = readFileSync(join(UI_SRC_ROOT, "lib/help/help-topic-content-loader.ts"), "utf8");

    expect(loaderSource).toContain('"system-gravity"');
  });

  it("SG-108: KEYBOARD_SHORTCUTS documents Working desk Alt+R and nested tools", () => {
    const shortcutsDoc = readFileSync(join(process.cwd(), "docs/KEYBOARD_SHORTCUTS.md"), "utf8");

    expect(shortcutsDoc).toMatch(/Alt\+R.*architecture desk/i);
    expect(shortcutsDoc).toMatch(/nested `\/architecture\/architectures\/\{id\}/);
  });

  it("SG-109: second-run CLI resolves architectureId before building operator URL", () => {
    const commandSource = readFileSync(join(REPO_ROOT, "ArchLucid.Cli/Commands/SecondRunCommand.cs"), "utf8");

    expect(commandSource).toContain("GetRunSummaryAsync");
    expect(commandSource).toContain("summary?.ArchitectureId");
    expect(commandSource).toContain("BuildReviewWorkspaceRelativePath(runId, architectureId)");
  });

  it("SG-110: Guided invite flow keeps peer review URLs while Working uses nested locators", () => {
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: true,
        runId,
        architectureId,
      }),
    ).toBe(`/architecture/architectures/${architectureId}/reviews/${runId}`);
    expect(
      resolveInviteReviewerReviewHref({
        workingMode: false,
        runId,
        architectureId,
      }),
    ).toBe(`/architecture/reviews/${runId}`);
  });
});
