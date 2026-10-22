"use client";

import { useQuery } from "@tanstack/react-query";

import { listConversationThreads } from "@/lib/conversation-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

export function useConversationThreadsQuery(take = 50) {
  return useQuery({
    queryKey: operatorQueryKeys.conversationThreads(take),
    queryFn: () => listConversationThreads(take),
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}
