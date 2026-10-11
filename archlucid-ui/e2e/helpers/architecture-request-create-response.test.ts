import { describe, expect, it } from "vitest";

import {
  isArchitectureRequestCreateJsonResponse,
  readCreatedRunIdFromArchitectureRequestBody,
} from "./architecture-request-create-response";

describe("isArchitectureRequestCreateJsonResponse", () => {
  it("accepts a JSON POST to the architecture request proxy", () => {
    expect(
      isArchitectureRequestCreateJsonResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request",
        method: "POST",
        contentType: "application/json; charset=utf-8",
      }),
    ).toBe(true);
  });

  it("rejects GET, non-request paths, and empty non-JSON bodies", () => {
    expect(
      isArchitectureRequestCreateJsonResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request",
        method: "GET",
        contentType: "application/json",
      }),
    ).toBe(false);

    expect(
      isArchitectureRequestCreateJsonResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/draft",
        method: "POST",
        contentType: "application/json",
      }),
    ).toBe(false);

    expect(
      isArchitectureRequestCreateJsonResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request",
        method: "POST",
        contentType: undefined,
      }),
    ).toBe(false);
  });
});

describe("readCreatedRunIdFromArchitectureRequestBody", () => {
  it("reads run.runId from JSON", () => {
    expect(readCreatedRunIdFromArchitectureRequestBody('{"run":{"runId":"abc"}}')).toBe("abc");
  });

  it("rejects empty bodies and missing run ids", () => {
    expect(() => readCreatedRunIdFromArchitectureRequestBody("  ")).toThrow(/empty body/i);
    expect(() => readCreatedRunIdFromArchitectureRequestBody("{}")).toThrow(/omitted run.runId/i);
  });
});
