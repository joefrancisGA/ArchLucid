"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parsePolicyPackGenericTechnicalOpenFromSearch,
  policyPackGenericTechnicalDisclosureHrefFromSearch,
} from "@/lib/policy/policy-pack-generic-technical-disclosure-url";
import { RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS } from "@/lib/responsible-ai-policy-pack-detail-content";
import { cn } from "@/lib/utils";

type PolicyPackGenericTechnicalDetailsDisclosureProps = {
  readonly policyPackId: string;
};

/** Generic policy pack technical metadata disclosure synced to URL. */
export function PolicyPackGenericTechnicalDetailsDisclosure(
  props: PolicyPackGenericTechnicalDetailsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const policyPackGenericTechnicalOpenParam = searchParams.get("policyPackGenericTechnicalOpen");
  const [open, setOpenState] = useState(() =>
    parsePolicyPackGenericTechnicalOpenFromSearch(policyPackGenericTechnicalOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        policyPackGenericTechnicalDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parsePolicyPackGenericTechnicalOpenFromSearch(policyPackGenericTechnicalOpenParam));
  }, [policyPackGenericTechnicalOpenParam]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.optional)}
        data-testid="policy-pack-generic-technical-details-trigger"
      >
        {RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <p className={cn("m-0 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          Pack reference: {props.policyPackId}
        </p>
        <CopyIdButton value={props.policyPackId} aria-label="Copy policy pack ID" />
      </CollapsibleContent>
    </Collapsible>
  );
}
