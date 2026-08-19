import Link from "next/link";

import { Button } from "@/components/ui/button";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type HelpArticleLoadFailurePanelProps = {
  readonly slug: string;
  readonly retryLabel: string;
  readonly testId: string;
  readonly retryTestId: string;
  readonly onRetry: () => void;
};

/** Inline help topic load failure with retry and full-page escape hatch (HCD). */
export function HelpArticleLoadFailurePanel(props: HelpArticleLoadFailurePanelProps): React.JSX.Element {
  return (
    <div className="space-y-3" role="alert" data-testid={props.testId}>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Could not load this topic in the drawer.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={props.retryTestId}
          onClick={() => {
            props.onRetry();
          }}
        >
          {props.retryLabel}
        </Button>
        <Link
          href={inAppHelpHref(props.slug)}
          className={cn("font-medium underline-offset-2 hover:underline", OPERATOR_TYPOGRAPHY.body)}
        >
          Open full page
        </Link>
      </div>
    </div>
  );
}
