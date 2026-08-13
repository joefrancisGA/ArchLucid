import type { ReactElement } from "react";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

/** Shell-standard placeholder while a `/help/[...topic]` segment resolves (TB-1600). */
export function HelpTopicPageLoadingSkeleton(): ReactElement {
  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.majorSectionGap}>
      <div
        aria-busy="true"
        aria-label="Loading help topic"
        className="space-y-4"
        data-testid="help-topic-loading"
        role="status"
      >
        <Skeleton className="h-4 w-40" data-testid="help-topic-loading-breadcrumb" />
        <Skeleton className="h-8 w-72 max-w-full" data-testid="help-topic-loading-title" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-56 w-full max-w-4xl rounded-lg" data-testid="help-topic-loading-body" />
      </div>
    </OperatorPageContainer>
  );
}
