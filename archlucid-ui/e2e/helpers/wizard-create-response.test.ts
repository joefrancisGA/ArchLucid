import { describe, expect, it } from "vitest";

import { parseWizardCreateResponse, parseWizardOperationResponse } from "./wizard-create-response";

describe("parseWizardCreateResponse", () => {
  it("parses a created run response", () => {
    expect(parseWizardCreateResponse('{"run":{"runId":"run-1"}}', 200, "application/json")).toEqual({
      run: { runId: "run-1" },
    });
  });

  it("labels an empty create response with response diagnostics", () => {
    expect(() => parseWizardCreateResponse("", 200, undefined)).toThrow(
      "[wizard-create-response] Create response was not valid JSON. Status: 200. Content type: missing. Body: <empty>.",
    );
  });

  it("parses a completed async operation response", () => {
    expect(
      parseWizardOperationResponse(
        '{"state":"Succeeded","resultRef":{"runId":"run-1"}}',
        200,
        "/api/proxy/v1/operations/run:run-1",
        "application/json",
      ),
    ).toEqual({
      state: "Succeeded",
      resultRef: { runId: "run-1" },
    });
  });

  it("labels an invalid async operation response with operation diagnostics", () => {
    expect(() =>
      parseWizardOperationResponse(
        "",
        502,
        "/api/proxy/v1/operations/run:run-1",
        undefined,
      ),
    ).toThrow(
      "[wizard-create-response] Operation response was not valid JSON. " +
        "Status: 502. URL: /api/proxy/v1/operations/run:run-1. " +
        "Content type: missing. Body: <empty>.",
    );
  });
});
