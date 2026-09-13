import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit findings document guard (IH-016–019 / IH-073)", () => {
  it("wires inhabited findings chrome into queue scope section", () => {
    const scopeSection = readFileSync(
      join(SRC_ROOT, "app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection.tsx"),
      "utf8",
    );

    expect(scopeSection).toContain("InhabitedFindingsDocumentChrome");
    expect(scopeSection).toContain("suppressPipelineChrome");
  });

  it("resolves inhabited page title from architecture display name", () => {
    const presentation = readFileSync(
      join(SRC_ROOT, "app/(operator)/governance/findings/governance-findings-queue-presentation.ts"),
      "utf8",
    );

    expect(presentation).toContain("resolveInhabitedFindingsDocumentPresentation");
  });

  it("maps nested findings contextual help to inhabit-the-architecture", () => {
    const mapSource = readFileSync(join(SRC_ROOT, "lib/usability/page-help-topic-map.ts"), "utf8");

    expect(mapSource).toContain("pathIsWorkingInhabitedFindingsRoute");
    expect(mapSource).toContain("INHABIT_THE_ARCHITECTURE_HELP_SLUG");
  });
});
