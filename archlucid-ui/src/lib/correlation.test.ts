import { afterEach, describe, expect, it } from "vitest";

import {
  TRACE_PARENT_HEADER,
  applyTraceParentHeader,
  captureTraceContextFromResponse,
  isValidTraceParent,
  readSessionTraceParent,
  storeSessionTraceParent,
} from "@/lib/correlation";

describe("correlation traceparent", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("validates W3C traceparent format", () => {
    expect(isValidTraceParent("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01")).toBe(true);
    expect(isValidTraceParent("not-a-traceparent")).toBe(false);
  });

  it("stores traceparent from API responses and reuses it on follow-on requests", () => {
    const traceParent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    const headers = new Headers({ [TRACE_PARENT_HEADER]: traceParent });
    const response = new Response(null, { headers });

    captureTraceContextFromResponse(response);

    expect(readSessionTraceParent()).toBe(traceParent);

    const outbound = new Headers();
    applyTraceParentHeader(outbound);

    expect(outbound.get(TRACE_PARENT_HEADER)).toBe(traceParent);
  });

  it("falls back to X-Trace-Id when traceparent is absent", () => {
    const traceId = "a1b2c3d4e5f678901234567890abcdef";
    const headers = new Headers({ "X-Trace-Id": traceId });
    const response = new Response(null, { headers });

    captureTraceContextFromResponse(response);

    expect(readSessionTraceParent()).toBe(`00-${traceId}-0000000000000001-01`);
  });

  it("clears invalid stored traceparent values", () => {
    storeSessionTraceParent("bad-value");
    storeSessionTraceParent(null);

    expect(readSessionTraceParent()).toBeNull();
  });
});
