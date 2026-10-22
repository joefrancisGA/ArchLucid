import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_ROWS,
} from "@/lib/career-gravity-compare-ask-graph-search-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity Compare Ask Graph Search inventory (CG-008)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/Four verbs/);
    expect(markdown).toContain("`ask`");
    expect(markdown).toMatch(/CompareForm/);

    for (const row of CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files and all four verbs", () => {
    const verbs = new Set(CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_ROWS.map((row) => row.verb));

    expect(verbs).toEqual(new Set(["ask", "compare", "graph", "search"]));

    for (const row of CAREER_GRAVITY_COMPARE_ASK_GRAPH_SEARCH_ROWS) {
      expect(existsSync(join(REPO_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }
  });

  it("keeps Working Ask and Compare presenters without the Career door hook", () => {
    const ask = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/insights/ask-review-questions/_sections/AskPageContent.tsx",
      ),
      "utf8",
    );
    const compare = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx"),
      "utf8",
    );

    expect(ask).not.toMatch(/useEffectiveWorkingCareerRehearsalDoor/);
    expect(compare).not.toMatch(/useEffectiveWorkingCareerRehearsalDoor/);
  });
});
