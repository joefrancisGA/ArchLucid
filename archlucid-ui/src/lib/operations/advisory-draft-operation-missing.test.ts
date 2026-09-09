import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  advisoryDraftOperationMissingMessage,
  isAdvisoryDraftOperationMissingError,
} from "@/lib/operations/advisory-draft-operation-missing";
import { GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_OPERATION_MISSING } from "@/lib/guided-intake-copy";

describe("advisory-draft-operation-missing", () => {
  it("detects 404 ApiRequestError as missing operation", () => {
    expect(
      isAdvisoryDraftOperationMissingError(
        new ApiRequestError("not found", {
          problem: null,
          correlationId: null,
          httpStatus: 404,
        }),
      ),
    ).toBe(true);
  });

  it("returns honest recovery copy", () => {
    expect(advisoryDraftOperationMissingMessage()).toBe(
      GUIDED_INTAKE_STRUCTURED_BRIEF_SUGGEST_OPERATION_MISSING,
    );
  });
});
