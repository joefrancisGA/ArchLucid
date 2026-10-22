import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/demo-run",
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "workspace-run-id" }),
}));

describe("useOperatorShellAuditRunId", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/architecture/reviews/demo-run");
  });

  it("prefers runId from the committed query string", () => {
    window.history.replaceState(null, "", "/architecture/reviews/demo-run?runId=query-run-id");

    const { result } = renderHook(() => useOperatorShellAuditRunId());

    expect(result.current).toBe("query-run-id");
  });

  it("falls back to the pathname review id when the query omits runId", () => {
    const { result } = renderHook(() => useOperatorShellAuditRunId());

    expect(result.current).toBe("demo-run");
  });

  it("updates from popstate without subscribing to useSearchParams", async () => {
    const { result } = renderHook(() => useOperatorShellAuditRunId());

    expect(result.current).toBe("demo-run");

    window.history.replaceState(null, "", "/architecture/reviews/demo-run?runId=popstate-run-id");
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(result.current).toBe("popstate-run-id");
    });
  });
});
