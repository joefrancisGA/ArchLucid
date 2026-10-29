import { describe, expect, it } from "vitest";

import {
  buildGoldenManifestMarkdownFilename,
  formatGoldenManifestMarkdown,
  formatTrustEvidenceCardMarkdown,
  isUsableGoldenManifestExportJson,
} from "./export-markdown";
import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";
import { pushPolicyAtCommitMarkdownLines } from "./export-markdown-policy-section";

describe("isUsableGoldenManifestExportJson", () => {
  it("rejects placeholders and empty objects", () => {
    expect(isUsableGoldenManifestExportJson(null)).toBe(false);
    expect(isUsableGoldenManifestExportJson(undefined)).toBe(false);
    expect(isUsableGoldenManifestExportJson({})).toBe(false);
    expect(isUsableGoldenManifestExportJson({ demo: true })).toBe(false);
  });

  it("accepts manifest-like objects", () => {
    expect(isUsableGoldenManifestExportJson({ runId: "r1", manifestId: "m1" })).toBe(true);
  });
});

describe("formatTrustEvidenceCardMarkdown", () => {
  it("renders operational evidence section and routes", () => {
    const card: RunTrustEvidenceCard = {
      selfAttestationNotice: "Not a SOC 2 report.",
      executionMode: { title: "Execution mode", status: "Demo-only", detail: "Simulator path." },
      goldenManifest: { title: "Golden manifest snapshot", status: "Available", detail: "v1" },
      auditTrail: { title: "Audit events (run-scoped)", status: "Available", detail: "3 events" },
      agentTraces: { title: "Agent execution trace rows", status: "Missing", detail: "None" },
      artifactBundlePointer: { title: "Persisted artifact bundle id", status: "Missing", detail: null },
      traceabilityExport: { title: "Review-trail export (ZIP)", status: "Available", detail: "Capped" },
      aiExplainability: { title: "AI explainability rollup", status: "Low confidence", detail: "Weak faithfulness" },
      topFinding: {
        findingId: "f1",
        title: "Issue",
        traceCompletenessLabel: "Medium",
        evidencePointersSummary: "Manifest v1; graph nodes: 0; linked trace ids: 0.",
      },
      links: [{ rel: "traces", path: "/v1/architecture/review/r1/traces", label: "Traces" }],
    };

    const md = formatTrustEvidenceCardMarkdown(card);

    expect(md).toContain("## Evidence basis (operational)");
    expect(md).toContain("**Proof confidence:** Simulator-only");
    expect(md).toContain("Not a SOC 2 report.");
    expect(md).toContain("### Evidence routes");
    expect(md).toContain("/v1/architecture/review/r1/traces");
    expect(md).toContain("### Top finding");
  });
});

describe("formatGoldenManifestMarkdown", () => {
  it("renders ManifestDocument-shaped JSON with required sections", () => {
    const doc = {
      manifestId: "m1",
      runId: "r1",
      ruleSetId: "rules",
      ruleSetVersion: "1.0",
      manifestHash: "h1",
      metadata: { changeDescription: "Ship faster with safer defaults." },
      assumptions: ["Assume regional Azure footprint."],
      topology: {
        selectedPatterns: ["Hub-spoke"],
        services: [
          {
            serviceId: "s1",
            serviceName: "API",
            serviceType: 0,
            runtimePlatform: 0,
            purpose: "Ingress",
          },
        ],
      },
      security: {
        controls: [{ controlName: "TLS", status: "Required", impact: "In transit" }],
        gaps: [],
      },
      decisions: [
        {
          decisionId: "d1",
          title: "Private endpoints",
          category: "Security",
          rationale: "Reduce attack surface.",
        },
      ],
    };

    const md = formatGoldenManifestMarkdown(doc);

    expect(md).toContain("# Ship faster with safer defaults.");
    expect(md).toContain("## Objectives");
    expect(md).toContain("## Architecture overview");
    expect(md).toContain("## Component breakdown");
    expect(md).toContain("### Services");
    expect(md).toContain("**API**");
    expect(md).toContain("## Security model");
    expect(md).toContain("### Controls");
    expect(md).toContain("**TLS**");
    expect(md).toContain("### Architecture decisions");
    expect(md).toContain("Private endpoints");
  });

  it("uses explicit stored-value omission copy in manifest and policy exports", () => {
    const manifestMarkdown = formatGoldenManifestMarkdown({
      metadata: { manifestVersion: "7" },
      effectiveGovernanceAtCommit: {
        hasEffectivePolicy: true,
        packAssignments: [],
        coverageAssignments: [
          {
            policyPackId: "pack-a",
            coverageType: null,
            selectionState: null,
            qualityDimension: null,
          },
        ],
      },
    });

    expect(manifestMarkdown).toContain("# Change description was not stored.");
    expect(manifestMarkdown).toContain("**Review record version:** 7");
    expect(manifestMarkdown).toContain("Policy pack version was not stored.");
    expect(manifestMarkdown).toContain("Coverage type was not stored.");
    expect(manifestMarkdown).toContain("Selection state was not stored.");
    expect(manifestMarkdown).toContain("Quality dimension was not stored.");

    const lines: string[] = [];
    pushPolicyAtCommitMarkdownLines(
      {
        effectiveGovernanceAtCommit: {
          hasEffectivePolicy: true,
          packAssignments: [],
          coverageAssignments: [
            {
              policyPackId: "pack-a",
              policyPackVersion: "",
              coverageType: "Unknown",
              selectionState: "",
              qualityDimension: "",
            },
          ],
        },
      },
      lines,
    );

    const policyLines = lines.join("\n");

    expect(policyLines).toContain("Policy pack version was not stored.");
    expect(policyLines).toContain("Coverage type recorded as unknown.");
    expect(policyLines).toContain("Quality dimension was not stored.");
    expect(policyLines).toContain("Selection state was not stored.");
    expect(policyLines).not.toContain("v —");
  });

  it("distinguishes missing manifest fields from stored empty collections and strings", () => {
    const missing = formatGoldenManifestMarkdown({
      requirements: {
        covered: [{ requirementName: "Retention", requirementText: null, coverageStatus: "Covered" }],
      },
      constraints: null,
      security: null,
    });
    const storedEmpty = formatGoldenManifestMarkdown({
      requirements: {
        covered: [{ requirementName: "Retention", requirementText: "", coverageStatus: "Covered" }],
      },
      constraints: { mandatoryConstraints: [], preferences: [] },
      security: { controls: [], gaps: [] },
    });

    expect(missing).toContain("Retention");
    expect(missing).toContain("Requirement text was not stored.");
    expect(missing).toContain("Constraints were not stored.");
    expect(missing).toContain("Security model was not stored.");
    expect(storedEmpty).not.toContain("Requirement text was not stored.");
    expect(storedEmpty).toContain("_No mandatory constraints._");
    expect(storedEmpty).not.toContain("Security model was not stored.");
  });

  it("reports omitted manifest values while preserving stored empty values", () => {
    const omitted = formatGoldenManifestMarkdown({
      manifestHash: null,
      assumptions: null,
      topology: null,
      security: { gaps: null },
      warnings: null,
    });
    const storedEmpty = formatGoldenManifestMarkdown({
      manifestHash: "",
      assumptions: [],
      topology: { selectedPatterns: [], resources: [], gaps: [], services: [] },
      security: { gaps: [] },
      warnings: [],
    });

    expect(omitted).toContain("Review record hash was not stored.");
    expect(omitted).toContain("Assumptions were not stored.");
    expect(omitted).toContain("Architecture structure was not stored.");
    expect(omitted).toContain("Security gaps were not stored.");
    expect(omitted).toContain("Warnings were not stored.");
    expect(storedEmpty).toContain("_No assumptions listed._");
    expect(storedEmpty).not.toContain("Architecture structure was not stored.");
    expect(storedEmpty).not.toContain("Security gaps were not stored.");
    expect(storedEmpty).not.toContain("Warnings were not stored.");
    expect(storedEmpty).not.toContain("Review record hash was not stored.");
  });

  it("reports missing topology collections while preserving stored empty collections", () => {
    const missing = formatGoldenManifestMarkdown({
      topology: { selectedPatterns: null, gaps: undefined },
    });
    const storedEmpty = formatGoldenManifestMarkdown({
      topology: { selectedPatterns: [], gaps: [] },
    });

    expect(missing).toContain("Selected patterns were not stored.");
    expect(missing).toContain("Topology gaps were not stored.");
    expect(storedEmpty).not.toContain("Selected patterns were not stored.");
    expect(storedEmpty).not.toContain("Topology gaps were not stored.");
  });

  it("reports omitted service purpose and preserves an empty purpose", () => {
    const omitted = formatGoldenManifestMarkdown({
      topology: { services: [{ serviceName: "API", purpose: null }] },
    });
    const storedEmpty = formatGoldenManifestMarkdown({
      topology: { services: [{ serviceName: "API", purpose: "" }] },
    });

    expect(omitted).toContain("Purpose was not stored.");
    expect(storedEmpty).not.toContain("Purpose was not stored.");
  });

  it("reports omitted component values while preserving stored empty values", () => {
    const omitted = formatGoldenManifestMarkdown({
      constraints: {},
      topology: {
        services: [{ serviceName: null, serviceId: null }],
        datastores: [{ name: null, datastoreId: null }],
      },
      decisions: [{ decisionId: null, selectedOption: null }],
    });
    const storedEmpty = formatGoldenManifestMarkdown({
      constraints: { preferences: [] },
      topology: {
        services: [{ serviceName: "", serviceId: "" }],
        datastores: [{ name: "", datastoreId: "" }],
      },
      decisions: [{ decisionId: "", selectedOption: "" }],
    });

    expect(omitted).toContain("Preferences were not stored.");
    expect(omitted).toContain("Service name was not stored.");
    expect(omitted).toContain("Service id was not stored.");
    expect(omitted).toContain("Datastore name was not stored.");
    expect(omitted).toContain("Datastore id was not stored.");
    expect(omitted).toContain("Decision id was not stored.");
    expect(omitted).toContain("Selected option was not stored.");
    expect(storedEmpty).not.toContain("Preferences were not stored.");
    expect(storedEmpty).not.toContain("Service name was not stored.");
    expect(storedEmpty).not.toContain("Service id was not stored.");
    expect(storedEmpty).not.toContain("Datastore name was not stored.");
    expect(storedEmpty).not.toContain("Datastore id was not stored.");
    expect(storedEmpty).not.toContain("Decision id was not stored.");
    expect(storedEmpty).not.toContain("Selected option was not stored.");
    expect(storedEmpty).toContain("Preferences were stored as an empty list.");
  });

  it("distinguishes null versus empty cost notes, risks, and warnings", () => {
    const omitted = formatGoldenManifestMarkdown({
      cost: { notes: null, costRisks: null },
      warnings: null,
    });
    const storedEmpty = formatGoldenManifestMarkdown({
      cost: { notes: [], costRisks: [] },
      warnings: [],
    });

    expect(omitted).toContain("Cost notes were not stored.");
    expect(omitted).toContain("Cost risks were not stored.");
    expect(omitted).toContain("Warnings were not stored.");
    expect(storedEmpty).toContain("Cost notes were stored as an empty list.");
    expect(storedEmpty).toContain("Cost risks were stored as an empty list.");
    expect(storedEmpty).toContain("Warnings were stored as an empty list.");
  });

  it("reports omitted policy-at-commit counts while preserving zero", () => {
    const omitted: string[] = [];
    const zero: string[] = [];

    pushPolicyAtCommitMarkdownLines(
      { effectiveGovernanceAtCommit: { hasEffectivePolicy: true } },
      omitted,
    );
    pushPolicyAtCommitMarkdownLines(
      {
        effectiveGovernanceAtCommit: {
          hasEffectivePolicy: true,
          complianceRuleKeyCount: 0,
          complianceRuleKeys: [],
          conflictCount: 0,
        },
      },
      zero,
    );

    expect(omitted.join("\n")).toContain("Compliance rule key count was not stored.");
    expect(omitted.join("\n")).toContain("Merge conflict count was not stored.");
    expect(zero.join("\n")).toContain("Compliance rule keys:** 0");
    expect(zero.join("\n")).not.toContain("was not stored.");
  });

  it("includes feasibility verdict section with soft envelope on manifest exports", () => {
    const doc = {
      manifestId: "m1",
      runId: "r1",
      ruleSetId: "rules",
      ruleSetVersion: "1.0",
      manifestHash: "h1",
      feasibilityVerdict: {
        kind: "SoftInfeasible",
        summary: "Not feasible as specified.",
        softEnvelope: {
          confidenceLow: 40,
          confidenceHigh: 70,
          envelopeDescription: "Holds below 1k RPS.",
          softAssumption: "Traffic stays within pilot envelope.",
          costOfBeingWrong: "Over-provisioning spend.",
        },
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [],
          skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
        },
      },
    };

    const md = formatGoldenManifestMarkdown(doc);

    expect(md).toContain("## Feasibility verdict");
    expect(md).toContain("bounded decision record, not a failed review");
    expect(md).toContain("Holds below 1k RPS.");
    expect(md).toContain("## Transparency trail");
    expect(md).toContain("l0.pillar.security");
  });

  it("includes a transparency trail section when the manifest carries one", () => {
    const doc = {
      manifestId: "m1",
      runId: "r1",
      ruleSetId: "rules",
      ruleSetVersion: "1.0",
      manifestHash: "h1",
      feasibilityVerdict: {
        kind: "SoftInfeasible",
        summary: "Not feasible as specified.",
        transparencyTrail: {
          asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
          inferred: [{ key: "throughput", value: "high", confidence: 0.6 }],
          skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
        },
      },
    };

    const md = formatGoldenManifestMarkdown(doc);

    expect(md).toContain("## Feasibility verdict");
    expect(md).toContain("## Transparency trail");
    expect(md).toContain("l0.pillar.security");
  });

  it("renders sandbox golden-manifest v1 JSON (highlights + summary)", () => {
    const sandbox = {
      schemaVersion: "archlucid.golden-manifest.v1",
      systemName: "Claims API",
      environment: "Production",
      cloudProvider: "Azure",
      status: "Committed",
      summary: {
        decisionCount: 3,
        warningCount: 1,
        unresolvedIssueCount: 0,
        costPosture: "Within budget.",
      },
      highlights: [
        {
          decisionId: "x",
          title: "Use private link",
          category: "Security",
          disposition: "Accepted",
          rationale: "Operator-only access.",
        },
      ],
      warnings: [{ code: "W1", message: "Add probes." }],
    };

    const md = formatGoldenManifestMarkdown(sandbox);

    expect(md).toContain("# Claims API");
    expect(md).toContain("## Objectives");
    expect(md).toContain("**Decisions recorded:** 3");
    expect(md).toContain("## Component breakdown");
    expect(md).toContain("### Use private link");
    expect(md).toContain("## Security model");
    expect(md).toContain("**W1:** Add probes.");
  });

  it("distinguishes missing highlights from stored empty highlights", () => {
    const base = {
      schemaVersion: "archlucid.golden-manifest.v1",
      summary: {},
    };

    expect(formatGoldenManifestMarkdown({ ...base, highlights: null })).toContain(
      "Highlights were not stored.",
    );
    expect(formatGoldenManifestMarkdown(base)).toContain("Highlights were not stored.");
    expect(formatGoldenManifestMarkdown({ ...base, highlights: [] })).toContain(
      "_No highlights were present._",
    );
    expect(formatGoldenManifestMarkdown({ ...base, highlights: [] })).not.toContain(
      "Highlights were not stored.",
    );
  });

  it("distinguishes missing manifest versions from stored blank versions", () => {
    expect(formatGoldenManifestMarkdown({ metadata: null })).toContain("Review record version was not stored.");
    expect(formatGoldenManifestMarkdown({ metadata: { manifestVersion: null } })).toContain(
      "Review record version was not stored.",
    );
    expect(formatGoldenManifestMarkdown({ metadata: { manifestVersion: "" } })).not.toContain(
      "Review record version was not stored.",
    );
    expect(formatGoldenManifestMarkdown({ metadata: { manifestVersion: "  " } })).not.toContain(
      "Review record version was not stored.",
    );
  });

  it("distinguishes missing trust notices from stored blank notices", () => {
    const base: RunTrustEvidenceCard = {
      selfAttestationNotice: "",
      executionMode: { title: "Execution mode", status: "Available", detail: null },
      goldenManifest: { title: "Golden manifest", status: "Available", detail: null },
      auditTrail: { title: "Audit trail", status: "Available", detail: null },
      agentTraces: { title: "Agent traces", status: "Available", detail: null },
      artifactBundlePointer: { title: "Artifact bundle", status: "Available", detail: null },
      traceabilityExport: { title: "Traceability export", status: "Available", detail: null },
      aiExplainability: { title: "AI explainability", status: "Available", detail: null },
      topFinding: null,
      links: [],
    };
    expect(formatTrustEvidenceCardMarkdown({ ...base, selfAttestationNotice: null })).toContain(
      "Self-attestation notice was not stored.",
    );
    expect(formatTrustEvidenceCardMarkdown({ ...base, selfAttestationNotice: undefined })).toContain(
      "Self-attestation notice was not stored.",
    );
    expect(formatTrustEvidenceCardMarkdown({ ...base, selfAttestationNotice: "" })).not.toContain(
      "Self-attestation notice was not stored.",
    );
  });

  it("falls back to manifest summary when JSON is missing", () => {
    const summary: ManifestSummary = {
      manifestId: "m9",
      runId: "r9",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "hash",
      ruleSetId: "p1",
      ruleSetVersion: "2.0",
      status: "Committed",
      decisionCount: 4,
      warningCount: 1,
      unresolvedIssueCount: 0,
      operatorSummary: "One-line operator summary.",
    };

    const md = formatGoldenManifestMarkdown(null, {
      runId: "r9",
      manifestSummaryFallback: summary,
      enginesSucceeded: 16,
      careerExportHonesty: {
        enginesSucceeded: 16,
        workingDesk: true,
      },
    });

    expect(md).toContain("# Architecture review record summary");
    expect(md).toContain("**Decisions:** 4");
    expect(md).toContain("One-line operator summary.");
    expect(md).toContain("Measurement floor");
    expect(md).toContain(
      "Full review record JSON was not included in this export. The lines below are summary counts only.",
    );
    expect(md).toContain("Component breakdown was not included in this export.");
    expect(md).toContain("Security model was not included in this export.");
    expect(md).not.toContain("browser session");
  });

  it("labels omitted engines succeeded on summary fallback export (P-10)", () => {
    const summary: ManifestSummary = {
      manifestId: "m9",
      runId: "r9",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "hash",
      ruleSetId: "p1",
      ruleSetVersion: "2.0",
      status: "Committed",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
    };

    const md = formatGoldenManifestMarkdown(null, {
      manifestSummaryFallback: summary,
      enginesSucceeded: null,
    });

    expect(md).toContain(
      "Distinct engines that succeeded on this package was not stored on this export.",
    );
  });

  it("distinguishes a missing operator summary from a stored empty summary", () => {
    const base: ManifestSummary = {
      manifestId: "m9",
      runId: "r9",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "hash",
      ruleSetId: "p1",
      ruleSetVersion: "2.0",
      status: "Committed",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
    };

    expect(formatGoldenManifestMarkdown(null, { manifestSummaryFallback: base }))
      .toContain("Operator summary was not included in this export.");
    expect(formatGoldenManifestMarkdown(null, {
      manifestSummaryFallback: { ...base, operatorSummary: "" },
    })).toContain("Operator summary was stored empty.");
    expect(formatGoldenManifestMarkdown(null, {
      manifestSummaryFallback: { ...base, operatorSummary: "   " },
    })).toContain("Operator summary was stored empty.");
  });

  it("labels non-finite summary counts in fallback export", () => {
    const summary: ManifestSummary = {
      manifestId: "m9",
      runId: "r9",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "hash",
      ruleSetId: "p1",
      ruleSetVersion: "2.0",
      status: "Committed",
      decisionCount: Number.NaN,
      warningCount: Number.POSITIVE_INFINITY,
      unresolvedIssueCount: undefined as unknown as number,
      operatorSummary: "Summary",
    };

    const md = formatGoldenManifestMarkdown(null, { manifestSummaryFallback: summary });

    expect(md).toContain("Decision count was not stored.");
    expect(md).toContain("Warning count was not stored.");
    expect(md).toContain("Unresolved issue count was not stored.");
    expect(md).not.toContain("NaN");
    expect(md).not.toContain("undefined");
  });

  it("labels blank summary metadata in fallback export", () => {
    const summary: ManifestSummary = {
      manifestId: "m9",
      runId: "r9",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "",
      ruleSetId: "",
      ruleSetVersion: "",
      status: "",
      decisionCount: 0,
      warningCount: 0,
      unresolvedIssueCount: 0,
    };

    const md = formatGoldenManifestMarkdown(null, { manifestSummaryFallback: summary });

    expect(md).toContain("Review id was not stored.");
    expect(md).toContain("Status was not stored.");
    expect(md).toContain("Policy pack was not stored.");
    expect(md).toContain("Review record hash was not stored.");
  });

  it("fallback measurement floor names skipped actor engines when graph context is provided", () => {
    const summary: ManifestSummary = {
      manifestId: "m9",
      createdUtc: "2026-01-01T00:00:00Z",
      manifestHash: "hash",
      ruleSetId: "p1",
      ruleSetVersion: "2.0",
      status: "Committed",
      decisionCount: 4,
      warningCount: 1,
      unresolvedIssueCount: 0,
      operatorSummary: "One-line operator summary.",
    };

    const md = formatGoldenManifestMarkdown(null, {
      runId: "r9",
      manifestSummaryFallback: summary,
      enginesSucceeded: 12,
      careerExportHonesty: {
        enginesSucceeded: 12,
        workingDesk: true,
        graphSnapshot: { nodes: [] },
        progressSummary: {
          runId: "r9",
          projectId: "p1",
          createdUtc: "2026-01-01T00:00:00Z",
          hasFindingsSnapshot: true,
          hasGraphSnapshot: true,
          hasContextSnapshot: true,
        },
      },
    });

    expect(md).toContain("external-exposure");
    expect(md).toContain("no Actor nodes");
  });

  it("appends shared career export honesty to full manifest JSON exports (PC-13)", () => {
    const md = formatGoldenManifestMarkdown(
      { runId: "r1", manifestId: "m1", manifestHash: "h1" },
      {
        runId: "r1",
        enginesSucceeded: 16,
        careerExportHonesty: {
          enginesSucceeded: 16,
          workingDesk: true,
        },
      },
    );

    expect(md).toContain("Measurement floor");
  });

  it("returns a clear message when nothing is available", () => {
    const md = formatGoldenManifestMarkdown({ demo: true });

    expect(md).toContain("Review record JSON was not available");
  });
});

describe("buildGoldenManifestMarkdownFilename", () => {
  it("sanitizes run id for download name", () => {
    expect(buildGoldenManifestMarkdownFilename("run/a#b", "m1")).toBe("golden-manifest-run-a-b.md");
  });
});
