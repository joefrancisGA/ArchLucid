import { describe, expect, it } from "vitest";

import { shouldTraceProxyInteractiveReadHang } from "@/lib/proxy/should-trace-proxy-interactive-read-hang";

describe("shouldTraceProxyInteractiveReadHang", () => {
  it("traces learning plan list GETs", () => {
    expect(shouldTraceProxyInteractiveReadHang("GET", "v1/learning/plans")).toBe(true);
  });

  it("traces architecture draft GETs by id", () => {
    expect(
      shouldTraceProxyInteractiveReadHang(
        "GET",
        "v1/architecture/draft/cf9ddef7-3a8b-4e10-aebb-79302e7c691c",
      ),
    ).toBe(true);
  });

  it("does not trace nested draft routes or non-GET methods", () => {
    expect(
      shouldTraceProxyInteractiveReadHang(
        "GET",
        "v1/architecture/draft/cf9ddef7-3a8b-4e10-aebb-79302e7c691c/questions",
      ),
    ).toBe(false);
    expect(shouldTraceProxyInteractiveReadHang("POST", "v1/learning/plans")).toBe(false);
    expect(shouldTraceProxyInteractiveReadHang("GET", "v1/authority/projects/default/reviews")).toBe(
      false,
    );
  });
});
