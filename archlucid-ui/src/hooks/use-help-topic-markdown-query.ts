"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchHelpTopicMarkdown } from "@/lib/help-topic-markdown";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useHelpTopicMarkdownQuery(slug: string) {
  const trimmed = slug.trim();

  return useQuery({
    queryKey: operatorQueryKeys.helpTopicMarkdown(trimmed),
    queryFn: () => fetchHelpTopicMarkdown(trimmed),
    enabled: trimmed.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
