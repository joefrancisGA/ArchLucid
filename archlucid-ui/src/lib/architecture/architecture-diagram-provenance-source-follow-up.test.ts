import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_OPEN_SUBMITTED_EVIDENCE_LINK_LABEL,
} from "@/lib/architecture/architecture-diagram-provenance";
import {
  isBriefAssertedProvenanceClass,
  resolveArchitectureDiagramProvenanceSourceFollowUp,
} from "@/lib/architecture/architecture-diagram-provenance-source-follow-up";

describe("isBriefAssertedProvenanceClass", () => {
  it("is true only for brief-asserted", () => {
    expect(isBriefAssertedProvenanceClass("brief-asserted")).toBe(true);
    expect(isBriefAssertedProvenanceClass("accepted-inference")).toBe(false);
    expect(isBriefAssertedProvenanceClass("inferred")).toBe(false);
    expect(isBriefAssertedProvenanceClass("user-drawn")).toBe(false);
  });
});

describe("resolveArchitectureDiagramProvenanceSourceFollowUp", () => {
  it("uses submitted-evidence copy when a brief-asserted row has a source href", () => {
    const followUp = resolveArchitectureDiagramProvenanceSourceFollowUp({
      provenanceClass: "brief-asserted",
      sourceHref: "/reviews/r1/evidence",
      runId: "r1",
    });

    expect(followUp).toEqual({
      kind: "source-link",
      href: "/reviews/r1/evidence",
      linkLabel: ARCHITECTURE_DIAGRAM_OPEN_SUBMITTED_EVIDENCE_LINK_LABEL,
      itemIdHonesty: null,
    });
  });

  it("uses generic source-evidence copy when a non-asserted row has a source href", () => {
    const followUp = resolveArchitectureDiagramProvenanceSourceFollowUp({
      provenanceClass: "inferred",
      sourceHref: "/reviews/r1/evidence",
      runId: "r1",
    });

    expect(followUp).toEqual({
      kind: "source-link",
      href: "/reviews/r1/evidence",
      linkLabel: "Open source evidence",
      itemIdHonesty: null,
    });
  });

  it("renders no follow-up for brief-asserted rows without a source href", () => {
    expect(
      resolveArchitectureDiagramProvenanceSourceFollowUp({
        provenanceClass: "brief-asserted",
        sourceHref: null,
        runId: "",
      }),
    ).toEqual({ kind: "none" });
    expect(
      resolveArchitectureDiagramProvenanceSourceFollowUp({
        provenanceClass: "brief-asserted",
        sourceHref: null,
        runId: "run-with-id",
      }),
    ).toEqual({ kind: "none" });
  });

  it("explains that inferred rows have no source evidence link", () => {
    const followUp = resolveArchitectureDiagramProvenanceSourceFollowUp({
      provenanceClass: "inferred",
      sourceHref: null,
      runId: "r1",
    });

    expect(followUp).toEqual({
      kind: "inferred-no-link",
      text: "Inferred items do not include a source evidence link.",
    });
  });

  it("renders no follow-up for accepted-inference and user-drawn rows without a source href", () => {
    expect(
      resolveArchitectureDiagramProvenanceSourceFollowUp({
        provenanceClass: "accepted-inference",
        sourceHref: null,
        runId: "r1",
      }),
    ).toEqual({ kind: "none" });
    expect(
      resolveArchitectureDiagramProvenanceSourceFollowUp({
        provenanceClass: "user-drawn",
        sourceHref: null,
        runId: "r1",
      }),
    ).toEqual({ kind: "none" });
  });
});
