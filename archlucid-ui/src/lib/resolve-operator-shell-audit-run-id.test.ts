import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveOperatorShellAuditRunId } from "@/lib/resolve-operator-shell-audit-run-id";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

describe("resolveOperatorShellAuditRunId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers runId query params over pathname and workspace memory", () => {
    const resolved = resolveOperatorShellAuditRunId({
      pathname: "/architecture/reviews/other-run",
      search: "?runId=from-query",
      workspaceActiveRunId: "workspace-run",
    });

    expect(resolved).toBe("from-query");
  });

  it("uses review detail pathname when query is absent", () => {
    const resolved = resolveOperatorShellAuditRunId({
      pathname: "/architecture/reviews/run-from-path",
      search: "",
      workspaceActiveRunId: null,
    });

    expect(resolved).toBe("run-from-path");
  });

  it("falls back to showcase run in buyer-polished shell", () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "");

    const resolved = resolveOperatorShellAuditRunId({
      pathname: "/",
      search: "",
      workspaceActiveRunId: null,
    });

    expect(resolved).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);
  });
});
