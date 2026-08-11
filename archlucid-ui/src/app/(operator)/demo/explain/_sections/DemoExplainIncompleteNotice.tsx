import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { DEMO_EXPLAIN_INCOMPLETE_BODY } from "@/lib/demo-explain-page-copy";

import { DemoExplainNextStepLadder } from "./DemoExplainNextStepLadder";

export type DemoExplainIncompleteNoticeProps = {
  readonly onRetry: () => void;
};

export function DemoExplainIncompleteNotice(props: DemoExplainIncompleteNoticeProps): React.JSX.Element {
  const { onRetry } = props;

  return (
    <div
      data-testid="demo-explain-incomplete"
      role="status"
      className={cn(
        "rounded border border-neutral-300 bg-neutral-50 p-4 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
    >
      <p className="m-0">{DEMO_EXPLAIN_INCOMPLETE_BODY}</p>
      <DemoExplainNextStepLadder onRetry={onRetry} />
    </div>
  );
}
