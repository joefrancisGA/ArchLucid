import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { BOOKMARK_PERMANENT_REDIRECTS } from "@/lib/next/bookmark-permanent-redirects";
import { resolveVisibleCommandPaletteHrefActions } from "@/lib/resolve-visible-command-palette-actions";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

const WORKING_PALETTE_NAV_ALLOWLIST = new Set<string>(["/help", "/help/report-problem"]);

describe("command palette Working nav parity (PC-12 / SD-11)", () => {
  it("filters Working palette href actions to sidebar-visible destinations plus allowlist", () => {
    const visibleNavHrefs = new Set<string>([
      "/architecture/reviews",
      "/architecture/architectures/new",
      "/governance/sealed-records",
      "/insights/evidence-graph",
    ]);

    const workingActions = resolveVisibleCommandPaletteHrefActions({
      workingMode: true,
      visibleNavHrefs,
    });

    for (const action of workingActions) {
      const allowed =
        visibleNavHrefs.has(action.href) || WORKING_PALETTE_NAV_ALLOWLIST.has(action.href);

      expect(allowed).toBe(true);
    }

    expect(workingActions.some((action) => action.href === "/architecture/reviews")).toBe(true);
    expect(workingActions.some((action) => action.href === "/insights/sponsor-report")).toBe(false);
  });

  it("keeps CommandPalette wired to the same visible href set helper as the sidebar", () => {
    const source = readFileSync(join(process.cwd(), "src/components/CommandPalette.tsx"), "utf8");

    expect(source).toContain("visibleOperatorShellHrefSetFromNavRows");
    expect(source).toContain("filterNavGroupsForWorkingProfessionalMode");
    expect(source).toContain("visibleHrefs");
  });

  it("redirects legacy /signed-records bookmarks to the canonical sealed-records index (PC-12)", () => {
    const signedRecordsRedirect = BOOKMARK_PERMANENT_REDIRECTS.find(
      (redirect) => redirect.source === "/signed-records",
    );

    expect(signedRecordsRedirect?.destination).toBe(SIGNED_RECORDS_LIST_PATH);
  });

  it("does not register palette navigation actions outside COMMAND_PALETTE_ACTIONS inventory", () => {
    const actionHrefs = new Set(COMMAND_PALETTE_ACTIONS.map((action) => action.href));

    expect(actionHrefs.has("/architecture/reviews")).toBe(true);
    expect(actionHrefs.has("/architecture/reviews/new")).toBe(true);
  });
});
