import { describe, expect, it } from "vitest";

import { extractClarificationEvidenceSnippet } from "@/lib/universal-intake-clarification-evidence-snippet";

const SPARSE_ARCHLUCID_BRIEF = [
  "System name: ArchLucid",
  "Business outcome: Additional actor kinds: Azure OpenAI, Service Bus, and Blob are optional for live models, integration fan-out, and large artifacts.",
].join("\n\n");

const RICH_BRIEF =
  "Customer-facing API on Microsoft Azure with private endpoints, Entra ID authentication, and PCI-DSS scope for cardholder data.\n" +
  "Operations expects on-call paging, centralized monitoring, and incident runbooks.\n" +
  "Target 99.9% uptime with RPO 15 minutes and RTO 4 hours.\n" +
  "Budget is about $25,000 per month.\n" +
  "Peak load is 2,000 concurrent users with p95 latency under 300 ms.\n" +
  "Partner integrations and service accounts also call the API.";

describe("extractClarificationEvidenceSnippet", () => {
  it("returns null for sparse brief lines that only match business-outcome boilerplate", () => {
    expect(extractClarificationEvidenceSnippet(SPARSE_ARCHLUCID_BRIEF, "l0.pillar.cost")).toBeNull();
    expect(extractClarificationEvidenceSnippet(SPARSE_ARCHLUCID_BRIEF, "l0.pillar.performance")).toBeNull();
    expect(extractClarificationEvidenceSnippet(SPARSE_ARCHLUCID_BRIEF, "l0.pillar.security")).toBeNull();
    expect(extractClarificationEvidenceSnippet(SPARSE_ARCHLUCID_BRIEF, "l0.actor.additional-kinds")).toBeNull();
  });

  it("returns question-specific snippets from a rich brief", () => {
    expect(extractClarificationEvidenceSnippet(RICH_BRIEF, "l0.pillar.cost")?.toLowerCase()).toMatch(/\$25,000|budget/);
    expect(extractClarificationEvidenceSnippet(RICH_BRIEF, "l0.pillar.security")?.toLowerCase()).toMatch(/pci|entra/);
    expect(extractClarificationEvidenceSnippet(RICH_BRIEF, "l0.pillar.performance")?.toLowerCase()).toMatch(
      /concurrent users|latency/,
    );
    expect(extractClarificationEvidenceSnippet(RICH_BRIEF, "l0.actor.additional-kinds")?.toLowerCase()).toMatch(
      /partner integrations|service accounts/,
    );
  });

  it("never returns the same full brief blob for unrelated pillars", () => {
    const costSnippet = extractClarificationEvidenceSnippet(RICH_BRIEF, "l0.pillar.cost");
    const performanceSnippet = extractClarificationEvidenceSnippet(RICH_BRIEF, "l0.pillar.performance");

    expect(costSnippet).not.toEqual(performanceSnippet);
    expect(costSnippet).not.toContain("concurrent users");
    expect(performanceSnippet).not.toContain("$25,000");
  });
});
