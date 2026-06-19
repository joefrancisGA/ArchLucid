import { afterEach, describe, expect, it } from "vitest";

import { TRACE_PARENT_HEADER } from "@/lib/correlation";
import { applyCorrelationHeaders } from "@/lib/api/http";

describe("http correlation headers (TB-335)", () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it("applies stored traceparent on outbound API requests", () => {
    const traceParent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
    sessionStorage.setItem("archlucid.session.traceparent", traceParent);

    const { headers } = applyCorrelationHeaders({ Accept: "application/json" });

    expect(headers.get(TRACE_PARENT_HEADER)).toBe(traceParent);
    expect(headers.get("X-Correlation-ID")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
