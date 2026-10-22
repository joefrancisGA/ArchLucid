import { describe, expect, it } from "vitest";

import {
  PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_COPY,
  buildPackageChangesSinceFinalize,
  classifyPackageChangeKind,
  filterEventsAfterFinalize,
  isFinalizeBoundaryEvent,
  packageChangeKindLabel,
  resolvePackageFinalizeUtc,
  type PackageChangeSourceEvent,
} from "./package-changes-since-finalize";

const sampleEvents: PackageChangeSourceEvent[] = [
  {
    eventId: "e-start",
    eventType: "RunStarted",
    occurredUtc: "2026-08-01T10:00:00Z",
    actorUserName: "system",
  },
  {
    eventId: "e-finalize",
    eventType: "ManifestFinalized",
    occurredUtc: "2026-08-01T12:00:00Z",
    actorUserName: "alex",
  },
  {
    eventId: "e-disposition",
    eventType: "finding.disposition.recorded",
    occurredUtc: "2026-08-01T13:00:00Z",
    actorUserName: "blair",
  },
  {
    eventId: "e-export",
    eventType: "artifact.bundle.created",
    occurredUtc: "2026-08-01T14:00:00Z",
    actorUserName: "casey",
  },
  {
    eventId: "e-approval",
    eventType: "com.archlucid.governance.approval.recorded",
    occurredUtc: "2026-08-01T15:00:00Z",
    actorUserName: "devon",
  },
  {
    eventId: "e-other",
    eventType: "ReviewTrailAccessed",
    occurredUtc: "2026-08-01T16:00:00Z",
    actorUserName: "erin",
  },
];

describe("isFinalizeBoundaryEvent", () => {
  it("recognizes finalize boundary codes", () => {
    expect(isFinalizeBoundaryEvent("ManifestFinalized")).toBe(true);
    expect(isFinalizeBoundaryEvent("finalize.run")).toBe(true);
    expect(isFinalizeBoundaryEvent("com.archlucid.manifest.finalized.v1")).toBe(true);
    expect(isFinalizeBoundaryEvent("ArtifactsGenerated")).toBe(false);
  });
});

describe("classifyPackageChangeKind", () => {
  it("maps disposition, export, approval, and other", () => {
    expect(classifyPackageChangeKind("finding.disposition.recorded")).toBe("disposition");
    expect(classifyPackageChangeKind("artifact.bundle.created")).toBe("export");
    expect(classifyPackageChangeKind("GovernanceApprovalRequested")).toBe("approval");
    expect(classifyPackageChangeKind("ReviewTrailAccessed")).toBe("other");
  });

  it("prefers approval over disposition when markers overlap", () => {
    expect(classifyPackageChangeKind("governance.approval.decision.recorded")).toBe("approval");
  });
});

describe("filterEventsAfterFinalize / resolvePackageFinalizeUtc", () => {
  it("resolves finalize from boundary event when explicit utc missing", () => {
    expect(resolvePackageFinalizeUtc(sampleEvents, null)).toBe("2026-08-01T12:00:00Z");
  });

  it("filters to events strictly after finalize and drops the boundary", () => {
    const after = filterEventsAfterFinalize(sampleEvents, "2026-08-01T12:00:00Z");

    expect(after.map((row) => row.eventId)).toEqual([
      "e-disposition",
      "e-export",
      "e-approval",
      "e-other",
    ]);
  });

  it("returns empty when finalize utc is unknown", () => {
    expect(filterEventsAfterFinalize(sampleEvents, null)).toEqual([]);
    expect(filterEventsAfterFinalize(sampleEvents, "not-a-date")).toEqual([]);
  });
});

describe("buildPackageChangesSinceFinalize", () => {
  it("builds an oldest-first timeline with kind, title, and when", () => {
    const entries = buildPackageChangesSinceFinalize(sampleEvents);

    expect(entries).toHaveLength(4);
    expect(entries.map((row) => row.kind)).toEqual(["disposition", "export", "approval", "other"]);
    expect(entries[0]?.whenUtc).toBe("2026-08-01T13:00:00Z");
    expect(entries[0]?.title.length).toBeGreaterThan(0);
    expect(entries[2]?.kind).toBe("approval");
    expect(entries[2]?.id).toBe("e-approval");
  });

  it("honors explicit finalizeUtc over earlier boundary events", () => {
    const entries = buildPackageChangesSinceFinalize(sampleEvents, {
      finalizeUtc: "2026-08-01T14:30:00Z",
    });

    expect(entries.map((row) => row.id)).toEqual(["e-approval", "e-other"]);
  });

  it("returns empty for empty input or no post-finalize events", () => {
    expect(buildPackageChangesSinceFinalize([])).toEqual([]);
    expect(
      buildPackageChangesSinceFinalize([
        {
          eventId: "only-finalize",
          eventType: "ManifestFinalized",
          occurredUtc: "2026-08-01T12:00:00Z",
        },
      ]),
    ).toEqual([]);
  });
});

describe("packageChangeKindLabel / empty copy", () => {
  it("labels kinds for UI chips", () => {
    expect(packageChangeKindLabel("disposition")).toBe("Disposition");
    expect(packageChangeKindLabel("export")).toBe("Export");
    expect(packageChangeKindLabel("approval")).toBe("Approval");
    expect(packageChangeKindLabel("other")).toBe("Other");
  });

  it("exposes honest empty copy", () => {
    expect(PACKAGE_CHANGES_SINCE_FINALIZE_EMPTY_COPY).toBe("No recorded changes since finalize yet.");
  });
});
