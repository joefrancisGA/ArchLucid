import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_CTO_DEMO_CONTACT_SUPPORT_CTA,
  BUYER_CTO_DEMO_TRY_AGAIN_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CtoDemoCustomerStartErrorProps = {
  readonly message: string;
  readonly onTryAgain: () => void;
  readonly tryingAgain?: boolean;
};

/** Customer-facing demo-start failure — no internal diagnostics. */
export function CtoDemoCustomerStartError(props: CtoDemoCustomerStartErrorProps): React.JSX.Element {
  return (
    <div
      className={cn("space-y-3", DESIGN_TOKENS.callout.blocked, "p-3")}
      role="alert"
      data-testid="cto-demo-customer-start-error"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper)}>{props.message}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="primary" disabled={props.tryingAgain === true} onClick={props.onTryAgain}>
          {BUYER_CTO_DEMO_TRY_AGAIN_CTA}
        </Button>
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/administration/support">{BUYER_CTO_DEMO_CONTACT_SUPPORT_CTA}</Link>
        </Button>
      </div>
    </div>
  );
}
