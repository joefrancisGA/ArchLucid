import { describe, expect, it } from "vitest";

import {
  applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse,
  buildArchitectureDraftSuggestionSourceText,
  buildDeterministicStructuredBriefSuggestionsFromText,
  extractQualityAttributeSuggestionsFromText,
} from "@/lib/architecture/architecture-draft-structured-brief-suggestions";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";

const SAMPLE_PACKET = `# Architecture Review Packet: B2B SaaS Tenant Migration Platform

## 7. Reliability, resiliency, and performance

- Availability target is 99.9% for pilot.
- RPO is 15 minutes; RTO is 4 hours.
- Audit export must generate within 30 minutes.
- No tenant-level noisy-neighbor controls in phase one.

## 9. Architecture decisions / ADRs

### ADR-001: Shared DB with TenantId
**Decision/rationale:** Reduce cost/complexity; requires strong tenant-filter proof.

### ADR-002: Support impersonation for pilot
**Decision/rationale:** Reduce support friction; requires strong audit/approval.

## 6. Security and identity model

- Tenant isolation uses application-layer tenant context and DB filters.
- Support impersonation is logged but not separately approved in system.
`;

describe("buildArchitectureDraftSuggestionSourceText", () => {
  it("includes system name, outcome, and overview sections", () => {
    const source = buildArchitectureDraftSuggestionSourceText({
      systemName: "Vertex",
      businessOutcome: "Faster tenant onboarding",
      architectureOverview: "Multi-tenant SaaS migration platform.",
    });

    expect(source).toContain("System name: Vertex");
    expect(source).toContain("Business outcome: Faster tenant onboarding");
    expect(source).toContain("Architecture overview:\nMulti-tenant SaaS migration platform.");
  });
});

describe("buildDeterministicStructuredBriefSuggestionsFromText", () => {
  it("extracts ADRs, bullets, and pilot assumptions from review packets", () => {
    const suggestions = buildDeterministicStructuredBriefSuggestionsFromText(SAMPLE_PACKET);

    expect(suggestions.suggestedConstraints.length).toBeGreaterThan(0);
    expect(suggestions.suggestedAssumptions.some((item) => /noisy-neighbor/i.test(item))).toBe(true);
    expect(suggestions.suggestedCapabilities.some((item) => /audit export/i.test(item))).toBe(true);
  });

  it("returns empty suggestions for very short text", () => {
    expect(buildDeterministicStructuredBriefSuggestionsFromText("too short")).toEqual({
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
    });
  });
});

describe("extractQualityAttributeSuggestionsFromText", () => {
  it("extracts availability, RPO, RTO, and audit export latency targets", () => {
    const suggestions = extractQualityAttributeSuggestionsFromText(SAMPLE_PACKET);

    expect(suggestions).toContain("Availability 99.9%");
    expect(suggestions).toContain("RPO 15 minutes");
    expect(suggestions).toContain("RTO 4 hours");
    expect(suggestions).toContain("Audit export latency 30 minutes");
  });
});

describe("applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse", () => {
  it("stages failure mode suggestions for confirm/deny instead of auto-filling the field", () => {
    const applied = applyArchitectureDraftStructuredBriefSuggestionsFromDraftResponse({
      brief: emptyArchitectureDraftStructuredBrief(),
      sourceText: "RPO is 15 minutes; RTO is 4 hours.",
      suggestedConstraints: [],
      suggestedAssumptions: [],
      suggestedCapabilities: [],
      suggestedFailureModeNote: null,
    });

    expect(applied.brief.failureModeNote).toBe("");
    expect(applied.brief.suggestedFailureModeNote).toContain("RPO (15 minutes)");
    expect(applied.addedSuggestionCount).toBeGreaterThan(0);
  });
});
