import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  architectureNestedAskPath,
  architectureNestedComparePath,
  architectureNestedGraphPath,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import { resolveWorkingAltRHref } from "@/lib/resolve-working-alt-r-href";
import { resolveWorkingDeskToolHref } from "@/lib/resolve-working-desk-tool-href";
import { resolveWorkingStartHref } from "@/lib/working-start-route";
import {
  SYSTEM_DESK_ACCEPTANCE_CASES,
  SYSTEM_DESK_ADR_0079_RELATIVE_PATH,
} from "@/lib/system-desk-acceptance-inventory";

const UI_SRC_ROOT = join(process.cwd(), "src");
const REPO_ROOT = join(process.cwd(), "..");

describe("system-desk acceptance guard (SY-80 / ADR 0079)", () => {
  it("records ADR 0079 for Working desk as work surface", () => {
    const adrPath = join(REPO_ROOT, SYSTEM_DESK_ADR_0079_RELATIVE_PATH);

    expect(existsSync(adrPath), SYSTEM_DESK_ADR_0079_RELATIVE_PATH).toBe(true);
  });

  it.each(SYSTEM_DESK_ACCEPTANCE_CASES.map((caseRow) => [caseRow.id, caseRow] as const))(
    "%s keeps its canonical Vitest evidence file",
    (id, caseRow) => {
      const absolutePath = join(UI_SRC_ROOT, caseRow.relativeTestPath);

      expect(existsSync(absolutePath), `${id} missing ${caseRow.relativeTestPath}`).toBe(true);

      const contents = readFileSync(absolutePath, "utf8");

      expect(contents).toContain(caseRow.marker);
    },
  );

  it("SY-80 / AO-50: resolveWorkingStartHref never targets the reviews hub or a peer review URL", () => {
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

  it("SY-80 / SY-07: Working Alt+R never opens the reviews inbox", () => {
    expect(resolveWorkingAltRHref({ lastOpenArchitectureId: null }).href).not.toBe(REVIEWS_LIST_PATH);
    expect(
      resolveWorkingAltRHref({ lastOpenArchitectureId: "architecture-identity-001" }).href,
    ).not.toBe(REVIEWS_LIST_PATH);
  });

  it("SY-80: nested Ask, Compare, and Graph helpers are exported from architecture-routes", () => {
    const architectureId = "architecture-identity-001";

    expect(architectureNestedAskPath(architectureId)).toContain(
      `/architecture/architectures/${architectureId}/ask`,
    );
    expect(architectureNestedComparePath(architectureId)).toContain(
      `/architecture/architectures/${architectureId}/compare`,
    );
    expect(architectureNestedGraphPath(architectureId)).toContain(
      `/architecture/architectures/${architectureId}/graph`,
    );
  });

  it("SY-80: Working desk tool shortcuts never return bare peer Insights paths", () => {
    const architectureId = "architecture-identity-001";

    expect(resolveWorkingDeskToolHref({ tool: "ask", lastOpenArchitectureId: architectureId })).toBe(
      architectureNestedAskPath(architectureId),
    );
    expect(
      resolveWorkingDeskToolHref({ tool: "compare", lastOpenArchitectureId: architectureId }),
    ).toBe(architectureNestedComparePath(architectureId));
    expect(resolveWorkingDeskToolHref({ tool: "graph", lastOpenArchitectureId: architectureId })).toBe(
      architectureNestedGraphPath(architectureId),
    );
  });

  it("SY-80 / AO-50: Working Home primary CTA module does not import reviewDetailPath", () => {
    const source = readFileSync(
      join(UI_SRC_ROOT, "components/operator-home/OperatorHomeWorkingPrimaryCta.tsx"),
      "utf8",
    );

    expect(source).not.toContain("reviewDetailPath");
  });

  it("SY-51: Working Home modules do not use REVIEWS_LIST_PATH as a primary CTA", () => {
    const homeModulePaths = [
      "components/operator-home/OperatorHomeWorkingPrimaryCta.tsx",
      "components/operator-home/UnfinishedWorkRail.tsx",
      "lib/compose-operator-home-sections.ts",
      "lib/operator-home-latest-draft-primary-action.ts",
    ];

    for (const relativePath of homeModulePaths) {
      const source = readFileSync(join(UI_SRC_ROOT, relativePath), "utf8");

      expect(source, relativePath).not.toMatch(
        /href:\s*REVIEWS_LIST_PATH|href=\{REVIEWS_LIST_PATH\}/,
      );
    }
  });
});
