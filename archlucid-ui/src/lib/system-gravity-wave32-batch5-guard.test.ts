import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveWorkingRunReviewLocator } from "@/lib/architecture/resolve-working-run-review-locator";
import {
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS,
  SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/system-gravity-out-of-wave-residuals";
import { workingShareHref } from "@/lib/architecture/working-share-href";
import {
  formatWorkingArchitectureDocumentTitle,
  WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX,
} from "@/lib/architecture/working-architecture-document-title";
import {
  recordRecentView,
  parseStoredRecentViews,
} from "@/lib/operator/operator-recent-views";

const REPO_ROOT = join(process.cwd(), "..");
const UI_ROOT = join(process.cwd(), "src");

/** ADR 0098 ratchets for SG-082–092 batch 5 outbound / recents / search. */
describe("system-gravity wave 32 batch 5 ratchets (ADR 0098)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-nested-1";

  it("SG-082: draft-to-draft Compare remains an explicit out-of-wave skip", () => {
    const row = SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUAL_ROWS.find((item) => item.ownerPrompt === "SG-082");

    expect(row?.status).toBe("not-shipped");
    expect(existsSync(join(REPO_ROOT, SYSTEM_GRAVITY_OUT_OF_WAVE_RESIDUALS_DOC_PATH))).toBe(true);
  });

  it("SG-086: copy-link keeps nested architecture URL when parent is known", () => {
    expect(workingShareHref({ architectureId, reviewId: runId }).href).toContain(
      `/architecture/architectures/${architectureId}/reviews/${runId}`,
    );
  });

  it("SG-087: review completion notification resolves nested href helper", () => {
    const notificationSource = readFileSync(
      join(UI_ROOT, "hooks/use-review-completion-notification.ts"),
      "utf8",
    );

    expect(notificationSource).toContain("resolveReviewCompletionHref");
    expect(notificationSource).toContain("resolveWorkingRunReviewLocator");
    expect(notificationSource).toContain("parseArchitectureNestedRoute");
  });

  it("SG-088: nested review recents collapse to architecture desk href", () => {
    const next = recordRecentView(parseStoredRecentViews(null), {
      href: `/architecture/architectures/${architectureId}/reviews/${runId}`,
      label: "Architecture",
      kind: "architecture",
      architectureId,
      parentArchitectureId: architectureId,
    });

    expect(next.entries[0]).toMatchObject({
      kind: "architecture",
      href: `/architecture/architectures/${architectureId}`,
      architectureId,
    });
  });

  it("SG-089: global search navigation uses nested review locator", () => {
    const searchBarSource = readFileSync(join(UI_ROOT, "components/use-global-search-bar.ts"), "utf8");
    const panelSource = readFileSync(join(UI_ROOT, "components/GlobalSearchGlobalResultsPanel.tsx"), "utf8");

    expect(searchBarSource).toContain("resolveWorkingRunReviewLocator");
    expect(panelSource).toContain("run.architectureId");
    expect(
      resolveWorkingRunReviewLocator({ runId, architectureId }).href,
    ).toBe(`/architecture/architectures/${architectureId}/reviews/${runId}`);
  });

  it("SG-090: Working nested review document titles use architecture display name suffix", () => {
    expect(
      formatWorkingArchitectureDocumentTitle("Payments platform", WORKING_NESTED_REVIEW_DOCUMENT_TITLE_SUFFIX),
    ).toBe("Payments platform · Review");
  });

  it("SG-083/091/092: C# outbound and triage modules reference nested architecture paths", () => {
    expect(
      readFileSync(join(REPO_ROOT, "ArchLucid.Cli/Commands/SecondRunCommand.cs"), "utf8"),
    ).toContain("WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath");

    expect(
      readFileSync(join(REPO_ROOT, "ArchLucid.Application/Analysis/RunExportAuthorityMaterialLoader.cs"), "utf8"),
    ).toContain("WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath");

    expect(
      readFileSync(join(REPO_ROOT, "ArchLucid.Cli/Support/SupportBundleTriageIndexBuilder.cs"), "utf8"),
    ).toContain("workingRouteHint");
  });
});
