import { describe, expect, it } from "vitest";

import {
  provenanceTimelinePrimaryLabel,
  provenanceTimelineTechnicalKind,
} from "@/lib/provenance-timeline-presentation";
import type { ArchitectureTraceTimelineEntry } from "@/types/architecture-provenance";

describe("provenance timeline presentation", () => {
  it("maps architecture timeline kinds to readable labels", () => {
    const row: ArchitectureTraceTimelineEntry = {
      timestampUtc: "2026-01-01T00:00:00.000Z",
      kind: "manifestCommitted",
      label: "manifestCommitted",
    };

    expect(provenanceTimelinePrimaryLabel(row)).toBe("Sealed review record committed");
    expect(provenanceTimelineTechnicalKind(row)).toBe("manifestCommitted");
  });

  it("keeps pipeline event labels when provided", () => {
    const row: ArchitectureTraceTimelineEntry = {
      timestampUtc: "2026-01-01T00:00:00.000Z",
      kind: "com.archlucid.manifest.finalized.v1",
      label: "Review finalized",
    };

    expect(provenanceTimelinePrimaryLabel(row)).toBe("Review finalized");
  });
});
