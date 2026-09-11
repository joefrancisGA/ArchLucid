import { describe, expect, it } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
import {
  INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
  isInfraEvidenceMermaidServerPngUnavailableError,
} from "@/lib/infra-evidence/infra-evidence-mermaid-png-unavailable";

describe("isInfraEvidenceMermaidServerPngUnavailableError", () => {
  it("returns true for HTTP 400 with the server PNG unavailable detail", () => {
    const error = new ApiRequestError(
      `Request validation failed (HTTP 400): ${INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE}`,
      {
        httpStatus: 400,
        correlationId: null,
        problem: {
          title: "Validation failed",
          detail: INFRA_EVIDENCE_MERMAID_SERVER_PNG_UNAVAILABLE_MESSAGE,
        },
      },
    );

    expect(isInfraEvidenceMermaidServerPngUnavailableError(error)).toBe(true);
  });

  it("returns false for other HTTP statuses", () => {
    const error = new ApiRequestError("Not found", {
      httpStatus: 404,
      correlationId: null,
      problem: { title: "Not found", detail: "Snapshot missing." },
    });

    expect(isInfraEvidenceMermaidServerPngUnavailableError(error)).toBe(false);
  });
});
