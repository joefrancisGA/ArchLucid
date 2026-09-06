"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS } from "@/lib/design-tokens";
import {
  auditBuyerUtilitiesDetailsDisclosureHrefFromSearch,
  parseAuditBuyerUtilitiesDetailsOpenFromSearch,
} from "@/lib/governance/audit-buyer-utilities-details-disclosure-url";

type AuditBuyerUtilitiesDetailsDisclosureProps = {
  readonly summary: string;
  readonly children: ReactNode;
};

export function AuditBuyerUtilitiesDetailsDisclosure(
  props: AuditBuyerUtilitiesDetailsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/audit";
  const searchParams = useSearchParams();
  const auditBuyerUtilitiesDetailsOpenParam = searchParams.get("auditBuyerUtilitiesDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parseAuditBuyerUtilitiesDetailsOpenFromSearch(auditBuyerUtilitiesDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        auditBuyerUtilitiesDetailsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseAuditBuyerUtilitiesDetailsOpenFromSearch(auditBuyerUtilitiesDetailsOpenParam));
  }, [auditBuyerUtilitiesDetailsOpenParam]);

  return (
    <details
      className="mt-4 border-t border-neutral-200 pt-2 dark:border-neutral-700"
      data-testid="audit-buyer-utilities-details"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer pt-2 text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {props.summary}
      </summary>
      <div className="mt-4 space-y-3 pb-2">{props.children}</div>
    </details>
  );
}
