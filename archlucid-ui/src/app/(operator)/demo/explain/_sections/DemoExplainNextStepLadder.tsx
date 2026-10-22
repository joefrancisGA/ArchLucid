import Link from "next/link";

import { CtaButton } from "@/components/marketing/CtaButton";
import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DEMO_EXPLAIN_LADDER_GET_STARTED_HREF,
  DEMO_EXPLAIN_LADDER_GET_STARTED_LABEL,
  DEMO_EXPLAIN_LADDER_HELP_HREF,
  DEMO_EXPLAIN_LADDER_HELP_LABEL,
  DEMO_EXPLAIN_LADDER_SHOWCASE_HREF,
  DEMO_EXPLAIN_LADDER_SHOWCASE_LABEL,
  DEMO_EXPLAIN_LADDER_PRIMARY_HREF,
  DEMO_EXPLAIN_LADDER_PRIMARY_LABEL,
  DEMO_EXPLAIN_LADDER_WELCOME_HREF,
  DEMO_EXPLAIN_LADDER_WELCOME_LABEL,
  DEMO_EXPLAIN_RETRY_LABEL,
} from "@/lib/demo-explain-page-copy";
import { cn } from "@/lib/utils";

export type DemoExplainNextStepLadderProps = {
  readonly onRetry?: () => void;
};

/** TB-1321: public proof fork when demo explain is unavailable or incomplete. */
export function DemoExplainNextStepLadder(props: DemoExplainNextStepLadderProps): React.JSX.Element {
  const { onRetry } = props;

  return (
    <div className="mt-4 space-y-3" data-testid="demo-explain-next-step-ladder">
      <div className="flex flex-wrap items-center gap-3">
        <CtaButton
          href={DEMO_EXPLAIN_LADDER_PRIMARY_HREF}
          variant="primary"
          size="lg"
          data-testid="demo-explain-ladder-primary"
        >
          {DEMO_EXPLAIN_LADDER_PRIMARY_LABEL}
        </CtaButton>

        {onRetry ? (
          <Button type="button" variant="outline" size="lg" onClick={onRetry} data-testid="demo-explain-retry">
            {DEMO_EXPLAIN_RETRY_LABEL}
          </Button>
        ) : null}
      </div>

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={MARKETING_SURFACES.inlineLink} href={DEMO_EXPLAIN_LADDER_SHOWCASE_HREF}>
          {DEMO_EXPLAIN_LADDER_SHOWCASE_LABEL}
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href={DEMO_EXPLAIN_LADDER_WELCOME_HREF}>
          {DEMO_EXPLAIN_LADDER_WELCOME_LABEL}
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href={DEMO_EXPLAIN_LADDER_GET_STARTED_HREF}>
          {DEMO_EXPLAIN_LADDER_GET_STARTED_LABEL}
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href={DEMO_EXPLAIN_LADDER_HELP_HREF}>
          {DEMO_EXPLAIN_LADDER_HELP_LABEL}
        </Link>
      </p>
    </div>
  );
}
