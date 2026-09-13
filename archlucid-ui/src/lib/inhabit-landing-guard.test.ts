import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { resolveWorkingInhabitedFindingsLandingHref } from "@/lib/resolve-working-inhabited-findings-landing-href";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit landing guard (IH-015 / IH-074)", () => {
  const architectureId = "architecture-identity-001";
  const runId = "run-nested-1";
  const nestedFindingsHref = `${architectureNestedFindingsPath(architectureId)}?runId=${runId}`;

  it("continue-last uses inhabited findings landing on Working", () => {
    const source = readFileSync(join(SRC_ROOT, "lib/resolve-continue-last-review-package.ts"), "utf8");

    expect(source).toContain("resolveWorkingInhabitedFindingsLandingHref");
    expect(
      resolveWorkingInhabitedFindingsLandingHref({
        runId,
        architectureId,
        workingMode: true,
      }),
    ).toBe(nestedFindingsHref);
  });

  it("unfinished-work href uses inhabited findings for in-flight nested jobs on Working", () => {
    const source = readFileSync(join(SRC_ROOT, "lib/reviews-hub-unfinished-work-href.ts"), "utf8");

    expect(source).toContain("resolveWorkingInhabitedFindingsLandingHref");
  });

  it("unfinished-work rail wires workingMode into run href resolution", () => {
    const source = readFileSync(join(SRC_ROOT, "lib/unfinished-work-rail.ts"), "utf8");

    expect(source).toContain("resolveWorkingInhabitedFindingsLandingHref");
    expect(source).toContain("workingMode");
  });

  it("spawn handoff open-review uses inhabited findings landing", () => {
    const source = readFileSync(
      join(SRC_ROOT, "components/architecture/ArchitectureDraftHandoffPanel.tsx"),
      "utf8",
    );

    expect(source).toContain("resolveWorkingInhabitedFindingsLandingHref");
  });
});
