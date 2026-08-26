import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PageHeaderClaimDisciplineProps = {
  readonly text: string;
  readonly testId?: string;
  readonly className?: string;
};

/** Folded claim-discipline line — lives under the page title lead, not a separate hero card. */
export function PageHeaderClaimDiscipline({
  text,
  testId = "page-claim-discipline",
  className,
}: PageHeaderClaimDisciplineProps): React.JSX.Element {
  return (
    <p
      className={cn(
        "m-0 mt-2 text-neutral-600 dark:text-neutral-400",
        OPERATOR_TYPOGRAPHY.helper,
        className,
      )}
      data-testid={testId}
    >
      {text}
    </p>
  );
}
