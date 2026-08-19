import { cn } from "@/lib/utils";
import {
  BUYER_CTO_DEMO_ISOLATION_PROOF_BODY,
  BUYER_CTO_DEMO_ISOLATION_PROOF_HEADING,
} from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_DEMO_TENANT_CATALOG_ID, SHOWCASE_DEMO_TENANT_NAME } from "@/lib/showcase-static-demo";

/** Factual isolation evidence shown when opening the how-it-works dialog from the tenant badge. */
export function CtoDemoTenantIsolationProofCallout(): React.JSX.Element {
  return (
    <div
      className={cn("mb-4", DESIGN_TOKENS.callout.info)}
      data-testid="cto-demo-tenant-isolation-proof"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_CTO_DEMO_ISOLATION_PROOF_HEADING}
      </p>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{BUYER_CTO_DEMO_ISOLATION_PROOF_BODY}</p>
      <dl className={cn("m-0 mt-3 grid gap-2", OPERATOR_TYPOGRAPHY.badge)}>
        <div>
          <dt className="font-semibold text-al-text-primary">Tenant</dt>
          <dd className="m-0 text-neutral-700 dark:text-neutral-300">{SHOWCASE_DEMO_TENANT_NAME}</dd>
        </div>
        <div>
          <dt className="font-semibold text-al-text-primary">Database catalog</dt>
          <dd className="m-0 font-mono text-neutral-700 dark:text-neutral-300">{SHOWCASE_DEMO_TENANT_CATALOG_ID}</dd>
        </div>
      </dl>
    </div>
  );
}
