import { describe, expect, it } from "vitest";

import { FORTHCOMING_CLOUD_PROVIDER_ROWS } from "@/lib/forthcoming-cloud-provider-rows";

describe("forthcoming-cloud-provider-rows (TB-343)", () => {
  it("lists AWS and GCP as honest V1.1 placeholders", () => {
    expect(FORTHCOMING_CLOUD_PROVIDER_ROWS.map((row) => row.id)).toEqual(["aws", "gcp"]);
    expect(FORTHCOMING_CLOUD_PROVIDER_ROWS.every((row) => row.description.includes("V1.1"))).toBe(true);
  });

  it("does not imply multi-cloud connectors ship in V1", () => {
    for (const row of FORTHCOMING_CLOUD_PROVIDER_ROWS) {
      expect(row.description.toLowerCase()).toContain("planned");
    }
  });
});
