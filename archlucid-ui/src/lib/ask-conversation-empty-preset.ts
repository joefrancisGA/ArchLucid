import { MessageCircle } from "lucide-react";

import type { EmptyStateProps } from "@/components/EmptyState";

/** Shown in Ask ArchLucid when a thread has no messages yet. */
export const ASK_CONVERSATION_EMPTY: EmptyStateProps = {
  icon: MessageCircle,
  title: "No messages yet",
  description:
    "Select a run for a new conversation (or open an existing thread on the left), then ask a question. Follow-ups reuse the same thread without picking the run again.",
};
