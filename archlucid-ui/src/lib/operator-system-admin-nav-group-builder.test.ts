import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { OperatorSystemAdminNavGroupBuilder } from "@/lib/operator-system-admin-nav-group-builder";

describe("OperatorSystemAdminNavGroupBuilder", () => {
  it("gates internal telemetry links at AdminAuthority (TB-648)", () => {
    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const gatedHrefs = new Set([
      "/admin/trial-funnel",
      "/admin/fleet-llm-cogs",
      "/admin/rag-health",
      "/operate/integration-events/dlq",
    ]);

    for (const link of group.links) {
      if (gatedHrefs.has(link.href)) {
        expect(link.requiredAuthority, link.href).toBe("AdminAuthority");
      }
    }
  });

  it("uses buyer-facing labels for knowledge index and failed integration nav (TB-648)", () => {
    const group = new OperatorSystemAdminNavGroupBuilder().build();
    const ragLink = group.links.find((link) => link.href === "/admin/rag-health");
    const dlqLink = group.links.find((link) => link.href === "/operate/integration-events/dlq");

    expect(ragLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth);
    expect(dlqLink?.label).toBe(OPERATOR_NAV_LINK_LABELS.failedIntegrationMessages);
    expect(group.links.map((link) => link.label)).not.toContain("RAG health");
    expect(group.links.map((link) => link.label)).not.toContain("Integration DLQ");
  });
});
