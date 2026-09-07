import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { resolveWorkingStartHref } from "@/lib/working-start-route";
import {
  ARCHITECTURE_OBJECT_ACCEPTANCE_CASES,
  ARCHITECTURE_OBJECT_ADR_0077_RELATIVE_PATH,
} from "@/lib/architecture-object-acceptance-inventory";

const UI_SRC_ROOT = join(process.cwd(), "src");
const REPO_ROOT = join(process.cwd(), "..");

describe("architecture-object acceptance guard (AO-50 / ADR 0077)", () => {
  it("records ADR 0077 for Working architecture locator", () => {
    const adrPath = join(REPO_ROOT, ARCHITECTURE_OBJECT_ADR_0077_RELATIVE_PATH);

    expect(existsSync(adrPath), ARCHITECTURE_OBJECT_ADR_0077_RELATIVE_PATH).toBe(true);
  });

  it.each(ARCHITECTURE_OBJECT_ACCEPTANCE_CASES.map((caseRow) => [caseRow.id, caseRow] as const))(
    "%s keeps its canonical Vitest evidence file",
    (id, caseRow) => {
      const absolutePath = join(UI_SRC_ROOT, caseRow.relativeTestPath);

      expect(existsSync(absolutePath), `${id} missing ${caseRow.relativeTestPath}`).toBe(true);

      const contents = readFileSync(absolutePath, "utf8");

      expect(contents).toContain(caseRow.marker);
    },
  );

  it("AO-50: resolveWorkingStartHref never targets the reviews hub or a peer review URL", () => {
    const scenarios = [
      resolveWorkingStartHref({ lastOpenArchitectureId: "arch-identity-1" }),
      resolveWorkingStartHref({ inFlightParentArchitectureId: "arch-in-flight" }),
      resolveWorkingStartHref({}),
    ];

    for (const result of scenarios) {
      expect(result.href).not.toBe(REVIEWS_LIST_PATH);
      expect(result.href).not.toMatch(/^\/architecture\/reviews\/[^/]+$/);
    }
  });

  it("AO-50: reviewDetailPath remains documented as legacy for Working", () => {
    const source = readFileSync(join(UI_SRC_ROOT, "lib/architecture/architecture-routes.ts"), "utf8");

    expect(source).toMatch(/Legacy.*peer review URL/i);
    expect(source).toContain("architectureNestedReviewPath");
    expect(source).toContain("resolveArchitectureReviewHref");
  });

  it("AO-50: Working Home primary CTA module does not import reviewDetailPath", () => {
    const source = readFileSync(
      join(UI_SRC_ROOT, "components/operator-home/OperatorHomeWorkingPrimaryCta.tsx"),
      "utf8",
    );

    expect(source).not.toContain("reviewDetailPath");
  });
});
