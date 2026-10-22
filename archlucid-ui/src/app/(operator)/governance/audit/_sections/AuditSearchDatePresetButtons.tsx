"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { auditTrailDateRangePresetHrefFromSearch } from "@/lib/governance/audit-trail-date-range-url";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { cn } from "@/lib/utils";

type AuditSearchDatePresetButtonsProps = {
  readonly searching: boolean;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => void | Promise<void>;
  readonly clearDateRangeAndSearch: () => void | Promise<void>;
};

function AuditDatePresetChip(props: {
  readonly preset: "24h" | "7d";
  readonly label: string;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly href: string;
  readonly onSelect: (preset: "24h" | "7d") => void | Promise<void>;
}): ReactElement {
  return (
    <Link
      href={props.href}
      scroll={false}
      className={cn(DESIGN_TOKENS.interactive.chip, DESIGN_TOKENS.accent.focusRing, buyerFilterChipClass(props.active, props.disabled))}
      aria-current={props.active ? "page" : undefined}
      data-testid={`audit-date-preset-${props.preset}`}
      onClick={(event) => {
        if (props.disabled) {
          event.preventDefault();

          return;
        }

        void props.onSelect(props.preset);
      }}
    >
      {props.label}
    </Link>
  );
}

export function AuditSearchDatePresetButtons(props: AuditSearchDatePresetButtonsProps): ReactElement {
  const {
    searching,
    loadingTypes,
    auditDatePreset,
    fromUtc,
    toUtc,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
  } = props;
  const pathname = usePathname() ?? GOVERNANCE_AUDIT_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const disabled = searching || loadingTypes;

  return (
    <FilterChipGroup aria-label="Audit date presets" className="flex flex-wrap gap-2">
      <AuditDatePresetChip
        preset="24h"
        label="Last 24 hours"
        active={auditDatePreset === "24h"}
        disabled={disabled}
        href={auditTrailDateRangePresetHrefFromSearch(currentSearch, "24h", pathname)}
        onSelect={applyAuditDatePreset}
      />
      <AuditDatePresetChip
        preset="7d"
        label="Last 7 days"
        active={auditDatePreset === "7d"}
        disabled={disabled}
        href={auditTrailDateRangePresetHrefFromSearch(currentSearch, "7d", pathname)}
        onSelect={applyAuditDatePreset}
      />
      {auditDatePreset !== null || fromUtc.length > 0 || toUtc.length > 0 ? (
        <Link
          href={auditTrailDateRangePresetHrefFromSearch(currentSearch, null, pathname)}
          scroll={false}
          className={cn(DESIGN_TOKENS.interactive.chip, DESIGN_TOKENS.accent.focusRing, buyerFilterChipClass(false, disabled))}
          data-testid="audit-date-preset-clear"
          onClick={(event) => {
            if (disabled) {
              event.preventDefault();

              return;
            }

            void clearDateRangeAndSearch();
          }}
        >
          Clear date range
        </Link>
      ) : null}
    </FilterChipGroup>
  );
}
