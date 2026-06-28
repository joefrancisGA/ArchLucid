import { describe, expect, it } from "vitest";

import { FORTHCOMING_CLOUD_PROVIDER_ROWS } from "@/lib/forthcoming-cloud-provider-rows";

describe("forthcoming-cloud-provider-rows", () => {
  it("lists AWS and GCP admin diagnostic rows pointing at customer cloud connections", () => {
    expect(FORTHCOMING_CLOUD_PROVIDER_ROWS.map((row) => row.id)).toEqual(["aws", "gcp"]);

    for (const row of FORTHCOMING_CLOUD_PROVIDER_ROWS) {
      expect(row.description).toContain("/integrations/cloud-connections");
      expect(row.description.toLowerCase()).not.toContain("planned for v1.1");
    }
  });
});
