import { describe, expect, it } from "vitest";

import { formatTrustEvidenceCardMarkdown } from "@/lib/export-markdown-trust-evidence";
import type { RunTrustEvidenceCard } from "@/types/authority";

describe("formatTrustEvidenceCardMarkdown (P-08 / P-09)", () => {
  it("normalizes legacy trace completeness and evidence chain placeholders", () => {
    const card = {
      selfAttestationNotice: "Notice",
      executionMode: { title: "Execution", status: "Available", detail: null },
      goldenManifest: { title: "Golden", status: "Available", detail: null },
      auditTrail: { title: "Audit", status: "Available", detail: null },
      agentTraces: { title: "Traces", status: "Available", detail: null },
      artifactBundlePointer: { title: "Bundle", status: "Available", detail: null },
      traceabilityExport: { title: "Zip", status: "Available", detail: null },
      aiExplainability: { title: "AI", status: "Available", detail: null },
      topFinding: {
        findingId: "f1",
        title: "Problem",
        traceCompletenessLabel: "Not available",
        evidencePointersSummary: "Evidence chain pointers not available.",
      },
      links: [],
    } satisfies RunTrustEvidenceCard;

    const markdown = formatTrustEvidenceCardMarkdown(card);

    expect(markdown).toContain("**Trace completeness:** Trace completeness was not stored.");
    expect(markdown).toContain("**Evidence pointers:** Evidence chain was not stored.");
  });

  it("distinguishes omitted vs empty evidence route links (P-10)", () => {
    const base = {
      selfAttestationNotice: "Notice",
      executionMode: { title: "Execution", status: "Available", detail: null },
      goldenManifest: { title: "Golden", status: "Available", detail: null },
      auditTrail: { title: "Audit", status: "Available", detail: null },
      agentTraces: { title: "Traces", status: "Available", detail: null },
      artifactBundlePointer: { title: "Bundle", status: "Available", detail: null },
      traceabilityExport: { title: "Zip", status: "Available", detail: null },
      aiExplainability: { title: "AI", status: "Available", detail: null },
      topFinding: null,
    } satisfies Omit<RunTrustEvidenceCard, "links">;

    expect(formatTrustEvidenceCardMarkdown({ ...base, links: undefined })).toContain(
      "Evidence route links were not stored.",
    );
    expect(formatTrustEvidenceCardMarkdown({ ...base, links: [] })).toContain(
      "No evidence route links were stored.",
    );
  });
});
