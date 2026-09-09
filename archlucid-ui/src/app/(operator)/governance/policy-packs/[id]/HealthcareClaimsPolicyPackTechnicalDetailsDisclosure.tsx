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
import { cn } from "@/lib/utils";

/** Healthcare claims policy pack technical metadata disclosure synced to URL. */
export function HealthcareClaimsPolicyPackTechnicalDetailsDisclosure(): ReactElement {
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
        className={cn(OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.optional)}
        data-testid="healthcare-claims-pack-technical-details-trigger"
      >
        Technical identifiers &amp; lifecycle metadata
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("mt-2 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <p className="m-0">
          Rule-set id <span className="font-mono">healthcare-claims-v3</span> · Effective version{" "}
          <span className="font-mono">{CLAIMS_INTAKE_RULE_SET_VERSION}</span>
        </p>
        <p className="m-0">
          Approval recorded against the finalized Claims Intake architecture package — cross-check the Approval tab for
          promotion readiness.
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
