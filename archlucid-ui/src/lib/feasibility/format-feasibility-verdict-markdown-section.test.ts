import { describe, expect, it } from "vitest";

import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import {
  formatFeasibilityVerdictMarkdownSection,
  HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON,
  resolveHardInfeasibleCitationExportBlockedReason,
} from "./format-feasibility-verdict-markdown-section";

describe("formatFeasibilityVerdictMarkdownSection (FC-30 / FC-31)", () => {
  it("reports a missing feasibility verdict", () => {
    expect(formatFeasibilityVerdictMarkdownSection(null)).toBe("Feasibility verdict was not stored.");
    expect(formatFeasibilityVerdictMarkdownSection(undefined)).toBe("Feasibility verdict was not stored.");
  });

  it("blocks hard infeasible exports without citation", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "HardInfeasible",
      summary: "Required controls cannot be satisfied.",
    };

    expect(resolveHardInfeasibleCitationExportBlockedReason(verdict)).toBe(
      HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON,
    );

    const markdown = formatFeasibilityVerdictMarkdownSection(verdict);

    expect(markdown).toContain("Record export blocked");
    expect(markdown).toContain(HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON);
    expect(markdown).not.toMatch(/bare impossible/i);
  });

  it("includes authority citations for hard infeasible exports", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "HardInfeasible",
      summary: "Partition tolerance cannot satisfy availability invariant.",
      hardCitations: [{ kind: "Law", reference: "CAP theorem partition tolerance" }],
      unsatCoreInvariantKeys: ["INV-AVAIL-001"],
    };

    const markdown = formatFeasibilityVerdictMarkdownSection(verdict);

    expect(resolveHardInfeasibleCitationExportBlockedReason(verdict)).toBeNull();
    expect(markdown).toContain("Authority citations");
    expect(markdown).toContain("CAP theorem partition tolerance");
    expect(markdown).toContain("INV-AVAIL-001");
  });

  it("shows soft envelope copy instead of failed-review framing", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "SoftInfeasible",
      summary: "Policy controls are not satisfied for the proposed architecture.",
      softEnvelope: {
        confidenceLow: 50,
        confidenceHigh: 80,
        envelopeDescription: "Holds for this manifest snapshot.",
        softAssumption: "Operator intent matches asserted inputs.",
        costOfBeingWrong: "Shipping policy gaps to production.",
      },
    };

    const markdown = formatFeasibilityVerdictMarkdownSection(verdict);

    expect(markdown).toContain("bounded decision record, not a failed review");
    expect(markdown).toContain("Confidence band:** 50–80");
    expect(markdown).toContain("Holds for this manifest snapshot.");
    expect(markdown).not.toContain("failed review run");
  });

  it("reports a missing soft envelope without treating an empty stored value as missing", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: "SoftInfeasible",
      summary: "Not feasible as specified.",
      softEnvelope: null,
    });
    const stored = formatFeasibilityVerdictMarkdownSection({
      kind: "SoftInfeasible",
      summary: "Not feasible as specified.",
      softEnvelope: {
        confidenceLow: 0,
        confidenceHigh: 0,
        envelopeDescription: "",
        softAssumption: "",
        costOfBeingWrong: "",
      },
    });

    expect(missing).toContain("Operating envelope was not stored.");
    expect(stored).not.toContain("Operating envelope was not stored.");
  });

  it("reports an omitted envelope description without changing stored empty text", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: "SoftInfeasible",
      summary: "Not feasible as specified.",
      softEnvelope: {
        confidenceLow: 0,
        confidenceHigh: 0,
        softAssumption: "",
      },
    });
    const storedEmpty = formatFeasibilityVerdictMarkdownSection({
      kind: "SoftInfeasible",
      summary: "Not feasible as specified.",
      softEnvelope: {
        confidenceLow: 0,
        confidenceHigh: 0,
        envelopeDescription: "",
        softAssumption: "",
      },
    });

    expect(missing).toContain("Envelope description was not stored.");
    expect(missing).not.toContain("undefined");
    expect(storedEmpty).not.toContain("Envelope description was not stored.");
  });

  it("reports omitted soft envelope values while preserving stored empty values", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: "SoftInfeasible",
      summary: "Not feasible as specified.",
      softEnvelope: {
        confidenceLow: 0,
        confidenceHigh: 0,
        softAssumption: "",
      },
      proposedRelaxations: undefined,
    });
    const storedEmpty = formatFeasibilityVerdictMarkdownSection({
      kind: "SoftInfeasible",
      summary: "Not feasible as specified.",
      softEnvelope: {
        confidenceLow: 0,
        confidenceHigh: 0,
        softAssumption: "",
        costOfBeingWrong: "",
      },
      proposedRelaxations: [],
    });

    expect(missing).toContain("Cost of being wrong was not stored.");
    expect(missing).toContain("Proposed relaxations were not stored.");
    expect(storedEmpty).not.toContain("Cost of being wrong was not stored.");
    expect(storedEmpty).not.toContain("Proposed relaxations were not stored.");
  });

  it("renders authority invariant keys and proposed relaxation fields honestly", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "Required controls cannot be satisfied.",
      hardCitations: [{ kind: "NamedLaw", reference: "A named law", invariantKeys: undefined }],
      proposedRelaxations: [{ invariantKey: undefined, tradeOffDescription: undefined }],
    });
    const storedEmpty = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "Required controls cannot be satisfied.",
      hardCitations: [{ kind: "NamedLaw", reference: "A named law", invariantKeys: [] }],
      proposedRelaxations: [{ invariantKey: "", tradeOffDescription: "" }],
    });

    expect(missing).toContain("Citation invariant keys were not stored.");
    expect(missing).toContain("Relaxation invariant key was not stored.");
    expect(missing).toContain("Trade-off description was not stored.");
    expect(storedEmpty).not.toContain("Citation invariant keys were not stored.");
    expect(storedEmpty).not.toContain("Relaxation invariant key was not stored.");
    expect(storedEmpty).not.toContain("Trade-off description was not stored.");
  });

  it("distinguishes missing verdict and citation fields from stored empty values", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: null as never,
      hardCitations: [{ kind: null, reference: null }],
      unsatCoreInvariantKeys: ["INV-1"],
    });
    const storedEmpty = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "",
      hardCitations: [{ kind: "", reference: "" }],
      unsatCoreInvariantKeys: ["INV-1"],
    });

    expect(missing).toContain("Verdict summary was not stored.");
    expect(missing).toContain("Citation reference was not stored.");
    expect(missing).toContain("Citation kind was not stored.");
    expect(storedEmpty).not.toContain("Verdict summary was not stored.");
    expect(storedEmpty).not.toContain("Citation reference was not stored.");
    expect(storedEmpty).not.toContain("Citation kind was not stored.");
  });

  it("distinguishes missing authority citations from a stored empty collection", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "Not feasible.",
      hardCitations: null,
    });
    const storedEmpty = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "Not feasible.",
      hardCitations: [],
    });

    expect(missing).toContain("Authority citations were not stored.");
    expect(storedEmpty).not.toContain("Authority citations were not stored.");
  });

  it("labels stored-empty verdict summary and omitted unsat core on hard infeasible exports", () => {
    const emptySummary = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "   ",
      hardCitations: [{ kind: "Law", reference: "CAP theorem partition tolerance" }],
      unsatCoreInvariantKeys: null,
    });

    expect(emptySummary).toContain("Verdict summary was stored empty.");
    expect(emptySummary).toContain("Unsat core was not stored.");
  });

  it("reports an omitted unsat core without treating null as an empty list", () => {
    const markdown = formatFeasibilityVerdictMarkdownSection({
      kind: "HardInfeasible",
      summary: "Blocked.",
      hardCitations: [{ kind: "Law", reference: "CAP" }],
      unsatCoreInvariantKeys: null,
    });

    expect(markdown).toContain("Unsat core was not stored.");
  });

  it("reports an omitted verdict kind and preserves unexpected stored kinds", () => {
    const missing = formatFeasibilityVerdictMarkdownSection({
      kind: undefined as never,
      summary: "No kind.",
    });
    const unexpected = formatFeasibilityVerdictMarkdownSection({
      kind: "FutureKind" as never,
      summary: "Unknown kind.",
    });

    expect(missing).toContain("Verdict kind was not stored.");
    expect(unexpected).toContain("- **Class:** FutureKind");
  });
});
