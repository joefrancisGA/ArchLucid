import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validationMocks = vi.hoisted(() => ({
  validatePolicyPackContentDocument: vi.fn(),
}));

vi.mock("@/lib/api/policy-pack-validate-api", () => ({
  validatePolicyPackContentDocument: validationMocks.validatePolicyPackContentDocument,
}));

import { PolicyPackContentJsonEditor } from "@/components/policy/PolicyPackContentJsonEditor";
import { POLICY_PACK_CONTENT_JSON_VALIDATION_DEBOUNCE_MS } from "@/lib/use-policy-pack-content-json-validation";

describe("PolicyPackContentJsonEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    validationMocks.validatePolicyPackContentDocument.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows syntax errors immediately without calling the validate API", async () => {
    render(
      <PolicyPackContentJsonEditor
        id="policy-json"
        label="Policy JSON"
        testId="policy-json-editor"
        value="{ invalid"
        onChange={() => undefined}
      />,
    );

    expect(screen.getByTestId("policy-json-editor-validation-errors")).toBeInTheDocument();
    expect(validationMocks.validatePolicyPackContentDocument).not.toHaveBeenCalled();
  });

  it("debounces POST /v1/policy-packs/validate and renders warnings below the editor", async () => {
    validationMocks.validatePolicyPackContentDocument.mockResolvedValue({
      valid: true,
      summary: { complianceRuleKeyCount: 1 },
      issues: [{ kind: "Warning", message: "Unknown complianceRuleKey 'custom-rule'.", path: "complianceRuleKeys" }],
    });

    render(
      <PolicyPackContentJsonEditor
        id="policy-json"
        label="Policy JSON"
        testId="policy-json-editor"
        value={JSON.stringify({ complianceRuleKeys: ["custom-rule"] })}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByTestId("policy-json-editor-validating")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLICY_PACK_CONTENT_JSON_VALIDATION_DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(validationMocks.validatePolicyPackContentDocument).toHaveBeenCalledOnce();
    expect(screen.getByTestId("policy-json-editor-validation-warnings")).toHaveTextContent("Unknown complianceRuleKey");
    expect(screen.getByTestId("policy-json-editor-validation-valid")).toHaveTextContent("Valid policy pack JSON");
  });
});
