"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseHealthcareClaimsPackTechnicalOpenFromSearch,
  healthcareClaimsPackTechnicalDisclosureHrefFromSearch,
} from "@/lib/policy/healthcare-claims-pack-technical-disclosure-url";
import { CLAIMS_INTAKE_RULE_SET_VERSION } from "@/lib/samples/claims-intake/definition";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { cn } from "@/lib/utils";
import Link from "next/link";

type HealthcareClaimsPolicyPackTechnicalDetailsDisclosureProps = {
  readonly policyPackId?: string;
};

/** Healthcare claims policy pack technical metadata disclosure synced to URL. */
export function HealthcareClaimsPolicyPackTechnicalDetailsDisclosure(
  props: HealthcareClaimsPolicyPackTechnicalDetailsDisclosureProps = {},
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const healthcareClaimsPackTechnicalOpenParam = searchParams.get("healthcareClaimsPackTechnicalOpen");
  const [open, setOpenState] = useState(() =>
    parseHealthcareClaimsPackTechnicalOpenFromSearch(healthcareClaimsPackTechnicalOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        healthcareClaimsPackTechnicalDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseHealthcareClaimsPackTechnicalOpenFromSearch(healthcareClaimsPackTechnicalOpenParam));
  }, [healthcareClaimsPackTechnicalOpenParam]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          OPERATOR_LINK.optional,
          "border border-neutral-300 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50",
        )}
        data-testid="healthcare-claims-pack-technical-details-trigger"
        aria-expanded={open}
      >
        Technical identifiers &amp; lifecycle metadata
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("mt-2 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {props.policyPackId != null && props.policyPackId.trim().length > 0 ? (
          <p className="m-0">
            Pack reference <span className="font-mono">{props.policyPackId}</span>
          </p>
        ) : null}
        <p className="m-0">
          Rule-set id <span className="font-mono">healthcare-claims-v3</span> · Effective version{" "}
          <span className="font-mono">{CLAIMS_INTAKE_RULE_SET_VERSION}</span>
        </p>
        <p className="m-0">
          Governance approval for this pack is recorded in the{" "}
          <Link className={OPERATOR_LINK.inline} href={GOVERNANCE_APPROVAL_QUEUE_PATH}>
            approval queue
          </Link>
          {" "}when a review is finalized — there is no separate Approval tab on this detail page.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
