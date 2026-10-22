import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { trySandboxMockJsonForApiGet } from "@/lib/sandbox-api-mocks";

describe("sandbox-api-mocks", () => {
  let prior: string | undefined;

  beforeEach(() => {
    prior = process.env.VITE_USE_SANDBOX_MOCKS;
  });

  afterEach(() => {
    process.env.VITE_USE_SANDBOX_MOCKS = prior;
  });

  it("returns undefined when VITE_USE_SANDBOX_MOCKS is unset", () => {
    delete process.env.VITE_USE_SANDBOX_MOCKS;

    expect(trySandboxMockJsonForApiGet("/v1/architecture/reviews")).toBeUndefined();
    expect(trySandboxMockJsonForApiGet("/v1/audit/search")).toBeUndefined();
  });

  it("returns undefined when flag is not true", () => {
    process.env.VITE_USE_SANDBOX_MOCKS = "false";

    expect(trySandboxMockJsonForApiGet("/v1/architecture/reviews")).toBeUndefined();
  });

  it("returns coordinator runs page for GET /v1/architecture/reviews when enabled", () => {
    process.env.VITE_USE_SANDBOX_MOCKS = "true";
    const body = trySandboxMockJsonForApiGet("/v1/architecture/reviews?take=50");

    expect(body).toMatchObject({
      hasMore: false,
      nextCursor: null,
      requestedTake: 50,
    });
    expect((body as { items: unknown[] }).items.length).toBe(3);
  });

  it("returns audit cursor page for /v1/audit and /v1/audit/search when enabled", () => {
    process.env.VITE_USE_SANDBOX_MOCKS = "1";

    const a = trySandboxMockJsonForApiGet("/v1/audit");
    const b = trySandboxMockJsonForApiGet("/v1/audit/search?take=25");

    expect(a).toEqual(b);
    expect((a as { items: { eventId: string }[] }).items).toHaveLength(5);
  });

  it("returns authority paged runs for project paths when enabled", () => {
    process.env.VITE_USE_SANDBOX_MOCKS = "true";
    const body = trySandboxMockJsonForApiGet("/v1/authority/projects/acme/reviews?page=1&pageSize=50");

    expect(body).toMatchObject({
      totalCount: 3,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    const items = (body as { items: { projectId: string }[] }).items;

    expect(items.every((row) => row.projectId === "acme")).toBe(true);
  });

  it("does not intercept unrelated audit routes", () => {
    process.env.VITE_USE_SANDBOX_MOCKS = "true";

    expect(trySandboxMockJsonForApiGet("/v1/audit/export?fromUtc=x&toUtc=y")).toBeUndefined();
    expect(trySandboxMockJsonForApiGet("/v1/audit/event-types")).toBeUndefined();
  });

  it("imports sandbox-mock-data.json with a Node ESM import attribute", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/sandbox-api-mocks.ts"), "utf8");

    expect(source).toContain('with { type: "json" }');
  });

  it("does not intercept architecture run sub-resources", () => {
    process.env.VITE_USE_SANDBOX_MOCKS = "true";

    expect(
      trySandboxMockJsonForApiGet("/v1/architecture/reviews/sandbox-run-golden-001/provenance"),
    ).toBeUndefined();
  });
});
