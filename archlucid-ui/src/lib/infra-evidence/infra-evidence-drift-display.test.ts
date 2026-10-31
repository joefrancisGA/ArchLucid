import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceChangeTypeLabel,
  normalizeInfraEvidenceChangeTypeKey,
} from "@/lib/infra-evidence/infra-evidence-drift-display";

describe("infra-evidence-drift-display", () => {
  it("distinguishes an omitted change type from stored Unknown", () => {
    expect(formatInfraEvidenceChangeTypeLabel(null)).toBe("Change type was not stored.");
    expect(formatInfraEvidenceChangeTypeLabel(19)).toBe("Change type was not stored.");
    expect(formatInfraEvidenceChangeTypeLabel(16)).toBe("Change type recorded as unknown.");
    expect(normalizeInfraEvidenceChangeTypeKey("Unknown")).toBe("Unknown");
  });

  it("labels unknown change-type tokens without inventing a friendly name (P-17)", () => {
    expect(formatInfraEvidenceChangeTypeLabel("CustomMutation")).toBe(
      "Change type CustomMutation has no reviewer label.",
    );
  });
});
