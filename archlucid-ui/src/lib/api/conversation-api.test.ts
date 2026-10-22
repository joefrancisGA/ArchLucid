import { describe, expect, it, vi } from "vitest";

import {
  conversationThreadsFromListResponse,
  listConversationThreads,
} from "@/lib/api/conversation-api";
import type { ConversationThread } from "@/types/conversation";

vi.mock("@/lib/api/http", () => ({
  apiGet: vi.fn(),
  apiPostJson: vi.fn(),
}));

import { apiGet } from "@/lib/api/http";

const SAMPLE_THREAD: ConversationThread = {
  threadId: "11111111-1111-1111-1111-111111111111",
  tenantId: "tenant-1",
  workspaceId: "workspace-1",
  projectId: "default",
  title: "PHI follow-up",
  createdUtc: "2026-07-01T10:00:00.000Z",
  lastUpdatedUtc: "2026-07-01T12:00:00.000Z",
};

describe("conversationThreadsFromListResponse", () => {
  it("unwraps PagedResponse.items from GET /v1/conversations", () => {
    expect(
      conversationThreadsFromListResponse({
        items: [SAMPLE_THREAD],
        totalCount: 1,
        page: 1,
        pageSize: 50,
        hasMore: false,
      }),
    ).toEqual([SAMPLE_THREAD]);
  });

  it("accepts a legacy bare array payload", () => {
    expect(conversationThreadsFromListResponse([SAMPLE_THREAD])).toEqual([SAMPLE_THREAD]);
  });

  it("returns empty when payload is not a thread list", () => {
    expect(conversationThreadsFromListResponse(undefined)).toEqual([]);
    expect(conversationThreadsFromListResponse(null)).toEqual([]);
    expect(
      conversationThreadsFromListResponse({
        items: undefined as unknown as ConversationThread[],
        totalCount: 0,
        page: 1,
        pageSize: 50,
        hasMore: false,
      }),
    ).toEqual([]);
  });

  it("drops nullish rows so callers never read threadId on undefined", () => {
    expect(
      conversationThreadsFromListResponse({
        items: [SAMPLE_THREAD, undefined as unknown as ConversationThread],
        totalCount: 2,
        page: 1,
        pageSize: 50,
        hasMore: false,
      }),
    ).toEqual([SAMPLE_THREAD]);
  });
});

describe("listConversationThreads", () => {
  it("returns items from the paged API envelope", async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      items: [SAMPLE_THREAD],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });

    await expect(listConversationThreads(25)).resolves.toEqual([SAMPLE_THREAD]);
    expect(apiGet).toHaveBeenCalledWith("/v1/conversations?take=25");
  });
});
