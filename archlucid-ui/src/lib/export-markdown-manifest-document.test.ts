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

  it("labels stored-empty decision, relationship, and compliance fields", () => {
    const markdown = formatManifestDocumentShape({
      topology: {
        services: [],
        datastores: [],
        relationships: [{ description: "", sourceId: "", targetId: "", relationshipId: "rel-1" }],
      },
      decisions: [
        {
          decisionId: "",
          title: "",
          category: "",
          selectedOption: "",
          rationale: "Still recorded.",
        },
      ],
      compliance: {
        controls: [{ controlName: "", status: "Pass" }],
        gaps: [],
      },
    });

    expect(markdown).toContain("#### Decision title was stored empty.");
    expect(markdown).toContain("- Decision id was stored empty.");
    expect(markdown).toContain("- Decision category was stored empty.");
    expect(markdown).toContain("- Selected option was stored empty.");
    expect(markdown).toContain("- Relationship description was stored empty.");
    expect(markdown).toContain("- Control name was stored empty.");
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

  it("reports omitted requirements lists separately from empty arrays", () => {
    const missingRoot = formatManifestDocumentShape({
      metadata: { changeDescription: "Scope change" },
      requirements: null,
    });
    const missingCovered = formatManifestDocumentShape({
      requirements: { covered: null, uncovered: [] },
    });
    const emptyCovered = formatManifestDocumentShape({
      requirements: { covered: [], uncovered: [] },
    });

    expect(missingRoot).toContain("Requirements were not stored.");
    expect(missingCovered).toContain("Covered requirements were not stored.");
    expect(emptyCovered).toContain("Covered requirements were stored as an empty list.");
  });

  it("labels omitted mandatory constraints and security controls", () => {
    const markdown = formatManifestDocumentShape({
      constraints: { mandatoryConstraints: null, preferences: [] },
      security: { controls: null, gaps: [] },
    });

    expect(markdown).toContain("Mandatory constraints were not stored.");
    expect(markdown).toContain("Security controls were not stored.");
  });

  it("labels stored-empty service names and security controls (P-09)", () => {
    const markdown = formatManifestDocumentShape({
      topology: {
        services: [{ serviceName: "", serviceId: "svc-1" }],
        datastores: [],
        relationships: [],
        resources: null,
      },
      security: { controls: [], gaps: [] },
      requirements: { covered: [], uncovered: [] },
      decisions: [],
    });

    expect(markdown).toContain("Service name was stored empty.");
    expect(markdown).not.toContain("**null**");
    expect(markdown).toContain("Resources were not stored.");
    expect(markdown).toContain("Security controls were stored as an empty list.");
  });
});
