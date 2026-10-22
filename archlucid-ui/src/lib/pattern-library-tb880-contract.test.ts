import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("pattern-library TB-880 contract", () => {
  it("PatternInsightCard OpenAPI schema exposes only k-anon aggregate fields", () => {
    const snapshotPath = path.resolve(
      __dirname,
      "../../../ArchLucid.Api.Tests/Contracts/buyer-contract.openapi.snapshot.json",
    );
    const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")) as {
      components?: {
        schemas?: Record<string, { properties?: Record<string, unknown> }>;
      };
    };

    const properties = snapshot.components?.schemas?.PatternInsightCard?.properties ?? {};

    expect(Object.keys(properties).sort()).toEqual(
      ["contributingTenantCount", "industryVertical", "patternKey", "summary"].sort(),
    );
    expect(properties).not.toHaveProperty("tenantId");
    expect(properties).not.toHaveProperty("tenantIds");
  });
});
