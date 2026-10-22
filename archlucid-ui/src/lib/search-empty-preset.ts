import { Search } from "lucide-react";

import type { EmptyStateProps } from "@/components/EmptyState";

/** Shown after a successful semantic search that returned no retrieval hits. */
export const SEARCH_EMPTY: EmptyStateProps = {
  icon: Search,
  title: "No matches for that query",
  description:
    "Try different wording, clear the review filter, or ensure your workspace has finalized review evidence indexed for search.",
  actions: [
    { label: "Open Ask", href: "/insights/ask-review-questions", variant: "outline" },
    { label: "View reviews", href: "/architecture/reviews", variant: "outline" },
  ],
};
