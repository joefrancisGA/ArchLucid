import { describe, expect, it } from "vitest";

import { formatInfraEvidenceDiagramsSnapshotPickerLabel } from "@/lib/infra-evidence/format-infra-evidence-diagrams-snapshot-label";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
    subscriptionName: "Contoso Production",
    architectureName: "Payments",
    capturedUtc: "2026-09-10T13:45:35Z",
    captureStatus: 1,
    resourceCount: 889,
    relationshipCount: 12,
    ...overrides,
  };
}

describe("formatInfraEvidenceDiagramsSnapshotPickerLabel", () => {
  it("leads with the Azure subscription display name in Eastern Time using military time", () => {
    expect(formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot())).toBe(
      "Contoso Production · 9/10/2026, 09:45 EDT · 889 resources",
    );
  });

  it("states when neither subscription field was stored", () => {
    const unlabeled = snapshot({ subscriptionName: null, subscriptionId: null });

    expect(formatInfraEvidenceDiagramsSnapshotPickerLabel(unlabeled)).toBe(
      "Subscription was not stored. · 9/10/2026, 09:45 EDT · 889 resources",
    );
  });

  it("follows the operator IANA preference", () => {
    expect(formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot(), "America/Chicago")).toBe(
      "Contoso Production · 9/10/2026, 08:45 CDT · 889 resources",
    );
  });

  it("states when capture time was not stored", () => {
    expect(formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot({ capturedUtc: null }))).toContain(
      "Captured time was not stored",
    );
  });

  it("labels UUID-only subscriptions when no display name was stored (P-11)", () => {
    expect(
      formatInfraEvidenceDiagramsSnapshotPickerLabel(
        snapshot({ subscriptionName: null, subscriptionId: "0966098b-4d6c-4f09-af1b-965bc2a2ad1d" }),
      ),
    ).toBe(
      "Subscription name was not stored. · Subscription id 0966098b-4d6c-4f09-af1b-965bc2a2ad1d. · 9/10/2026, 09:45 EDT · 889 resources",
    );
  });

  it("never surfaces ArchLucid architecture names in the picker (P-10)", () => {
    const withName = formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot({ architectureName: "Payments" }));
    const withoutName = formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot({ architectureName: null }));
    const emptyName = formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot({ architectureName: "  " }));

    expect(withName).toBe("Contoso Production · 9/10/2026, 09:45 EDT · 889 resources");
    expect(withoutName).toBe(withName);
    expect(emptyName).toBe(withName);
    expect(withName).not.toMatch(/architecture/i);
  });

  it("states when resource count was not stored", () => {
    expect(
      formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot({ resourceCount: undefined as never })),
    ).toContain("Resource count was not stored.");
  });
});
