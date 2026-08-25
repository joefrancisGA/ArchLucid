import { describe, expect, it } from "vitest";

import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

import {
  isLiveAuthorityRunId,
  shouldSkipLiveAuthorityRunScopedApi,
} from "./run-scoped-live-api";

describe("run-scoped-live-api", () => {
  it("treats GUID run ids as live authority keys", () => {
    expect(isLiveAuthorityRunId("6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c502")).toBe(true);
  });

  it("treats showcase slugs as non-live authority keys", () => {
    expect(isLiveAuthorityRunId(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(false);
  });

  it("skips live API for curated showcase slugs", () => {
    expect(shouldSkipLiveAuthorityRunScopedApi(CUSTOMER_INTAKE_SAMPLE_RUN_ID)).toBe(true);
  });
});
