import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSearchParamsMock = vi.fn<() => URLSearchParams>();
const routerReplaceMock = vi.fn();
let searchParams = new URLSearchParams("thread=stale-thread-id");

vi.mock("next/navigation", async (importOriginal) => {
  const { extendNextNavigationVitestMock } = await import("@/testing/next-navigation-vitest-mock");

  return extendNextNavigationVitestMock(importOriginal as () => Promise<typeof import("next/navigation")>, {
    useSearchParams: () => useSearchParamsMock(),
    useRouter: () =>
      ({
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
        push: vi.fn(),
        refresh: vi.fn(),
        replace: (href: string) => {
          const queryIndex = href.indexOf("?");
          searchParams = new URLSearchParams(queryIndex >= 0 ? href.slice(queryIndex + 1) : "");
          routerReplaceMock(href);
        },
        bfcacheId: null,
      }) as unknown as ReturnType<typeof import("next/navigation")["useRouter"]>,
  });
});

import { useAskPageUrlSync } from "./use-ask-page-url-sync";
import type { ConversationThread } from "@/types/conversation";

const liveThread: ConversationThread = {
  threadId: "thread-live",
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "project-1",
  runId: "run-1",
  title: "Claims review Q&A",
  lastUpdatedUtc: "2026-02-01T00:00:00Z",
  createdUtc: "2026-01-01T00:00:00Z",
};

function buildUrlSyncOptions(threads: ConversationThread[], threadsHydrated: boolean) {
  return {
    runId: "",
    selectedThreadId: "",
    baseRunId: "",
    targetRunId: "",
    compareOpen: false,
    setRunId: vi.fn(),
    setBaseRunId: vi.fn(),
    setTargetRunId: vi.fn(),
    setCompareOpen: vi.fn(),
    setSelectedThreadId: vi.fn(),
    setMessages: vi.fn(),
    setRetrievalDegraded: vi.fn(),
    setLastAskReferencedFindings: vi.fn(),
    setLastAskReferencedDecisions: vi.fn(),
    setLastAskReferencedArtifacts: vi.fn(),
    threads,
    threadsHydrated,
    loadMessages: vi.fn().mockResolvedValue(undefined),
  };
}

describe("useAskPageUrlSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams("thread=stale-thread-id");
    useSearchParamsMock.mockImplementation(() => searchParams);
  });

  it("clears a stale thread search param after the thread list hydrates without a match", async () => {
    renderHook(() => useAskPageUrlSync(buildUrlSyncOptions([liveThread], true)));

    await waitFor(() => {
      expect(routerReplaceMock).toHaveBeenCalled();
    });

    const replacedHref = String(routerReplaceMock.mock.calls.at(-1)?.[0] ?? "");
    expect(replacedHref).not.toContain("thread=stale-thread-id");
  });
});
