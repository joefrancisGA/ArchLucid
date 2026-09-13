import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isInhabitPaletteSketchArchitecturePath } from "@/lib/inhabit/inhabit-palette-sketch-path";
import { resolveInhabitLatestPracticeSketchSibling } from "@/lib/inhabit/inhabit-latest-practice-sketch-sibling";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit exploration guard (IH-047–052)", () => {
  it("IH-047 mounts sketch and compare on inhabited findings chrome", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );
    const strip = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsExplorationStrip.tsx"),
      "utf8",
    );

    expect(chrome).toContain("InhabitedFindingsExplorationStrip");
    expect(strip).toContain("inhabited-findings-sketch-cta");
    expect(strip).toContain("inhabited-findings-compare-cta");
  });

  it("IH-048 mounts assumption delta entry on inhabited findings", () => {
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(chrome).toContain("InhabitedFindingsAssumptionDeltaEntry");
  });

  it("IH-051 extends palette sketch path to nested findings", () => {
    expect(
      isInhabitPaletteSketchArchitecturePath("/architecture/architectures/a1/findings?runId=r1"),
    ).toBe(true);
  });

  it("IH-050 resolves latest open practice sketch sibling", () => {
    const sibling = resolveInhabitLatestPracticeSketchSibling({
      architectureId: "arch-1",
      currentDraftId: "spawn-locked",
      scopedRunId: "run-1",
      drafts: [
        {
          draftId: "spawn-locked",
          status: "RunSpawned",
          updatedUtc: "2026-09-13T12:00:00Z",
        },
        {
          draftId: "sketch-1",
          status: "Drafting",
          systemName: "Envelope sketch",
          updatedUtc: "2026-09-13T13:00:00Z",
        },
      ],
    });

    expect(sibling?.draftId).toBe("sketch-1");
    expect(sibling?.practiceStamp).toMatch(/practice/i);
  });

  it("IH-052 keeps practice honesty copy on exploration strip and inhabit help", () => {
    const strip = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsExplorationStrip.tsx"),
      "utf8",
    );
    const help = readFileSync(join(SRC_ROOT, "lib/inhabit/inhabit-help-guide-content.ts"), "utf8");

    expect(strip).toContain("INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_TITLE");
    expect(strip).toContain("INHABIT_FINDINGS_SKETCH_CTA_LABEL");
    expect(help).toContain("INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY");
  });
});
