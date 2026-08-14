import { describe, expect, it } from "vitest";

import { provenanceReferenceHref } from "@/lib/provenance-reference-href";
import type { ArchitectureLinkageNode } from "@/types/architecture-provenance";

const nodes: ArchitectureLinkageNode[] = [
  { id: "n-run", type: "ArchitectureRun", referenceId: "claims-intake-modernization", name: "Review" },
  {
    id: "n-manifest",
    type: "GoldenManifest",
    referenceId: "a1c2e3f4-a5b6-7890-abcd-ef1234567890",
    name: "Signed package",
  },
  {
    id: "n-finding",
    type: "Finding",
    referenceId: "finding-guid-1",
    name: "PHI risk",
  },
];

describe("provenanceReferenceHref", () => {
  it("links golden manifest references to sealed record detail", () => {
    expect(
      provenanceReferenceHref(
        "claims-intake-modernization",
        "a1c2e3f4-a5b6-7890-abcd-ef1234567890",
        nodes,
      ),
    ).toBe("/governance/sealed-records/a1c2e3f4-a5b6-7890-abcd-ef1234567890");
  });

  it("links finding node references to inspect route", () => {
    expect(provenanceReferenceHref("claims-intake-modernization", "finding-guid-1", nodes)).toBe(
      "/architecture/reviews/claims-intake-modernization/findings/finding-guid-1/evidence-trace",
    );
  });

  it("returns null for unresolved guid references", () => {
    expect(
      provenanceReferenceHref("claims-intake-modernization", "00000000-0000-0000-0000-000000000099", nodes),
    ).toBeNull();
  });

  it("returns null for empty references", () => {
    expect(provenanceReferenceHref("claims-intake-modernization", null, nodes)).toBeNull();
  });
});
