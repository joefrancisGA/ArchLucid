import { describe, expect, it } from "vitest";

import {
  isHealthExceptionSeverity,
  selectHealthExceptionRows,
} from "@/lib/health-readiness-exceptions";
import { groupReadinessRows, presentReadinessRow } from "@/lib/health-readiness-presentation";

describe("isHealthExceptionSeverity", () => {
  it("treats healthy as the only non-exception severity", () => {
    expect(isHealthExceptionSeverity("healthy")).toBe(false);
    expect(isHealthExceptionSeverity("not-configured")).toBe(true);
    expect(isHealthExceptionSeverity("failing")).toBe(true);
  });
});

describe("selectHealthExceptionRows", () => {
  it("returns nothing when every check is healthy", () => {
    const groups = groupReadinessRows([
      { name: "database", status: "Healthy" },
      { name: "openai", status: "Healthy" },
    ]);

    expect(selectHealthExceptionRows(groups)).toEqual([]);
  });

  it("orders blocking states before optional gaps and tags the source group", () => {
    const groups = groupReadinessRows([
      { name: "database", status: "Healthy" },
      { name: "redis", status: "Skipped" },
      { name: "keyvault", status: "Unhealthy" },
      { name: "blob_storage", status: "Degraded" },
    ]);
    const exceptions = selectHealthExceptionRows(groups);

    expect(exceptions.map((exception) => exception.row.checkId)).toEqual([
      "keyvault",
      "blob_storage",
      "redis",
    ]);
    expect(exceptions[0]?.groupTitle).toBe("Integrations");
  });

  it("lists a dependency reported on two surfaces once", () => {
    const groups = groupReadinessRows([{ name: "redis", status: "Skipped" }]);
    const dependencyRow = presentReadinessRow("redis", "Not configured", undefined, "Not registered.");
    const exceptions = selectHealthExceptionRows(groups, [
      { row: dependencyRow, groupTitle: "Critical dependencies" },
    ]);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]?.groupTitle).toBe("Data stores");
  });

  it("keeps a dependency that has no matching readiness entry", () => {
    const dependencyRow = presentReadinessRow("redis", "Not configured", undefined, "Not registered.");
    const exceptions = selectHealthExceptionRows([], [
      { row: dependencyRow, groupTitle: "Critical dependencies" },
    ]);

    expect(exceptions).toHaveLength(1);
    expect(exceptions[0]?.row.displayStatus).toBe("Not applicable");
  });

  it("drops healthy extra rows", () => {
    const dependencyRow = presentReadinessRow("database", "Healthy");

    expect(
      selectHealthExceptionRows([], [{ row: dependencyRow, groupTitle: "Critical dependencies" }]),
    ).toEqual([]);
  });
});
