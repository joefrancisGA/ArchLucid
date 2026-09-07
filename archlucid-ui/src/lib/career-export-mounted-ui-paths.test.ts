import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_ARTIFACT_HONESTY_MODULE_IMPORT,
  CAREER_ARTIFACT_HONESTY_REQUIRED_SYMBOLS,
  CAREER_ARTIFACT_HONESTY_UI_SURFACES,
  CAREER_EXPORT_HONESTY_MODULE_IMPORT,
  CAREER_EXPORT_FORMATTER_PATHS,
  CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS,
  CAREER_EXPORT_MOUNTED_UI_PATHS,
} from "@/lib/career-export-mounted-ui-paths";
import { findCareerArtifactDecisionGradeReadyViolations } from "@/lib/career-artifact/career-artifact-decision-grade-ready-guard";
import {
  discoverUnregisteredCareerExportMountedPaths,
  findCareerArtifactHonestyGrandfatherViolations,
  findCareerArtifactHonestySurfaceViolations,
  findCareerExportFormatterViolations,
} from "@/lib/career-artifact/career-artifact-honesty-guard";
import { CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS } from "@/lib/career-artifact/career-artifact-honesty-grandfather-inventory";

const SRC_ROOT = join(process.cwd(), "src");
const UI_ROOT = process.cwd();
const GRANDFATHER_INVENTORY_SOURCE = readFileSync(
  join(SRC_ROOT, "lib/career-artifact/career-artifact-honesty-grandfather-inventory.ts"),
  "utf8",
);

function fileUsesCareerExportCoverageHonesty(contents: string): boolean {
  if (!contents.includes(CAREER_EXPORT_HONESTY_MODULE_IMPORT)) {
    return false;
  }

  return CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS.some((symbol) => contents.includes(symbol));
}

function fileUsesCareerArtifactHonesty(contents: string): boolean {
  if (!contents.includes(CAREER_ARTIFACT_HONESTY_MODULE_IMPORT)
    && !contents.includes(CAREER_EXPORT_HONESTY_MODULE_IMPORT)) {
    return false;
  }

  return CAREER_ARTIFACT_HONESTY_REQUIRED_SYMBOLS.some((symbol) => contents.includes(symbol));
}

describe("career-export-mounted-ui-paths (FC-04 / PC-13)", () => {
  it("registers formatter and honesty UI surfaces in the mounted inventory", () => {
    expect(CAREER_EXPORT_MOUNTED_UI_PATHS).toEqual([
      ...CAREER_EXPORT_FORMATTER_PATHS,
      ...CAREER_ARTIFACT_HONESTY_UI_SURFACES,
    ]);
  });

  it("every mounted export formatter imports shared career export coverage honesty helpers", () => {
    for (const relativePath of CAREER_EXPORT_FORMATTER_PATHS) {
      const absolutePath = join(SRC_ROOT, relativePath);
      const contents = readFileSync(absolutePath, "utf8");

      expect(fileUsesCareerExportCoverageHonesty(contents), relativePath).toBe(true);
    }
  });

  it("every mounted honesty UI surface imports evaluateCareerArtifactHonesty (FC-02)", () => {
    for (const relativePath of CAREER_ARTIFACT_HONESTY_UI_SURFACES) {
      const absolutePath = join(SRC_ROOT, relativePath);
      const contents = readFileSync(absolutePath, "utf8");

      expect(fileUsesCareerArtifactHonesty(contents), relativePath).toBe(true);
    }
  });

  it("discovers no unregistered career export mounted paths (FC-04)", () => {
    expect(discoverUnregisteredCareerExportMountedPaths(UI_ROOT)).toEqual([]);
  });
});

describe("career-artifact honesty guards (FC-05–FC-07)", () => {
  it("blocks decision-grade Ready tags without honesty mitigation (FC-05)", () => {
    expect(findCareerArtifactDecisionGradeReadyViolations(UI_ROOT)).toEqual([]);
  });

  it("requires export formatters to call evaluateCareerArtifactHonesty unless grandfathered (FC-06)", () => {
    expect(findCareerExportFormatterViolations(UI_ROOT)).toEqual([]);
  });

  it("requires mounted honesty surfaces to wire evaluateCareerArtifactHonesty (FC-02)", () => {
    expect(findCareerArtifactHonestySurfaceViolations(UI_ROOT)).toEqual([]);
  });

  it("ratchets the grandfather inventory with FC-0078-WAIVER comments (FC-07)", () => {
    expect(findCareerArtifactHonestyGrandfatherViolations(UI_ROOT, GRANDFATHER_INVENTORY_SOURCE)).toEqual([]);
    expect(CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS).toEqual([]);
  });
});
