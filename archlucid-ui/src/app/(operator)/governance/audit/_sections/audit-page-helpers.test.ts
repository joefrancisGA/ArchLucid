import { describe, expect, it } from "vitest";

import {
  resolveAuditScopedRunId,
  shouldDeferAuditAutoSearch,
} from "./audit-page-helpers";

describe("resolveAuditScopedRunId", () => {
  it("prefers explicit runId query param", () => {
    const scoped = resolveAuditScopedRunId({
      urlRunId: "review-from-url",
      pathname: "/governance/audit",
      search: "runId=review-from-url",
      workspaceActiveRunId: "workspace-review",
    });

    expect(scoped).toBe("review-from-url");
  });

  it("falls back to review path when query param is absent", () => {
    const scoped = resolveAuditScopedRunId({
      urlRunId: "",
      pathname: "/architecture/reviews/review-from-path",
      search: "",
      workspaceActiveRunId: "workspace-review",
    });

    expect(scoped).toBe("review-from-path");
  });

  it("falls back to workspace active review when URL and path lack runId", () => {
    const scoped = resolveAuditScopedRunId({
      urlRunId: "",
      pathname: "/governance/audit",
      search: "",
      workspaceActiveRunId: "workspace-review",
    });

    expect(scoped).toBe("workspace-review");
  });
});

describe("shouldDeferAuditAutoSearch", () => {
  it("does not defer when no scoped review is expected", () => {
    expect(shouldDeferAuditAutoSearch("", "")).toBe(false);
    expect(shouldDeferAuditAutoSearch("stale", "")).toBe(false);
  });

  it("defers until runId state matches scoped review", () => {
    expect(shouldDeferAuditAutoSearch("", "review-a")).toBe(true);
    expect(shouldDeferAuditAutoSearch("review-b", "review-a")).toBe(true);
    expect(shouldDeferAuditAutoSearch("review-a", "review-a")).toBe(false);
  });
});
