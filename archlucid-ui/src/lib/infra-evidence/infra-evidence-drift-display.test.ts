import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceChangeTypeLabel,
  normalizeInfraEvidenceChangeTypeKey,
} from "@/lib/infra-evidence/infra-evidence-drift-display";

describe("infra-evidence-drift-display", () => {
  it("distinguishes an omitted change type from stored Unknown", () => {
    expect(formatInfraEvidenceChangeTypeLabel(null)).toBe("Change type was not stored.");
    expect(formatInfraEvidenceChangeTypeLabel(19)).toBe("Unknown");
    expect(normalizeInfraEvidenceChangeTypeKey("Unknown")).toBe("Unknown");
  });
});
