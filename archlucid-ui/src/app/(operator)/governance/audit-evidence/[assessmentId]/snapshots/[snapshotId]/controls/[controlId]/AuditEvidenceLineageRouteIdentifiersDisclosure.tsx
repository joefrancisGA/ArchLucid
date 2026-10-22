"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CopyIdButton } from "@/components/CopyIdButton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUDIT_EVIDENCE_CONTROL_LINEAGE_IDENTIFIERS_TITLE } from "@/lib/audit-evidence-page-copy";
import {
  AUDIT_EVIDENCE_LINEAGE_ROUTE_IDENTIFIERS_OPEN_PARAM,
  auditEvidenceLineageRouteIdentifiersDisclosureHrefFromSearch,
  parseAuditEvidenceLineageRouteIdentifiersOpenFromSearch,
} from "@/lib/governance/audit-evidence-lineage-route-identifiers-disclosure-url";
import { cn } from "@/lib/utils";

type AuditEvidenceLineageRouteIdentifiersDisclosureProps = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

function IdentifierRow(props: {
  readonly label: string;
  readonly value: string;
  readonly copyLabel: string;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <dt className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</dt>
        <dd className={cn("m-0 mt-1 break-all font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
          {props.value}
        </dd>
      </div>
      <CopyIdButton value={props.value} aria-label={props.copyLabel} />
    </div>
  );
}

/** Progressive disclosure for route UUIDs on control lineage (GOO). */
export function AuditEvidenceLineageRouteIdentifiersDisclosure(
  props: AuditEvidenceLineageRouteIdentifiersDisclosureProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const routeIdentifiersOpenParam = searchParams.get(AUDIT_EVIDENCE_LINEAGE_ROUTE_IDENTIFIERS_OPEN_PARAM);
  const [routeIdentifiersOpen, setRouteIdentifiersOpenState] = useState(() =>
    parseAuditEvidenceLineageRouteIdentifiersOpenFromSearch(routeIdentifiersOpenParam),
  );

  const syncRouteIdentifiersOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        auditEvidenceLineageRouteIdentifiersDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRouteIdentifiersOpen = useCallback(
    (open: boolean) => {
      setRouteIdentifiersOpenState(open);
      syncRouteIdentifiersOpenToUrl(open);
    },
    [syncRouteIdentifiersOpenToUrl],
  );

  useEffect(() => {
    setRouteIdentifiersOpenState(parseAuditEvidenceLineageRouteIdentifiersOpenFromSearch(routeIdentifiersOpenParam));
  }, [routeIdentifiersOpenParam]);

  return (
    <CollapsibleSection
      title={AUDIT_EVIDENCE_CONTROL_LINEAGE_IDENTIFIERS_TITLE}
      sectionTestId="audit-evidence-lineage-route-identifiers"
      summaryLine="Assessment, snapshot, and control IDs from the URL"
      open={routeIdentifiersOpen}
      onToggle={setRouteIdentifiersOpen}
    >
      <dl className="m-0 grid gap-3">
        <IdentifierRow label="Assessment ID" value={props.assessmentId} copyLabel="Copy assessment ID" />
        <IdentifierRow label="Snapshot ID" value={props.snapshotId} copyLabel="Copy snapshot ID" />
        <IdentifierRow label="Control ID" value={props.controlId} copyLabel="Copy control ID" />
      </dl>
    </CollapsibleSection>
  );
}
