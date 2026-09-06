import { describe, expect, it, vi, afterEach } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { INTERNAL_DEMO_READINESS_PAGE_TITLE } from "@/lib/demo-readiness-evidence-copy";
import { OperatorSystemAdminNavGroupBuilder, buildOperatorSystemAdminNavLinks } from "@/lib/operator/operator-system-admin-nav-group-builder";

describe("OperatorSystemAdminNavGroupBuilder", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gates internal telemetry links at AdminAuthority (TB-648)", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const gatedHrefs = new Set([
      "/internal/trial-funnel",
      "/internal/fleet-llm-cogs",
      "/internal/agent-model-catalog",
      "/internal/rag-health",
      "/internal/failed-integration-messages",
    ]);

    for (const link of group.links) {
      if (gatedHrefs.has(link.href)) {
        expect(link.requiredAuthority, link.href).toBe("AdminAuthority");
      }
    }
  });

  it("uses buyer-facing labels for knowledge index and failed integration nav (TB-648)", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const ragLink = group.links.find((link) => link.href === "/internal/rag-health");
    const dlqLink = group.links.find((link) => link.href === "/internal/failed-integration-messages");

    expect(ragLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth);
    expect(dlqLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages);
    expect(group.links.map((link) => link.label)).not.toContain("RAG health");
    expect(group.links.map((link) => link.label)).not.toContain("Integration DLQ");
  });

  it("includes demo readiness under Internal Operations for administrators", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const demoReadiness = group.links.find((link) => link.href === "/internal/demo-readiness");

    expect(demoReadiness?.label).toBe(INTERNAL_DEMO_READINESS_PAGE_TITLE);
    expect(demoReadiness?.requiredAuthority).toBe("AdminAuthority");
    expect(demoReadiness?.tier).toBe("advanced");
  });

  it("returns no links in customer-facing shells without internal operator access", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    const group = new OperatorSystemAdminNavGroupBuilder().build();

    expect(group.links).toEqual([]);
  });

  it("buildOperatorSystemAdminNavLinks always materializes catalog links for runtime shell gating", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "");

    const links = buildOperatorSystemAdminNavLinks();

    expect(links.map((link) => link.href)).toContain("/internal/rag-health");
  });

  it("includes Review feedback under Internal Operations", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_INTERNAL_OPERATOR", "true");

    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const reviewFeedback = group.links.find((link) => link.href === "/internal/product-learning");

    expect(reviewFeedback?.label).toBe(OPERATOR_NAV_LINK_LABELS.pilotFeedback);
    expect(reviewFeedback?.requiredAuthority).toBe("ReadAuthority");
    expect(reviewFeedback?.tier).toBe("advanced");
  });
});
