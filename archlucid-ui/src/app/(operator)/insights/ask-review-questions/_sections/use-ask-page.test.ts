import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConversationThread } from "@/types/conversation";

import { useAskPage } from "./use-ask-page";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useThreads: vi.fn(),
  getMessages: vi.fn(),
}));
const router = { replace: mocks.replace };
const searchParams = new URLSearchParams("thread=requested");

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
vi.mock("@/hooks/use-conversation-threads-query", () => ({
  useConversationThreadsQuery: mocks.useThreads,
}));
vi.mock("@/hooks/use-working-insights-architecture-bind", () => ({
  useWorkingInsightsArchitectureBind: () => ({ bindPending: false, bindResult: null }),
}));
vi.mock("@/hooks/use-working-finding-inspect-href-options", () => ({
  useWorkingFindingInspectHrefOptions: () => undefined,
}));
vi.mock("@/lib/conversation-api", () => ({
  getConversationMessages: mocks.getMessages,
}));

const requestedThread: ConversationThread = {
  threadId: "requested",
  tenantId: "tenant",
  workspaceId: "workspace",
  projectId: "project",
  runId: "run",
  title: "Requested thread",
  lastUpdatedUtc: "2026-02-01T00:00:00Z",
  createdUtc: "2026-01-01T00:00:00Z",
};
const refetch = vi.fn();

describe("useAskPage conversation list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMessages.mockResolvedValue([]);
  });

  it("opens the requested thread without rewriting the URL when the list is already cached", async () => {
    mocks.useThreads.mockReturnValue({ data: [requestedThread], isError: false, refetch });

    const { result } = renderHook(() => useAskPage());

    await waitFor(() => expect(result.current.selectedThreadId).toBe("requested"));
    expect(mocks.getMessages).toHaveBeenCalledWith("requested");
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("preserves the thread link when the initial list request fails", () => {
    mocks.useThreads.mockReturnValue({
      data: undefined,
      isError: true,
      error: new Error("Could not load conversations"),
      refetch,
    });

    renderHook(() => useAskPage());

    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("exposes an initial list failure and clears it when the list recovers", async () => {
    mocks.useThreads.mockReturnValue({
      data: undefined,
      isError: true,
      error: new Error("Could not load conversations"),
      refetch,
    });
    const { result, rerender } = renderHook(() => useAskPage());

    expect(result.current.listFailure?.message).toBe("Could not load conversations");

    mocks.useThreads.mockReturnValue({ data: [requestedThread], isError: false, refetch });
    rerender();

    await waitFor(() => expect(result.current.selectedThreadId).toBe("requested"));
    expect(result.current.listFailure).toBeNull();
  });

  it("exposes a refresh failure while keeping the last successful thread list", () => {
    const threads = [requestedThread];
    mocks.useThreads.mockReturnValue({ data: threads, isError: false, refetch });
    const { result, rerender } = renderHook(() => useAskPage());

    mocks.useThreads.mockReturnValue({
      data: threads,
      isError: true,
      error: new Error("Could not refresh conversations"),
      refetch,
    });
    rerender();

    expect(result.current.listFailure?.message).toBe("Could not refresh conversations");
    expect(result.current.threads).toEqual(threads);
  });

  it("waits for the refreshed list before replacing a thread absent from the cache", async () => {
    const cachedThreads = [{ ...requestedThread, threadId: "cached" }];
    mocks.useThreads.mockReturnValue({ data: cachedThreads, isError: false, isFetching: true, refetch });

    const { result, rerender } = renderHook(() => useAskPage());

    expect(result.current.threads).toEqual(cachedThreads);
    expect(mocks.replace).not.toHaveBeenCalled();

    mocks.useThreads.mockReturnValue({ data: [], isError: false, isFetching: false, refetch });
    rerender();

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(
      "/insights/ask-review-questions",
      { scroll: false },
    ));
  });
});
