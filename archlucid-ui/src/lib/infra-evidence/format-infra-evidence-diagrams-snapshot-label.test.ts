import { describe, expect, it } from "vitest";

import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { formatInfraEvidenceDiagramsSnapshotPickerLabel } from "@/lib/infra-evidence/format-infra-evidence-diagrams-snapshot-label";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
    subscriptionName: "Contoso Production",
    capturedUtc: "2026-09-10T13:45:35Z",
    captureStatus: 1,
    resourceCount: 889,
    relationshipCount: 12,
    ...overrides,
  };
}

describe("formatInfraEvidenceDiagramsSnapshotPickerLabel", () => {
  it("leads with the Azure subscription display name", () => {
    const captured = formatIsoUtcForDisplay("2026-09-10T13:45:35Z");

    expect(formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot())).toBe(
      `Contoso Production · captured ${captured} · 889 resources`,
    );
  });

  it("omits UUID subscription identity when no name is stored", () => {
    const unlabeled = snapshot({ subscriptionName: null });
    const captured = formatIsoUtcForDisplay("2026-09-10T13:45:35Z");

    expect(formatInfraEvidenceDiagramsSnapshotPickerLabel(unlabeled)).toBe(
      `captured ${captured} · 889 resources`,
    );
  });
});
