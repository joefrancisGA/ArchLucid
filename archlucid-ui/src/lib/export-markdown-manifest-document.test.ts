import { describe, expect, it } from "vitest";

import { formatManifestDocumentShape } from "./export-markdown-manifest-document";
import { pushPolicyAtCommitMarkdownLines } from "./export-markdown-policy-section";

describe("formatManifestDocumentShape component breakdown", () => {
  it("reports missing collections instead of calling them present", () => {
    const markdown = formatManifestDocumentShape({
      topology: {
        services: null,
        datastores: [],
        relationships: [],
      },
      decisions: [],
    });

    expect(markdown).toContain("Services were not stored.");
    expect(markdown).not.toContain("_No services, datastores, relationships, or decisions were present._");
  });

  it("keeps the all-empty stored collection sentence", () => {
    const markdown = formatManifestDocumentShape({
      topology: {
        services: [],
        datastores: [],
        relationships: [],
      },
      decisions: [],
    });

    expect(markdown).toContain("_No services, datastores, relationships, or decisions were present._");
  });

  it("keeps omitted policy controls in markdown and preserves empty names", () => {
    const markdown = formatManifestDocumentShape({
      policy: {
        violations: [
          { controlId: null, controlName: null },
          { controlId: null, controlName: "" },
        ],
      },
    });

    expect(markdown).toContain("- Control name was not stored.");
    expect(markdown).toContain("- ");
  });

  it("distinguishes omitted policy-at-commit snapshots and flags from false", () => {
    const missingSnapshot: string[] = [];
    const missingFlag: string[] = [];
    const falseFlag: string[] = [];

    pushPolicyAtCommitMarkdownLines({}, missingSnapshot);
    pushPolicyAtCommitMarkdownLines({ effectiveGovernanceAtCommit: {} }, missingFlag);
    pushPolicyAtCommitMarkdownLines({ effectiveGovernanceAtCommit: { hasEffectivePolicy: false } }, falseFlag);

    expect(missingSnapshot.join("\n")).toContain("Policy at commit was not stored.");
    expect(missingFlag.join("\n")).toContain("Effective policy flag was not stored.");
    expect(falseFlag.join("\n")).toContain("No effective policy pack assignments");
  });

  it("reports omitted feasibility, transparency, and security impact values", () => {
    const missingVerdict = formatManifestDocumentShape({ feasibilityVerdict: null });
    const missingTrail = formatManifestDocumentShape({
      feasibilityVerdict: {
        kind: "SoftInfeasible",
        summary: "Bounded",
        transparencyTrail: null,
        softEnvelope: null,
        proposedRelaxations: [],
      },
    });
    const missingImpact = formatManifestDocumentShape({
      security: { controls: [{ controlName: "Encryption", status: "On", impact: null }] },
    });

    expect(missingVerdict).toContain("Feasibility verdict was not stored.");
    expect(missingTrail).toContain("Transparency trail was not stored.");
    expect(missingImpact).toContain("Impact was not stored.");
  });
});
