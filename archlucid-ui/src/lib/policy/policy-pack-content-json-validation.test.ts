import { describe, expect, it, vi } from "vitest";

import { validatePolicyPackContentDocument } from "@/lib/api/policy-pack-validate-api";

import { validatePolicyPackContentJson } from "@/lib/policy/policy-pack-content-json-validation";

vi.mock("@/lib/api/policy-pack-validate-api", () => ({
  validatePolicyPackContentDocument: vi.fn(),
}));

const validateApiMock = vi.mocked(validatePolicyPackContentDocument);

describe("validatePolicyPackContentJson", () => {
  it("returns no issues for empty editor", async () => {
    const result = await validatePolicyPackContentJson("   ");

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(validateApiMock).not.toHaveBeenCalled();
  });

  it("reports syntax errors before calling the validate API", async () => {
    const result = await validatePolicyPackContentJson("{ not-json");

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.kind).toBe("syntax");
    expect(validateApiMock).not.toHaveBeenCalled();
  });

  it("maps server validation errors from POST /v1/policy-packs/validate", async () => {
    validateApiMock.mockResolvedValueOnce({
      valid: false,
      issues: [{ kind: "Error", message: "ComplianceRuleIds must not contain empty GUIDs.", path: "complianceRuleIds" }],
    });

    const result = await validatePolicyPackContentJson(JSON.stringify({ complianceRuleIds: ["00000000-0000-0000-0000-000000000000"] }));

    expect(validateApiMock).toHaveBeenCalledOnce();
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        kind: "error",
        message: "ComplianceRuleIds must not contain empty GUIDs.",
        path: "complianceRuleIds",
      },
    ]);
  });

  it("maps unknown compliance rule keys as warnings", async () => {
    validateApiMock.mockResolvedValueOnce({
      valid: true,
      summary: { complianceRuleKeyCount: 1 },
      issues: [{ kind: "Warning", message: "Unknown complianceRuleKey 'custom-rule'.", path: "complianceRuleKeys" }],
    });

    const result = await validatePolicyPackContentJson(JSON.stringify({ complianceRuleKeys: ["custom-rule"] }));

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([
      {
        kind: "warning",
        message: "Unknown complianceRuleKey 'custom-rule'.",
        path: "complianceRuleKeys",
      },
    ]);
  });

  it("accepts valid documents with summary counts", async () => {
    validateApiMock.mockResolvedValueOnce({
      valid: true,
      summary: {
        complianceRuleKeyCount: 1,
        alertRuleIdCount: 0,
        advisoryDefaultCount: 0,
      },
      issues: [],
    });

    const result = await validatePolicyPackContentJson(
      JSON.stringify({ complianceRuleKeys: ["network-must-have-security-baseline"] }),
    );

    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.summary?.complianceRuleKeyCount).toBe(1);
  });
});
