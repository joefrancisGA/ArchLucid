"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { auditTrailActionHrefFromSearch } from "@/lib/governance/audit-trail-filters-url";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { cn } from "@/lib/utils";

type AuditSearchEventTypeChipsProps = {
  readonly eventTypes: string[];
  readonly eventType: string;
  readonly setEventType: (value: string) => void;
  readonly buyerPolishedShell: boolean;
  readonly disabled: boolean;
};

function AuditEventTypeChip(props: {
  readonly label: string;
  readonly value: string;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly href: string;
  readonly onSelect: (value: string) => void;
}): ReactElement {
  return (
    <Link
      href={props.href}
      scroll={false}
      className={cn(
        DESIGN_TOKENS.interactive.chip,
        DESIGN_TOKENS.accent.focusRing,
        buyerFilterChipClass(props.active, props.disabled),
      )}
      aria-current={props.active ? "page" : undefined}
      data-testid={props.value.length === 0 ? "audit-action-any" : `audit-action-${props.value}`}
      onClick={(event) => {
        if (props.disabled) {
          event.preventDefault();

          return;
        }

        props.onSelect(props.value);
      }}
    >
      {props.label}
    </Link>
  );
}

/** URL-bound event-type chips for the audit trail filter bar (wave 16). */
export function AuditSearchEventTypeChips(props: AuditSearchEventTypeChipsProps): ReactElement | null {
  const { eventTypes, eventType, setEventType, buyerPolishedShell, disabled } = props;

  if (eventTypes.length === 0) {
    return null;
  }

  const pathname = usePathname() ?? GOVERNANCE_AUDIT_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const visibleTypes = eventTypes.slice(0, 6);

  return (
    <FilterChipGroup aria-label="Filter audit events by action type" className="flex flex-wrap gap-2">
      <AuditEventTypeChip
        label="Any action"
        value=""
        active={eventType.length === 0}
        disabled={disabled}
        href={auditTrailActionHrefFromSearch(currentSearch, "", pathname)}
        onSelect={setEventType}
      />
      {visibleTypes.map((type) => (
        <AuditEventTypeChip
          key={type}
          label={buyerPolishedShell ? pipelineEventTypeFriendlyLabel(type) : type}
          value={type}
          active={eventType === type}
          disabled={disabled}
          href={auditTrailActionHrefFromSearch(currentSearch, type, pathname)}
          onSelect={setEventType}
        />
      ))}
    </FilterChipGroup>
  );
}
