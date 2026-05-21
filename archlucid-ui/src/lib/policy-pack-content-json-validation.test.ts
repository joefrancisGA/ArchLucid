import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resetPolicyPackContentJsonValidatorCacheForTests,
  validatePolicyPackContentJson,
} from "@/lib/policy-pack-content-json-validation";

vi.mock("@/lib/api/policy-pack-content-schema-api", () => ({
  getPolicyPackContentDocumentJsonSchema: vi.fn(async () => ({
    schema: {
      type: "object",
      properties: {
        complianceRuleIds: {
          type: "array",
          items: { type: "string", format: "uuid" },
        },
      },
      additionalProperties: true,
    },
  })),
}));

describe("validatePolicyPackContentJson", () => {
  afterEach(() => {
    resetPolicyPackContentJsonValidatorCacheForTests();
    vi.clearAllMocks();
  });

  it("returns no issues for empty editor", async () => {
    const issues = await validatePolicyPackContentJson("   ");

    expect(issues).toEqual([]);
  });

  it("reports syntax errors before schema validation", async () => {
    const issues = await validatePolicyPackContentJson("{ not-json");

    expect(issues).toHaveLength(1);
    expect(issues[0]?.kind).toBe("syntax");
  });

  it("reports schema violations for invalid property values", async () => {
    const issues = await validatePolicyPackContentJson(
      JSON.stringify({ complianceRuleIds: ["not-a-uuid"] }),
    );

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.kind).toBe("schema");
  });

  it("accepts JSON that matches the fetched schema", async () => {
    const issues = await validatePolicyPackContentJson(
      JSON.stringify({ complianceRuleIds: ["550e8400-e29b-41d4-a716-446655440000"] }),
    );

    expect(issues).toEqual([]);
  });
});
