import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ConversationThread } from "@/types/conversation";

import { AskThreadHistoryPanel } from "./AskThreadHistoryPanel";

const SAMPLE_THREADS: ConversationThread[] = [
  {
    threadId: "thread-a",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "default",
    title: "Cost model follow-up",
    createdUtc: "2026-07-01T10:00:00Z",
    lastUpdatedUtc: "2026-07-01T12:00:00Z",
  },
  {
    threadId: "thread-b",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "default",
    title: "Security boundary question",
    createdUtc: "2026-07-02T14:00:00Z",
    lastUpdatedUtc: "2026-07-02T15:30:00Z",
  },
];

function renderPanel(
  overrides: Partial<Parameters<typeof AskThreadHistoryPanel>[0]> = {},
): ReturnType<typeof render> {
  const onNewConversation = vi.fn();
  const onSelectThread = vi.fn();

  const view = render(
    <AskThreadHistoryPanel
      buyerPolishedShell={false}
      runId="run-1"
      threads={SAMPLE_THREADS}
      selectedThreadId="thread-a"
      listDateFormatter={() => "Jul 1, 2026"}
      onNewConversation={onNewConversation}
      onSelectThread={onSelectThread}
      {...overrides}
    />,
  );

  return { ...view, onNewConversation, onSelectThread };
}

describe("AskThreadHistoryPanel (TB-672)", () => {
  it("announces the active conversation with aria-current inside a labeled nav", () => {
    renderPanel();

    expect(screen.getByRole("navigation", { name: "Conversation history" })).toBeInTheDocument();

    const activeThread = screen.getByRole("button", { name: /Cost model follow-up/i });
    const inactiveThread = screen.getByRole("button", { name: /Security boundary question/i });

    expect(activeThread).toHaveAttribute("aria-current", "true");
    expect(activeThread).not.toHaveAttribute("role", "tab");
    expect(inactiveThread).not.toHaveAttribute("aria-current");
    expect(inactiveThread).not.toHaveAttribute("role", "tab");
  });

  it("keeps the new-conversation action outside thread selection semantics", () => {
    renderPanel();

    const newConversation = screen.getByRole("button", { name: "New conversation" });

    expect(newConversation).not.toHaveAttribute("aria-current");
    expect(newConversation).not.toHaveAttribute("role", "tab");
  });

  it("calls onSelectThread when another conversation is chosen", () => {
    const { onSelectThread } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: /Security boundary question/i }));

    expect(onSelectThread).toHaveBeenCalledWith("thread-b");
  });

  it("uses buyer-facing nav labeling in the polished shell", () => {
    renderPanel({ buyerPolishedShell: true });

    expect(screen.getByRole("navigation", { name: "Saved review questions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask a new review question" })).toBeInTheDocument();
  });
});
