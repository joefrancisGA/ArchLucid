import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { isWorkingPaletteNavHrefAllowed } from "@/lib/filter-working-palette-nav-hrefs";
import { BOOKMARK_PERMANENT_REDIRECTS } from "@/lib/next/bookmark-permanent-redirects";
import { resolveVisibleCommandPaletteHrefActions } from "@/lib/resolve-visible-command-palette-actions";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

describe("command palette Working nav parity (PC-12 / SD-11 / AO-41)", () => {
  it("filters Working palette href actions to role-allowed destinations", () => {
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
      expect(isWorkingPaletteNavHrefAllowed(action.href)).toBe(true);
    }

    expect(workingActions.some((action) => action.href === "/architecture/reviews")).toBe(true);
    expect(workingActions.some((action) => action.href === "/insights/sponsor-report")).toBe(false);
    expect(workingActions.some((action) => action.href === EVIDENCE_GRAPH_PATH)).toBe(false);
  });

  it("keeps CommandPalette wired to the same visible href set helper as the sidebar", () => {
    const source = readFileSync(join(process.cwd(), "src/components/CommandPalette.tsx"), "utf8");

    expect(source).toContain("visibleOperatorShellHrefSetFromNavRows");
    expect(source).toContain("filterNavGroupsForWorkingProfessionalMode");
    expect(source).toContain("filterWorkingPaletteNavHrefs");
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
