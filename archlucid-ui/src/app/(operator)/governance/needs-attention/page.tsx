import type { Metadata } from "next";

import { NEEDS_ATTENTION_INBOX_LABEL } from "@/lib/usability/usability-consolidation";

import { NeedsAttentionInboxPageClient } from "./_sections/NeedsAttentionInboxPageClient";

export const metadata: Metadata = {
  title: NEEDS_ATTENTION_INBOX_LABEL,
};

/** Unified governance inbox — aggregates attention queues into one surface. */
export default function NeedsAttentionInboxPage() {
  return <NeedsAttentionInboxPageClient />;
}
