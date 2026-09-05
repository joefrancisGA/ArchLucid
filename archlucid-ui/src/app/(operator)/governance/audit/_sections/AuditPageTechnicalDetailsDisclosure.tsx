"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  auditPageTechnicalDetailsHrefFromSearch,
  parseAuditPageTechnicalDetailsOpenFromSearch,
} from "@/lib/governance/audit-page-technical-details-url";

type AuditPageTechnicalDetailsDisclosureProps = {
  readonly title: string;
  readonly runId: string;
};

export function AuditPageTechnicalDetailsDisclosure(
  props: AuditPageTechnicalDetailsDisclosureProps,
): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/audit";
  const searchParams = useSearchParams();
  const auditTechnicalDetailsOpenParam = searchParams.get("auditTechnicalDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parseAuditPageTechnicalDetailsOpenFromSearch(auditTechnicalDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        auditPageTechnicalDetailsHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(parseAuditPageTechnicalDetailsOpenFromSearch(auditTechnicalDetailsOpenParam));
  }, [auditTechnicalDetailsOpenParam]);

  return (
    <details
      data-testid="audit-page-technical-details"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>{props.title}</summary>
      <span className={cn("mt-1 block", OPERATOR_TYPOGRAPHY.helper)}>
        Review id: <code>{props.runId}</code>
      </span>
    </details>
  );
}
