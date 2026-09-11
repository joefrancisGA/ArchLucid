import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_NESTED_DESK_DOOR_ROWS,
  CAREER_GRAVITY_NESTED_SEARCH_HELPER,
} from "@/lib/career-gravity-nested-desk-door-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity nested desk door inventory (CG-007)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, CAREER_GRAVITY_NESTED_DESK_DOOR_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(markdown).toMatch(/ADR \*\*0079\*\*/);
    expect(markdown).toMatch(/architectureNestedSearchPath/);
    expect(markdown).toMatch(/No nested page/);
    expect(markdown).toMatch(/\/insights\/ask-review-questions/);

    for (const row of CAREER_GRAVITY_NESTED_DESK_DOOR_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_NESTED_DESK_DOOR_ROWS) {
      expect(existsSync(join(REPO_ROOT, row.relativePath)), row.relativePath).toBe(true);
    }
  });

  it("keeps nested search as a helper without a Working page and nested Ask without a door hook", () => {
    const routes = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/architecture/architecture-routes.ts"),
      "utf8",
    );

    expect(routes).toContain(CAREER_GRAVITY_NESTED_SEARCH_HELPER);
    expect(
      existsSync(
        join(
          REPO_ROOT,
          "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/search/page.tsx",
        ),
      ),
    ).toBe(false);

    const nestedAsk = readFileSync(
      join(
        REPO_ROOT,
        "archlucid-ui/src/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient.tsx",
      ),
      "utf8",
    );

    expect(nestedAsk).toMatch(/AskPageContent/);
    expect(nestedAsk).not.toMatch(/useEffectiveWorkingCareerRehearsalDoor/);
  });
});
