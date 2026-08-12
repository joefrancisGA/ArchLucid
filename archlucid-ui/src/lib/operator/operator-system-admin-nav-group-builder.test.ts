import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { INTERNAL_DEMO_READINESS_PAGE_TITLE } from "@/lib/demo-readiness-evidence-copy";
import { OperatorSystemAdminNavGroupBuilder } from "@/lib/operator/operator-system-admin-nav-group-builder";

describe("OperatorSystemAdminNavGroupBuilder", () => {
  it("gates internal telemetry links at AdminAuthority (TB-648)", () => {
    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const gatedHrefs = new Set([
      "/internal/trial-funnel",
      "/internal/fleet-llm-cogs",
      "/internal/rag-health",
      "/internal/integration-events/dlq",
    ]);

    for (const link of group.links) {
      if (gatedHrefs.has(link.href)) {
        expect(link.requiredAuthority, link.href).toBe("AdminAuthority");
      }
    }
  });

  it("uses buyer-facing labels for knowledge index and failed integration nav (TB-648)", () => {
    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const ragLink = group.links.find((link) => link.href === "/internal/rag-health");
    const dlqLink = group.links.find((link) => link.href === "/internal/integration-events/dlq");

    expect(ragLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth);
    expect(dlqLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages);
    expect(group.links.map((link) => link.label)).not.toContain("RAG health");
    expect(group.links.map((link) => link.label)).not.toContain("Integration DLQ");
  });

  it("includes demo readiness under Internal Operations for administrators", () => {
    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const demoReadiness = group.links.find((link) => link.href === "/internal/demo-readiness");

    expect(demoReadiness?.label).toBe(INTERNAL_DEMO_READINESS_PAGE_TITLE);
    expect(demoReadiness?.requiredAuthority).toBe("AdminAuthority");
    expect(demoReadiness?.tier).toBe("advanced");
  });

  it("includes Review feedback under Internal Operations", () => {
    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const reviewFeedback = group.links.find((link) => link.href === "/internal/product-learning");

    expect(reviewFeedback?.label).toBe(OPERATOR_NAV_LINK_LABELS.pilotFeedback);
    expect(reviewFeedback?.requiredAuthority).toBe("ReadAuthority");
    expect(reviewFeedback?.tier).toBe("advanced");
  });
});
