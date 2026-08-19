import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import { sanitizeHostedAzureValidationError } from "@/lib/sanitize-hosted-azure-validation-error";

function apiError(httpStatus: number, detail: string): ApiRequestError {
  return new ApiRequestError(detail, {
    problem: { detail, title: "Error", status: httpStatus, type: "about:blank" },
    correlationId: null,
    httpStatus,
  });
}

describe("sanitizeHostedAzureValidationError", () => {
  it("explains feature disabled without implying Azure app registration is enough", () => {
    const result = sanitizeHostedAzureValidationError(
      apiError(503, "Hosted Azure extractor is disabled (HostedAzureExtractor:Enabled=false)."),
    );

    expect(result.message).toMatch(/not enabled/i);
    expect(result.message).toMatch(/app registration/i);
  });

  it("asks operators to save the connection when configuration is missing", () => {
    const result = sanitizeHostedAzureValidationError(
      apiError(404, "No hosted Azure extractor configuration exists for this tenant and subscription."),
    );

    expect(result.message).toMatch(/saved Azure connection/i);
  });

  it("clarifies Reader and federation when ARM returns forbidden", () => {
    const result = sanitizeHostedAzureValidationError(
      apiError(422, "Response status code does not indicate success: 403 (Forbidden)."),
    );

    expect(result.message).toMatch(/Reader/i);
    expect(result.message).toMatch(/federated credential/i);
    expect(result.reason).toBe("permission");
  });

  it("points at federation when token exchange fails", () => {
    const result = sanitizeHostedAzureValidationError(
      apiError(500, "Client assertion authentication failed (AADSTS70021)."),
    );

    expect(result.message).toMatch(/Federated sign-in/i);
    expect(result.message).toMatch(/app registration alone is not enough/i);
    expect(result.reason).toBe("federation");
  });

  it("does not classify a bare HTTP 500 as federation", () => {
    const result = sanitizeHostedAzureValidationError(apiError(500, "Unexpected host fault."));

    expect(result.reason).toBe("unknown");
    expect(result.message).not.toMatch(/Federated sign-in/i);
  });

  it("classifies stack traces as unknown", () => {
    const result = sanitizeHostedAzureValidationError(
      new Error("System.InvalidOperationException: at ArchLucid.Host.Core.Services.Foo.Bar()"),
    );

    expect(result.reason).toBe("unknown");
    expect(result.message).toMatch(/Validation could not be completed/i);
  });

  it("does not treat the generic fallback copy as a federation failure", () => {
    const result = sanitizeHostedAzureValidationError(new Error(""));

    expect(result.reason).toBe("unknown");
  });
});
