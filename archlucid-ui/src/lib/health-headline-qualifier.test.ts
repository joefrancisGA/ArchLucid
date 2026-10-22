import { describe, expect, it } from "vitest";

import { buildHealthHeadlineQualifier } from "@/lib/health-headline-qualifier";
import type { HealthExceptionRow } from "@/lib/health-readiness-exceptions";
import { presentReadinessRow } from "@/lib/health-readiness-presentation";

function exception(checkId: string, status: string): HealthExceptionRow {
  return { row: presentReadinessRow(checkId, status), groupTitle: "Data stores" };
}

describe("buildHealthHeadlineQualifier", () => {
  it("returns no qualifier when nothing is outstanding", () => {
    const qualifier = buildHealthHeadlineQualifier([]);

    expect(qualifier.text).toBeNull();
    expect(qualifier.attentionCount).toBe(0);
    expect(qualifier.notConfiguredCount).toBe(0);
  });

  it("qualifies a healthy headline when an optional dependency is unconfigured", () => {
    const qualifier = buildHealthHeadlineQualifier([exception("redis", "Skipped")]);

    expect(qualifier.text).toBe("1 optional dependency is not configured");
    expect(qualifier.notConfiguredCount).toBe(1);
  });

  it("pluralises unconfigured dependencies", () => {
    const qualifier = buildHealthHeadlineQualifier([
      exception("redis", "Skipped"),
      exception("keyvault", "Not configured"),
    ]);

    expect(qualifier.text).toBe("2 optional dependencies are not configured");
  });

  it("names checks needing attention before optional gaps", () => {
    const qualifier = buildHealthHeadlineQualifier([
      exception("blob_storage", "Degraded"),
      exception("redis", "Skipped"),
    ]);

    expect(qualifier.text).toBe("1 check needs attention · 1 optional dependency is not configured");
    expect(qualifier.attentionCount).toBe(1);
  });

  it("pluralises checks needing attention", () => {
    const qualifier = buildHealthHeadlineQualifier([
      exception("blob_storage", "Degraded"),
      exception("openai", "Unhealthy"),
    ]);

    expect(qualifier.text).toBe("2 checks need attention");
  });
});
