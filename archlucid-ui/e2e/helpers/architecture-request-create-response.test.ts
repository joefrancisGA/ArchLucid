import { describe, expect, it } from "vitest";

import {
  isArchitectureRequestCreateResponse,
  readCreatedRunIdFromArchitectureRequestBody,
  readCreatedRunIdFromArchitectureRequestCreate,
} from "./architecture-request-create-response";

describe("isArchitectureRequestCreateResponse", () => {
  it("accepts sync and async create POSTs, including empty 202 bodies", () => {
    expect(
      isArchitectureRequestCreateResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request",
        method: "POST",
      }),
    ).toBe(true);

    expect(
      isArchitectureRequestCreateResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request/async",
        method: "POST",
      }),
    ).toBe(true);
  });

  it("rejects GET, draft, and idempotency siblings", () => {
    expect(
      isArchitectureRequestCreateResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request",
        method: "GET",
      }),
    ).toBe(false);

    expect(
      isArchitectureRequestCreateResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request/draft",
        method: "POST",
      }),
    ).toBe(false);

    expect(
      isArchitectureRequestCreateResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/request/idempotency",
        method: "POST",
      }),
    ).toBe(false);
  });
});

describe("readCreatedRunIdFromArchitectureRequestCreate", () => {
  it("reads run.runId from JSON and from a 202 Location header", () => {
    expect(
      readCreatedRunIdFromArchitectureRequestCreate({
        status: 201,
        bodyText: '{"run":{"runId":"abc"}}',
        location: null,
      }),
    ).toBe("abc");

    expect(
      readCreatedRunIdFromArchitectureRequestCreate({
        status: 202,
        bodyText: "",
        location: "/v1/operations/run:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      }),
    ).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  });

  it("fails fast when both body and Location omit the run id", () => {
    expect(() =>
      readCreatedRunIdFromArchitectureRequestCreate({
        status: 202,
        bodyText: "",
        location: undefined,
      }),
    ).toThrow(/omitted run id/i);
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
