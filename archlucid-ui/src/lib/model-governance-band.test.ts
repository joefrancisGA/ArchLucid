import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY,
  MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY,
  modelGovernanceLoadBlockedMessage,
} from "@/lib/model-governance-copy";
import { modelGovernanceAgentTypeLabel } from "@/lib/model-governance-labels";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const MODEL_GOVERNANCE_BAND_TEST_FILES = [
  "src/app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsCard.test.tsx",
  "src/lib/model-governance-copy.test.ts",
  "src/app/(operator)/administration/model-governance/page.test.tsx",
  "src/lib/model-governance-labels.test.ts",
] as const;

describe("model governance band regression (TB-1930)", () => {
  it("keeps sibling Vitest guards for TB-1926 through TB-1929 on disk", () => {
    for (const relativePath of MODEL_GOVERNANCE_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("maps load failures to buyer-safe copy without AdminAuthority or HTTP leakage (TB-1926)", () => {
    expect(modelGovernanceLoadBlockedMessage(403)).toBe(MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY);
    expect(MODEL_GOVERNANCE_ADMIN_REQUIRED_COPY).not.toMatch(/AdminAuthority/i);
    expect(modelGovernanceLoadBlockedMessage(500)).toBe(MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY);
    expect(MODEL_GOVERNANCE_LOAD_UNAVAILABLE_COPY).not.toMatch(/HTTP\s*\d+/i);
  });

  it("humanizes agent type labels instead of raw enum strings (TB-1927)", () => {
    expect(modelGovernanceAgentTypeLabel("Topology")).toBe("Architecture structure");
    expect(modelGovernanceAgentTypeLabel("SecurityReviewer")).toBe("Security Reviewer");
  });

  it("keeps page chrome Vitest for duplicate title demotion (TB-1928)", () => {
    expect(
      existsSync(join(UI_ROOT, "src/app/(operator)/administration/model-governance/page.test.tsx")),
    ).toBe(true);
  });
});
