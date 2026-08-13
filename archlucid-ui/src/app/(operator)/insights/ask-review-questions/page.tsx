import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

import { AskPageContent } from "@/app/(operator)/insights/ask-review-questions/_sections/AskPageContent";
import { AskSuspenseFallback } from "@/app/(operator)/insights/ask-review-questions/_sections/AskSuspenseFallback";
import { listConversationThreads } from "@/lib/conversation-api";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";
import { createOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export default async function AskPage() {
  const queryClient = createOperatorQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: operatorQueryKeys.conversationThreads(50),
      queryFn: () => listConversationThreads(50),
    }),
    queryClient.prefetchQuery({
      queryKey: [...operatorQueryKeys.askProjectRuns("default"), false] as const,
      queryFn: () => loadProjectRunsMergedWithDemoFallback("default"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AskSuspenseFallback />}>
        <AskPageContent />
      </Suspense>
    </HydrationBoundary>
  );
}
