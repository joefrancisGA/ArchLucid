import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_LIST_PATH,
  architectureNestedReviewPath,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import { resolveWorkingAltRHref, isForbiddenWorkingAltRTarget } from "@/lib/resolve-working-alt-r-href";
import {
  extractArchitectureIdentityIdFromPathname,
  extractReviewIdFromPathname,
  mergeDeskContinuity,
} from "@/lib/desk-continuity-preference";
import { defaultDeskContinuityDto } from "@/lib/api/user-preferences-types";
import { resolveReviewScorecardFinalizedHref } from "@/lib/pilot-scorecard-present";
import { resolveSystemNotJobWorkingPrimaryListTitle } from "@/lib/system-not-job-run-id-not-in-working-primary-chrome";
import {
  resolveSystemNotJobWorkingReviewDetailDefaultTab,
  WORKING_REVIEW_DETAIL_BANNED_DEFAULT_TABS,
} from "@/lib/system-not-job-activity-tab-is-meta-not-home";
import {
  SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE,
  resolveSystemNotJobFindingsSurface,
} from "@/lib/system-not-job-findings-are-verbs-on-the-system";
import { resolveWorkingDeskToolHref } from "@/lib/resolve-working-desk-tool-href";
import { resolveDaytimeWaitWorkingInProgressBridgeCopy } from "@/lib/daytime-wait-never-stay-on-page-working";
import { SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW } from "@/lib/system-not-job-help-system-not-job-guide-content";
import {
  COMMAND_PALETTE_HANDLER_ACTIONS,
  isReviewDetailWorkPath,
} from "@/lib/command-palette-handler-actions";
import { isCommandPaletteFinalizeReviewAvailable } from "@/lib/command-palette-work-action-dom";
import type { RunSummary } from "@/types/authority";

/** ADR 0098 ratchets for SG-050–070 batch 3 leftovers. */
describe("system-gravity wave 32 batch 3 ratchets (ADR 0098)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-spawn-abc";

  it("SG-050: spawn on nested review keeps lastOpenArchitectureId as architecture, not run id", () => {
    const nestedSpawnPath = architectureNestedReviewPath(architectureId, runId);

    expect(extractArchitectureIdentityIdFromPathname(nestedSpawnPath, "")).toBe(architectureId);
    expect(extractReviewIdFromPathname(nestedSpawnPath)).toBe(runId);
    expect(extractArchitectureIdentityIdFromPathname(nestedSpawnPath, "")).not.toBe(runId);

    const merged = mergeDeskContinuity(defaultDeskContinuityDto(), {
      lastOpenArchitectureId: extractArchitectureIdentityIdFromPathname(nestedSpawnPath, ""),
      lastOpenReviewId: extractReviewIdFromPathname(nestedSpawnPath),
    });

    expect(merged.lastOpenArchitectureId).toBe(architectureId);
    expect(merged.lastOpenReviewId).toBe(runId);
    expect(merged.lastOpenArchitectureId).not.toBe(runId);
  });

  it("SG-051: Working Alt+R opens desk or portfolio, never reviews inbox", () => {
    expect(resolveWorkingAltRHref({ lastOpenArchitectureId: architectureId }).href).toBe(
      `/architecture/architectures/${architectureId}`,
    );
    expect(resolveWorkingAltRHref({ lastOpenArchitectureId: null }).href).toBe(ARCHITECTURES_LIST_PATH);
    expect(resolveWorkingAltRHref({ lastOpenArchitectureId: architectureId }).href).not.toBe(REVIEWS_LIST_PATH);
    expect(isForbiddenWorkingAltRTarget(REVIEWS_LIST_PATH)).toBe(true);
  });

  it("SG-053: palette finalize/save applies on nested review detail, not bare home", () => {
    const nestedReviewPath = architectureNestedReviewPath(architectureId, runId);
    const finalizeAction = COMMAND_PALETTE_HANDLER_ACTIONS.find((action) => action.id === "action-finalize-review");

    expect(isReviewDetailWorkPath(nestedReviewPath)).toBe(true);
    expect(isReviewDetailWorkPath("/")).toBe(false);

    document.body.innerHTML = '<button data-testid="commit-run-finalize" type="button">Finalize review</button>';

    expect(isCommandPaletteFinalizeReviewAvailable()).toBe(true);
    expect(finalizeAction?.isAvailable(nestedReviewPath)).toBe(true);
    expect(finalizeAction?.isAvailable("/")).toBe(false);
  });

  it("SG-054: shortcut overlay source lists architecture desk shortcuts before common navigation", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/KeyboardShortcutsHelpContent.tsx"),
      "utf8",
    );
    const shortcutsDoc = readFileSync(join(process.cwd(), "docs/KEYBOARD_SHORTCUTS.md"), "utf8");

    expect(source.indexOf('caption="Architecture desk (Working)"')).toBeLessThan(
      source.indexOf('caption="Common"'),
    );
    expect(shortcutsDoc).toMatch(/desk work shortcuts before navigation when Working mode is active/i);
  });

  it("SG-059: architecture-desk help teaches named architecture as Monday object", () => {
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW).toMatch(/named architecture/i);
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW).not.toMatch(/two start/i);
  });

  it("SG-062: scorecard finalized href lands on architecture desk when id is known", () => {
    expect(
      resolveReviewScorecardFinalizedHref({
        workingMode: true,
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`/architecture/architectures/${architectureId}`);
    expect(
      resolveReviewScorecardFinalizedHref({
        workingMode: true,
        lastOpenArchitectureId: null,
      }),
    ).toBe(ARCHITECTURES_LIST_PATH);
  });

  it("SG-066: Working primary chrome omits run-id suffix from list titles", () => {
    const siblings: RunSummary[] = [
      {
        runId: "851472cf-aaaa-bbbb-cccc-ddd083248324",
        projectId: "default",
      },
      {
        runId: "851472cf-1111-2222-3333-444083248325",
        projectId: "default",
      },
    ];

    expect(resolveSystemNotJobWorkingPrimaryListTitle(siblings[0]!, siblings)).toBe("Untitled review");
    expect(resolveSystemNotJobWorkingPrimaryListTitle(siblings[0]!, siblings)).not.toContain("248324");
  });

  it("SG-067: Working default review tab is never activity", () => {
    for (const bannedTab of WORKING_REVIEW_DETAIL_BANNED_DEFAULT_TABS) {
      expect(bannedTab).toBe("activity");
    }

    expect(resolveSystemNotJobWorkingReviewDetailDefaultTab("analysis-in-progress")).not.toBe("activity");
    expect(resolveSystemNotJobWorkingReviewDetailDefaultTab("pre-commit-complete")).toBe("findings");
  });

  it("SG-068: nested findings presentation uses desk verb copy on the system", () => {
    expect(SYSTEM_NOT_JOB_WORKING_NESTED_FINDINGS_PAGE_SUBTITLE).toMatch(/architecture/i);
    expect(
      resolveSystemNotJobFindingsSurface(
        `/architecture/architectures/${architectureId}/findings`,
      ),
    ).toBe("nested-desk");
  });

  it("SG-069: desk tool hrefs bind to open architecture, not bare peer insights", () => {
    expect(
      resolveWorkingDeskToolHref({
        tool: "ask",
        lastOpenArchitectureId: architectureId,
      }),
    ).toBe(`/architecture/architectures/${architectureId}/ask`);

    expect(
      resolveWorkingDeskToolHref({
        tool: "findings",
        lastOpenArchitectureId: architectureId,
      }),
    ).toContain(`/architecture/architectures/${architectureId}/findings`);
  });

  it("SG-070: Working in-progress bridge never tells users to stay on review-detail as home", () => {
    const bridgeCopy = resolveDaytimeWaitWorkingInProgressBridgeCopy();

    expect(bridgeCopy).not.toMatch(/stay on this page/i);
    expect(bridgeCopy).toMatch(/activity/i);
  });

  it("SG-055: architecture desk exposes visible command bar module", () => {
    const deskSource = readFileSync(
      join(process.cwd(), "src/components/architecture/ArchitectureIdentityDesk.tsx"),
      "utf8",
    );
    const commandBarSource = readFileSync(
      join(process.cwd(), "src/components/architecture/ArchitectureIdentityDeskCommandBar.tsx"),
      "utf8",
    );

    expect(deskSource).toContain("ArchitectureIdentityDeskCommandBar");
    expect(commandBarSource).toMatch(/Ask|Compare|Findings|Search/i);
    expect(commandBarSource).toContain("ARCHITECTURE_IDENTITY_DESK_COMMAND_BAR_TEST_ID");
  });
});
