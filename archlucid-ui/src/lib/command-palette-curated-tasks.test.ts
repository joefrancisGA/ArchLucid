import { describe, expect, it } from "vitest";

import { ARCHITECTURE_INTELLIGENCE_PATH } from "@/lib/architecture/architecture-intelligence-route";
import {
  COMMAND_PALETTE_CURATED_TASKS,
  commandPaletteNavVisibilityHref,
} from "@/lib/command-palette-curated-tasks";
import {
  FIRST_REVIEW_GUIDE_PATH,
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
} from "@/lib/first-review-guide-route";
import { flattenNavLinks } from "@/lib/nav-config";
import { getRouteTitle } from "@/lib/route-titles";
import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

describe("COMMAND_PALETTE_CURATED_TASKS (TB-2241)", () => {
  it("lists architecture intelligence as a contextual-only quick task", () => {
    const task = COMMAND_PALETTE_CURATED_TASKS.find((entry) => entry.href === ARCHITECTURE_INTELLIGENCE_PATH);

    expect(task).toBeDefined();
    expect(task?.label).toBe("Architecture intelligence");
    expect(task?.searchValue).toMatch(/closed-loop reasoning/i);
  });

  it("deep-links onboarding checklist to the walkthrough progress section", () => {
    const task = COMMAND_PALETTE_CURATED_TASKS.find((entry) => entry.label === "Onboarding checklist");

    expect(task?.href).toBe(`${FIRST_REVIEW_GUIDE_PATH}#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`);
  });

  it("strips hash fragments when matching curated tasks to nav visibility", () => {
    expect(
      commandPaletteNavVisibilityHref(
        `${FIRST_REVIEW_GUIDE_PATH}#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`,
      ),
    ).toBe(FIRST_REVIEW_GUIDE_PATH);
  });

  /**
   * The palette shows quick tasks directly above the nav rows, so the same destination appearing
   * under two names reads as two destinations. Anchor rows are exempt because they name a section,
   * matching the exemption in `nav-route-title-parity.test.ts`.
   */
  it("names every page-level quick task exactly as the route-title registry does", () => {
    const mismatches: string[] = [];

    for (const task of COMMAND_PALETTE_CURATED_TASKS) {
      if (task.href.includes("#")) {
        continue;
      }

      const routeTitle = getRouteTitle(task.href);

      if (routeTitle !== task.label) {
        mismatches.push(`${task.href}: palette="${task.label}" routeTitle="${routeTitle}"`);
      }
    }

    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("matches the sidebar label for every quick task that is also a nav destination", () => {
    const navLabelByPath = new Map<string, string>(
      flattenNavLinks()
        .filter((link) => !link.href.includes("#"))
        .map((link) => [commandPaletteNavVisibilityHref(link.href), link.label]),
    );
    const mismatches: string[] = [];

    for (const task of COMMAND_PALETTE_CURATED_TASKS) {
      if (task.href.includes("#")) {
        continue;
      }

      const navLabel = navLabelByPath.get(commandPaletteNavVisibilityHref(task.href));

      if (navLabel !== undefined && navLabel !== task.label) {
        mismatches.push(`${task.href}: palette="${task.label}" nav="${navLabel}"`);
      }
    }

    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("keeps retired palette wording searchable after the rename", () => {
    const byHref = new Map(COMMAND_PALETTE_CURATED_TASKS.map((task) => [task.href, task]));

    expect(byHref.get("/architecture/reviews")?.searchValue).toMatch(/reviews list/i);
    expect(byHref.get("/governance/audit")?.searchValue).toMatch(/audit trail/i);
    expect(byHref.get("/governance/alerts")?.searchValue).toMatch(/inbox/i);
    expect(byHref.get("/insights/search-review-evidence")?.searchValue).toMatch(/semantic search/i);
    expect(byHref.get("/insights/ask-review-questions")?.searchValue).toMatch(/ask archlucid/i);
    expect(byHref.get("/architecture/reviews/new")?.searchValue).toMatch(/new architecture review/i);
  });

  it("labels review intake with the canonical start-review label", () => {
    const task = COMMAND_PALETTE_CURATED_TASKS.find((entry) => entry.href === "/architecture/reviews/new");

    expect(task?.label).toBe(START_REVIEW_LABEL);
  });
});
