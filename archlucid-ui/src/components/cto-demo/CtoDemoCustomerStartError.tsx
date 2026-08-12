import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_CTO_DEMO_CONTACT_SUPPORT_CTA,
  BUYER_CTO_DEMO_TRY_AGAIN_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
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
      className="space-y-3 rounded-md border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-950/30"
      role="alert"
      data-testid="cto-demo-customer-start-error"
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-rose-900 dark:text-rose-100")}>{props.message}</p>
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
