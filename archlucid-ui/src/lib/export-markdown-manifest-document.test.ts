import { describe, expect, it } from "vitest";

import { formatManifestDocumentShape } from "./export-markdown-manifest-document";
import { formatPolicySection, POLICY_SECTION_NOT_STORED_COPY, pushPolicyAtCommitMarkdownLines } from "./export-markdown-policy-section";

describe("formatPolicySection", () => {
  it("states when policy section was not stored", () => {
    const lines: string[] = [];
    formatPolicySection(null, lines);

    expect(lines.join("\n")).toContain(POLICY_SECTION_NOT_STORED_COPY);
  });
});

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

    expect(markdown).toContain(
      "Services, datastores, relationships, and decisions were stored as empty lists.",
    );
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

  it("labels omitted policy pack version when rule set id is stored (P-05)", () => {
    const markdown = formatManifestDocumentShape({
      ruleSetId: "soc2-pack",
      ruleSetVersion: null,
    });

    expect(markdown).toContain("Policy pack version was not stored.");
  });

  it("labels omitted topology gaps separately from empty arrays (P-06)", () => {
    const missing = formatManifestDocumentShape({
      topology: { services: [], datastores: [], relationships: [], gaps: null },
      decisions: [],
    });
    const empty = formatManifestDocumentShape({
      topology: { services: [], datastores: [], relationships: [], gaps: [] },
      decisions: [],
    });

    expect(missing).toContain("Topology gaps were not stored.");
    expect(empty).not.toContain("Topology gaps were not stored.");
  });

  it("labels omitted manifest warnings (P-07)", () => {
    const markdown = formatManifestDocumentShape({ warnings: null });

    expect(markdown).toContain("Warnings were not stored.");
  });

  it("labels omitted review record hash (P-08)", () => {
    const markdown = formatManifestDocumentShape({ manifestHash: null });

    expect(markdown).toContain("Review record hash was not stored.");
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
