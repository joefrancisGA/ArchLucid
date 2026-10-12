import { describe, expect, it } from "vitest";

import { parseWizardCreateResponse } from "./wizard-create-response";

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
});
