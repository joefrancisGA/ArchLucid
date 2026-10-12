import { describe, expect, it } from "vitest";

import {
  isArchitectureRequestCreateAcceptedResponse,
  isArchitectureRequestCreateJsonResponse,
  isArchitectureRequestCreateObservedResponse,
  readCreatedRunIdFromArchitectureRequestBody,
  readCreatedRunIdFromArchitectureRequestLocation,
  readCreatedRunIdFromArchitectureRequestResponse,
} from "./architecture-request-create-response";

const createProxyUrl = "http://localhost:3000/api/proxy/v1/architecture/request";
const createAsyncProxyUrl = `${createProxyUrl}/async`;

describe("isArchitectureRequestCreateJsonResponse", () => {
  it("accepts a JSON POST to the architecture request proxy", () => {
    expect(
      isArchitectureRequestCreateJsonResponse({
        url: createProxyUrl,
        method: "POST",
        contentType: "application/json; charset=utf-8",
      }),
    ).toBe(true);
  });

  it("rejects GET, non-request paths, and empty non-JSON bodies", () => {
    expect(
      isArchitectureRequestCreateJsonResponse({
        url: createProxyUrl,
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
        url: createAsyncProxyUrl,
        method: "POST",
        contentType: undefined,
      }),
    ).toBe(false);
  });
});

describe("isArchitectureRequestCreateAcceptedResponse", () => {
  it("accepts a 202 POST to the async architecture request proxy", () => {
    expect(
      isArchitectureRequestCreateAcceptedResponse({
        url: createAsyncProxyUrl,
        method: "POST",
        status: 202,
      }),
    ).toBe(true);
  });

  it("rejects non-create paths, non-POST, and non-202 statuses", () => {
    expect(
      isArchitectureRequestCreateAcceptedResponse({
        url: "http://localhost:3000/api/proxy/v1/architecture/draft",
        method: "POST",
        status: 202,
      }),
    ).toBe(false);

    expect(
      isArchitectureRequestCreateAcceptedResponse({
        url: createAsyncProxyUrl,
        method: "GET",
        status: 202,
      }),
    ).toBe(false);

    expect(
      isArchitectureRequestCreateAcceptedResponse({
        url: createAsyncProxyUrl,
        method: "POST",
        status: 200,
      }),
    ).toBe(false);
  });
});

describe("isArchitectureRequestCreateObservedResponse", () => {
  it("accepts either sync JSON or async 202 on the create proxy", () => {
    expect(
      isArchitectureRequestCreateObservedResponse({
        url: createProxyUrl,
        method: "POST",
        contentType: "application/json",
        status: 200,
      }),
    ).toBe(true);

    expect(
      isArchitectureRequestCreateObservedResponse({
        url: createAsyncProxyUrl,
        method: "POST",
        contentType: undefined,
        status: 202,
      }),
    ).toBe(true);
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

describe("readCreatedRunIdFromArchitectureRequestLocation", () => {
  it("reads the run handle from a 202 Location", () => {
    expect(
      readCreatedRunIdFromArchitectureRequestLocation(
        "/v1/operations/run:f200217e-83a9-40db-a5ef-54ef3a437c3e",
      ),
    ).toBe("f200217e-83a9-40db-a5ef-54ef3a437c3e");

    expect(
      readCreatedRunIdFromArchitectureRequestLocation(
        "http://localhost:3000/api/proxy/v1/operations/run:abc-1?x=1#y",
      ),
    ).toBe("abc-1");
  });

  it("rejects missing or non-run Locations", () => {
    expect(() => readCreatedRunIdFromArchitectureRequestLocation(undefined)).toThrow(/omitted Location/i);
    expect(() => readCreatedRunIdFromArchitectureRequestLocation("  ")).toThrow(/omitted Location/i);
    expect(() => readCreatedRunIdFromArchitectureRequestLocation("/v1/health")).toThrow(/omitted \/operations/i);
    expect(() => readCreatedRunIdFromArchitectureRequestLocation("/v1/operations/create:abc")).toThrow(
      /omitted run: handle/i,
    );
    expect(() => readCreatedRunIdFromArchitectureRequestLocation("/v1/operations/%E0%A4%A")).toThrow(
      /not decodable/i,
    );
  });
});

describe("readCreatedRunIdFromArchitectureRequestResponse", () => {
  it("prefers Location on 202 and JSON otherwise", () => {
    expect(
      readCreatedRunIdFromArchitectureRequestResponse({
        status: 202,
        bodyText: "",
        location: "/v1/operations/run:from-location",
      }),
    ).toBe("from-location");

    expect(
      readCreatedRunIdFromArchitectureRequestResponse({
        status: 200,
        bodyText: '{"run":{"runId":"from-json"}}',
        location: undefined,
      }),
    ).toBe("from-json");
  });
});
