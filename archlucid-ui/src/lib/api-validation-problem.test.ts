import { describe, expect, it } from "vitest";

import {
  buildValidationProblemDisplayCopy,
  formatValidationFieldKey,
  formatValidationFailureSummary,
  isHttpRequestValidationFailure,
  parseAspNetValidationFieldErrors,
  sanitizeOperatorFacingText,
} from "./api-validation-problem";

describe("sanitizeOperatorFacingText", () => {
  it("removes .NET stack trace lines from operator-facing text", () => {
    const raw = [
      "Description must not exceed 4000 characters.",
      "   at ArchLucid.Api.Validators.ArchitectureRequestValidator.Validate()",
      "   at FluentValidation.AbstractValidator`1.Validate()",
    ].join("\n");

    expect(sanitizeOperatorFacingText(raw)).toBe("Description must not exceed 4000 characters.");
  });

  it("keeps exception message without stack frames", () => {
    expect(
      sanitizeOperatorFacingText("System.InvalidOperationException: Request body is required.\n   at Foo.Bar()"),
    ).toBe("Request body is required.");
  });
});

describe("parseAspNetValidationFieldErrors", () => {
  it("preserves field keys and messages from ASP.NET errors object", () => {
    const fields = parseAspNetValidationFieldErrors({
      Description: ["Description must not exceed 4000 characters."],
      RequestId: ["RequestId is required."],
    });

    expect(fields).toEqual([
      {
        field: "Description",
        messages: ["Description must not exceed 4000 characters."],
      },
      {
        field: "RequestId",
        messages: ["RequestId is required."],
      },
    ]);
  });
});

describe("formatValidationFieldKey", () => {
  it("maps empty model-level keys to request body", () => {
    expect(formatValidationFieldKey("")).toBe("request body");
    expect(formatValidationFieldKey("request")).toBe("request body");
  });

  it("camelCases property names for operator display", () => {
    expect(formatValidationFieldKey("Description")).toBe("description");
    expect(formatValidationFieldKey("Documents[0].ContentType")).toBe("documents[0].ContentType");
  });
});

describe("isHttpRequestValidationFailure", () => {
  it("returns true for HTTP 400 with field errors", () => {
    expect(
      isHttpRequestValidationFailure(400, {
        title: "One or more validation errors occurred.",
        fieldErrors: [{ field: "Description", messages: ["Too long."] }],
      }),
    ).toBe(true);
  });

  it("returns false for HTTP 403", () => {
    expect(isHttpRequestValidationFailure(403, { title: "Forbidden" })).toBe(false);
  });
});

describe("buildValidationProblemDisplayCopy", () => {
  it("includes endpoint line and field-scoped messages", () => {
    const copy = buildValidationProblemDisplayCopy(
      {
        title: "One or more validation errors occurred.",
        status: 400,
        instance: "/v1/architecture/request",
        fieldErrors: [{ field: "Description", messages: ["Description must not exceed 4000 characters."] }],
      },
      { httpStatus: 400 },
    );

    expect(copy.heading).toBe("Request validation failed (HTTP 400)");
    expect(copy.endpointLine).toContain("POST /v1/architecture/request");
    expect(copy.fieldErrors[0]?.messages[0]).toContain("4000 characters");
  });
});

describe("formatValidationFailureSummary", () => {
  it("joins heading with field messages for logs", () => {
    expect(
      formatValidationFailureSummary(
        {
          title: "One or more validation errors occurred.",
          fieldErrors: [{ field: "Description", messages: ["Description must not exceed 4000 characters."] }],
        },
        400,
      ),
    ).toBe(
      "Request validation failed (HTTP 400): description: Description must not exceed 4000 characters.",
    );
  });
});
