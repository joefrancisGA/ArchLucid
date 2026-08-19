import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE,
  isArchitectureRequestCreateGatewayTimeout,
} from "@/lib/api/architecture-request-create-guard";

describe("architecture-request-create-guard", () => {
  it("treats 504 and 408 as gateway timeouts", () => {
    expect(isArchitectureRequestCreateGatewayTimeout(504)).toBe(true);
    expect(isArchitectureRequestCreateGatewayTimeout(408)).toBe(true);
    expect(isArchitectureRequestCreateGatewayTimeout(503)).toBe(false);
  });

  it("treats proxy 502 AbortSignal timeout as create gateway timeout", () => {
    expect(
      isArchitectureRequestCreateGatewayTimeout(502, {
        detail: "POST /v1/architecture/request timed out after 60s. Cause: The operation was aborted due to timeout",
      }),
    ).toBe(true);
    expect(isArchitectureRequestCreateGatewayTimeout(502, { detail: "fetch failed" })).toBe(false);
    expect(isArchitectureRequestCreateGatewayTimeout(502)).toBe(false);
  });

  it("exposes operator guidance for duplicate-safe recovery", () => {
    expect(ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE).toContain("Reviews list");
    expect(ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE).toContain("avoid duplicates");
    expect(ARCHITECTURE_REQUEST_CREATE_TIMEOUT_MESSAGE).toContain("POST /v1/architecture/request");
  });
});
