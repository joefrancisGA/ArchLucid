import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEMO_EXPLAIN_NOT_AVAILABLE_BODY,
  DEMO_EXPLAIN_NOT_AVAILABLE_TITLE,
} from "@/lib/demo-explain-page-copy";

import { DemoExplainNextStepLadder } from "./DemoExplainNextStepLadder";

export function DemoExplainNotAvailableNotice(): React.JSX.Element {
  return (
    <div
      data-testid="demo-explain-not-available"
      role="status"
      className={cn(
        "rounded border border-neutral-300 bg-neutral-50 p-4 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)} data-testid="demo-explain-not-available-title">
        {DEMO_EXPLAIN_NOT_AVAILABLE_TITLE}
      </p>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{DEMO_EXPLAIN_NOT_AVAILABLE_BODY}</p>
      <DemoExplainNextStepLadder />
    </div>
  );
}
