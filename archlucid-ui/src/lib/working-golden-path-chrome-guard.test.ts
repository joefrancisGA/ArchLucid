import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SERVICE_BUS_HEALTH_LABELS } from "@/lib/operator/operator-health-labels";

const GOLDEN_PATH_SURFACE_FILES = [
  "src/components/usability/SetupHealthShellBanner.tsx",
  "src/app/(operator)/architecture/reviews/new/new-run-wizard-steps.ts",
  "src/components/wizard/steps/WizardPostCreateEvidenceUploadPanel.tsx",
  "src/components/llm/LlmBudgetApproachingLimitBanner.tsx",
] as const;

const GOLDEN_PATH_BANNED_SURFACE_PATTERNS = [
  "redis",
  "service bus",
  "packager",
  "extractor zip",
  "azure extractor package",
  "fleet llm cogs",
] as const;

// Back-compat alias: these patterns are currently enforced across the entire file contents.
const GOLDEN_PATH_BANNED_FIRST_LINE_PATTERNS = GOLDEN_PATH_BANNED_SURFACE_PATTERNS;

function readUiSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("working golden-path chrome guard (LD-10)", () => {
  it("keeps architect-facing Service Bus banner copy with probe names in disclosure only", () => {
    expect(SERVICE_BUS_HEALTH_LABELS.bannerTitle).toBe("Review processing is delayed");
    expect(SERVICE_BUS_HEALTH_LABELS.bannerBody.toLowerCase()).not.toContain("service bus");
    expect(SERVICE_BUS_HEALTH_LABELS.technicalProbeDisclosure.toLowerCase()).toContain("azure_service_bus");
  });

  it("keeps banned ops vocabulary off allowlisted golden-path surfaces", () => {
    const violations: string[] = [];

    for (const relativePath of GOLDEN_PATH_SURFACE_FILES) {
      const source = readUiSource(relativePath).toLowerCase();

      for (const pattern of GOLDEN_PATH_BANNED_FIRST_LINE_PATTERNS) {
        if (source.includes(pattern)) {
          violations.push(`${relativePath}: "${pattern}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("labels intake evidence step as optional add-evidence copy", () => {
    const source = readUiSource("src/app/(operator)/architecture/reviews/new/new-run-wizard-steps.ts");

    expect(source).toContain('"Add evidence (optional)"');
    expect(source).not.toContain('"Evidence (optional)"');
  });
});
