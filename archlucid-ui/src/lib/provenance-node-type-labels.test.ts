import { describe, expect, it } from "vitest";

import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  provenanceNodeNameBuyerLabel,
  provenanceNodeTypeBuyerLabel,
} from "@/lib/provenance-node-type-labels";

describe("provenance node type labels", () => {
  it("maps camelCase coordinator types to buyer vocabulary", () => {
    expect(provenanceNodeTypeBuyerLabel("contextSnapshot")).toBe("Reviewed source context");
    expect(provenanceNodeTypeBuyerLabel("graphSnapshot")).toBe("Evidence graph");
    expect(provenanceNodeTypeBuyerLabel("findingsSnapshot")).toBe("Findings recorded");
    expect(provenanceNodeTypeBuyerLabel("goldenManifestPointer")).toBe(SIGNED_MANIFEST_LABEL);
    expect(provenanceNodeTypeBuyerLabel("manifestVersion")).toBe(SIGNED_MANIFEST_LABEL);
    expect(provenanceNodeTypeBuyerLabel("artifactBundle")).toBe("Deliverables packaged");
    expect(provenanceNodeTypeBuyerLabel("run")).toBe("Review started");
  });

  it("suppresses internal run names that leak hex ids", () => {
    expect(
      provenanceNodeNameBuyerLabel("run", "Run 4d9da34ab1054765adac258037b9db08"),
    ).toBe("Review started");
    expect(provenanceNodeNameBuyerLabel("ArchitectureRun", "ArchLucid")).toBe("Review kickoff");
  });

  it("humanizes unknown types instead of echoing raw strings", () => {
    expect(provenanceNodeTypeBuyerLabel("customCoordinatorKind")).toBe("Custom coordinator kind");
  });
});
