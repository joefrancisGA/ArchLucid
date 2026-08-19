import { describe, expect, it } from "vitest";

import { buildCriticalDependencyRows } from "@/lib/system-health-critical-dependencies";

describe("buildCriticalDependencyRows", () => {
  it("maps known readiness entries and marks missing redis as not configured", () => {
    const rows = buildCriticalDependencyRows([
      { name: "database", status: "Healthy" },
      { name: "openai", status: "Unhealthy" },
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0]?.label).toBe("SQL Server");
    expect(rows[0]?.status).toBe("Healthy");
    expect(rows[1]?.status).toBe("Unhealthy");
    expect(rows[2]?.entryName).toBe("redis");
    expect(rows[2]?.status).toBe("Not configured");
  });
});
