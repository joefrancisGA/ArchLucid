"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CREATE_WORK_ITEM_CONFIGURE_CTA } from "@/lib/create-work-item-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATIONS_READINESS_PATH } from "@/lib/integrations-nav-paths";
import { ITSM_CONNECTORS_ADMIN_PATH } from "@/lib/itsm/itsm-connectors-admin-scope";
import {
  ITSM_NOT_CONFIGURED_ADMIN_LEAD,
  ITSM_NOT_CONFIGURED_OPERATOR_LEAD,
  ITSM_NOT_CONFIGURED_READINESS_CTA,
  type ItsmProductId,
} from "@/lib/itsm/itsm-product-integration-page-copy";
import { cn } from "@/lib/utils";

export type ItsmNotConfiguredNextStepProps = {
  readonly product: ItsmProductId;
  readonly productTitle: string;
  readonly canConfigureAdmin: boolean;
};

/** Primary unblock path when ITSM credentials are missing (TB-1146). */
export function ItsmNotConfiguredNextStep(props: ItsmNotConfiguredNextStepProps): React.ReactElement {
  const lead = props.canConfigureAdmin
    ? ITSM_NOT_CONFIGURED_ADMIN_LEAD.replace("{vendor}", props.productTitle)
    : ITSM_NOT_CONFIGURED_OPERATOR_LEAD.replace("{vendor}", props.productTitle);

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid={`integrations-${props.product}-not-configured-next-step`}
      aria-label={`${props.productTitle} next step`}
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{lead}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.canConfigureAdmin ? (
          <Button type="button" variant="primary" asChild>
            <Link
              href={ITSM_CONNECTORS_ADMIN_PATH}
              data-testid={`integrations-${props.product}-configure-admin-cta`}
            >
              {CREATE_WORK_ITEM_CONFIGURE_CTA}
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="primary" asChild>
            <Link
              href={INTEGRATIONS_READINESS_PATH}
              data-testid={`integrations-${props.product}-readiness-cta`}
            >
              {ITSM_NOT_CONFIGURED_READINESS_CTA}
            </Link>
          </Button>
        )}
        {props.canConfigureAdmin ? (
          <Button type="button" variant="outline" asChild>
            <Link
              href={INTEGRATIONS_READINESS_PATH}
              data-testid={`integrations-${props.product}-readiness-secondary`}
            >
              {ITSM_NOT_CONFIGURED_READINESS_CTA}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
