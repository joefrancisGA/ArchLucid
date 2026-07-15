import { describe, expect, it } from "vitest";

import {
  groupReadinessRows,
  humanizeHealthCheckId,
  presentReadinessRow,
  resolveHealthDisplayStatus,
  resolveOverallHealthHeadline,
} from "@/lib/health-readiness-presentation";

describe("health-readiness-presentation", () => {
  it("maps known readiness check ids to customer labels", () => {
    expect(humanizeHealthCheckId("sql_system_plane")).toBe("System database");
    expect(humanizeHealthCheckId("graph-projection-cache")).toBe("Evidence graph cache");
    expect(humanizeHealthCheckId("retrieval_index_freshness")).toBe("Search index freshness");
    expect(humanizeHealthCheckId("keyvault")).toBe("Secrets store connectivity");
    expect(humanizeHealthCheckId("key_vault")).toBe("Secrets store access");
  });

  it("maps skipped statuses to customer-safe labels", () => {
    expect(resolveHealthDisplayStatus("Skipped", "sql_server")).toBe("Not configured");
    expect(resolveHealthDisplayStatus("Skipped", "redis")).toBe("Not applicable");
  });

  it("groups readiness rows by category", () => {
    const groups = groupReadinessRows([
      { name: "database", status: "Healthy" },
      { name: "openai", status: "Healthy" },
      { name: "data_archival", status: "Skipped" },
    ]);

    expect(groups.some((group) => group.category.title === "Data stores")).toBe(true);
    expect(groups.some((group) => group.category.title === "Integrations")).toBe(true);
    expect(groups.some((group) => group.category.title === "Background workers")).toBe(true);
  });

  it("provides operational headline copy for healthy deployments", () => {
    expect(resolveOverallHealthHeadline("Healthy")).toEqual({
      title: "All required services are healthy",
      subtitle: "No blocking issues detected for this workspace.",
    });
  });

  it("explains skipped keyvault checks with secrets-store language", () => {
    const row = presentReadinessRow("keyvault", "skipped");

    expect(row.displayStatus).toBe("Not configured");
    expect(row.explanation).toBe("Secrets store is not configured for this environment.");
  });

  it("explains skipped checks in plain language", () => {
    const row = presentReadinessRow(
      "sql_server",
      "skipped",
      undefined,
      "SQL storage provider is not active (InMemory or connection factory not registered); skipped.",
    );

    expect(row.displayStatus).toBe("Not configured");
    expect(row.explanation).toMatch(/InMemory|demo/i);
  });
});
