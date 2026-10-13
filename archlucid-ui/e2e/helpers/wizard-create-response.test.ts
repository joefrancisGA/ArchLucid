import { describe, expect, it } from "vitest";

import {
  interpretWizardCreateOperation,
  parseWizardCreateResponse,
  parseWizardOperationResponse,
} from "./wizard-create-response";

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

describe("interpretWizardCreateOperation", () => {
  it("treats Pending Creating review as ready so TB-927 does not wait for execute Succeeded", () => {
    expect(
      interpretWizardCreateOperation({
        state: "Pending",
        stepLabel: "Creating review",
        resultRef: { runId: "868a3e6a-a366-4934-be82-9d8cf35b4135" },
      }),
    ).toBe("ready");
  });

  it("treats Succeeded as ready", () => {
    expect(
      interpretWizardCreateOperation({
        state: "Succeeded",
        stepLabel: "Committed",
        resultRef: { runId: "run-1" },
      }),
    ).toBe("ready");
  });

  it("waits while async create is still coordinating snapshots", () => {
    expect(
      interpretWizardCreateOperation({
        state: "Pending",
        stepLabel: "Reading architecture evidence",
        resultRef: { runId: "run-1" },
      }),
    ).toBe("wait");
  });

  it("fails when the operation is Failed or Canceled", () => {
    expect(
      interpretWizardCreateOperation({
        state: "Failed",
        stepLabel: "Execute failed",
        resultRef: { runId: "9e76a8ca-448a-477c-aa47-6925afc0e4b8" },
      }),
    ).toBe("failed");

    expect(
      interpretWizardCreateOperation({
        state: "Canceled",
        stepLabel: "Canceled",
        resultRef: { runId: "run-1" },
      }),
    ).toBe("failed");
  });
});
