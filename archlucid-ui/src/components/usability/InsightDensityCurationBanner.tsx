import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import {
  formatInsightDensityCurationMessage,
  type InsightDensityCurationCounts,
} from "@/lib/findings-snapshot-insight-density";

export type InsightDensityCurationBannerProps = {
  readonly curation: InsightDensityCurationCounts | null;
};

/** TB-385: communicates insight-density demotion vs retention on the review. */
export function InsightDensityCurationBanner(props: InsightDensityCurationBannerProps): ReactElement | null {
  const curation = props.curation;

  if (curation === null) {
    return null;
  }

  const message = formatInsightDensityCurationMessage(curation);

  if (message.length === 0) {
    return null;
  }

  return (
    <OperatorEmptyState title="Insight curation">
      <p className={cn("m-0 leading-relaxed text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} data-testid="insight-density-curation-banner">
        {message}
      </p>
    </OperatorEmptyState>
  );
}
