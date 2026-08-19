"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_CTO_DEMO_NEXT_STEPS_HEADING,
  BUYER_CTO_DEMO_NEXT_STEPS_PILOT_CTA,
  BUYER_CTO_DEMO_NEXT_STEPS_SECURITY_REVIEW_CTA,
  BUYER_CTO_DEMO_NEXT_STEPS_SUBTEXT,
  BUYER_CTO_DEMO_NEXT_STEPS_TRUST_PACK_CTA,
} from "@/lib/buyer/buyer-polish-copy";

/** Explicit conversion CTAs at the end of the audit closing beat. */
export function CtoDemoNextStepsClosingSection(): React.JSX.Element {
  return (
    <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800" data-testid="cto-demo-next-steps-closing">
      <h4 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{BUYER_CTO_DEMO_NEXT_STEPS_HEADING}</h4>
      <p className={cn("m-0 mt-1 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_CTO_DEMO_NEXT_STEPS_SUBTEXT}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="default" asChild data-testid="cto-demo-next-steps-pilot">
          <Link href="/get-started">{BUYER_CTO_DEMO_NEXT_STEPS_PILOT_CTA}</Link>
        </Button>
        <Button type="button" size="sm" variant="outline" asChild data-testid="cto-demo-next-steps-security-review">
          <Link href="/trust?focus=security-review">{BUYER_CTO_DEMO_NEXT_STEPS_SECURITY_REVIEW_CTA}</Link>
        </Button>
        <Button type="button" size="sm" variant="outline" asChild data-testid="cto-demo-next-steps-trust-pack">
          <Link href="/trust">{BUYER_CTO_DEMO_NEXT_STEPS_TRUST_PACK_CTA}</Link>
        </Button>
      </div>
    </div>
  );
}
