"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID } from "@/lib/policy/policy-pack-detail-resolver";
import {
  parsePolicyPackTechnicalDetailsOpenFromSearch,
  policyPackTechnicalDetailsDisclosureHrefFromSearch,
} from "@/lib/policy/policy-pack-technical-details-disclosure-url";
import {
  RESPONSIBLE_AI_TECHNICAL_DETAILS_TITLE,
  RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS,
} from "@/lib/responsible-ai-policy-pack-detail-content";
import { cn } from "@/lib/utils";

type ResponsibleAiPolicyPackTechnicalDetailsDisclosureProps = {
  readonly policyPackId: string;
  readonly technicalVersion: string;
};

/** Responsible AI policy pack technical metadata disclosure synced to URL. */
export function ResponsibleAiPolicyPackTechnicalDetailsDisclosure(
  props: ResponsibleAiPolicyPackTechnicalDetailsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const policyPackTechnicalDetailsOpenParam = searchParams.get("policyPackTechnicalDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parsePolicyPackTechnicalDetailsOpenFromSearch(policyPackTechnicalDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        policyPackTechnicalDetailsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parsePolicyPackTechnicalDetailsOpenFromSearch(policyPackTechnicalDetailsOpenParam));
  }, [policyPackTechnicalDetailsOpenParam]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK.optional)}
        data-testid="policy-pack-technical-details-trigger"
      >
        {RESPONSIBLE_AI_VIEW_TECHNICAL_DETAILS}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
        <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{RESPONSIBLE_AI_TECHNICAL_DETAILS_TITLE}</h4>
        <dl className={cn("m-0 mt-3 grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <div>
            <dt className="text-al-text-secondary">Pack reference</dt>
            <dd className="m-0 flex flex-wrap items-center gap-2 font-mono text-al-text-primary">{props.policyPackId}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Template id</dt>
            <dd className="m-0 font-mono text-al-text-primary">{BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID}</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Curated rules artifact</dt>
            <dd className="m-0 font-mono text-al-text-primary">ai-governance-responsible-ai-rules-v1.json</dd>
          </div>
          <div>
            <dt className="text-al-text-secondary">Version history</dt>
            <dd className="m-0 text-al-text-primary">{props.technicalVersion} · platform default baseline</dd>
          </div>
        </dl>
        <div className="mt-3">
          <CopyIdButton value={props.policyPackId} aria-label="Copy policy pack ID" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
