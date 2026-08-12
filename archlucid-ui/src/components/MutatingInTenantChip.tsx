"use client";

import { useEffect, useState, type JSX } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  MUTATING_IN_TENANT_CHIP_PREFIX,
  buildMutatingInTenantChipCopy,
  readMutatingInTenantChipCopy,
  resolveMutatingInTenantChipFromRecord,
  type MutatingInTenantChipCopy,
} from "@/lib/mutating-in-tenant-chip";
import { cn } from "@/lib/utils";

export type MutatingInTenantChipProps = {
  readonly className?: string;
  /**
   * Optional tenant label override (tests / parent already resolved scope).
   * When omitted, the chip reads the active tenant after mount.
   */
  readonly tenantScopeLabel?: string;
  /** Optional full copy override for tests. */
  readonly copy?: MutatingInTenantChipCopy;
};

/**
 * Chip naming the tenant that an irreversible identity mutate CTA will write to.
 * Mount beside save controls on tenant-wide identity provider surfaces.
 */
export function MutatingInTenantChip(props: MutatingInTenantChipProps): JSX.Element {
  const [copy, setCopy] = useState<MutatingInTenantChipCopy>(() => {
    if (props.copy !== undefined) {
      return props.copy;
    }

    if (props.tenantScopeLabel !== undefined) {
      return buildMutatingInTenantChipCopy(props.tenantScopeLabel);
    }

    // SSR / first paint: avoid storage so hydration matches the server.
    return resolveMutatingInTenantChipFromRecord(null);
  });

  useEffect(() => {
    if (props.copy !== undefined) {
      setCopy(props.copy);
      return;
    }

    if (props.tenantScopeLabel !== undefined) {
      setCopy(buildMutatingInTenantChipCopy(props.tenantScopeLabel));
      return;
    }

    setCopy(readMutatingInTenantChipCopy());
  }, [props.copy, props.tenantScopeLabel]);

  return (
    <span
      className={cn("inline-flex max-w-full items-center", props.className)}
      data-testid="mutating-in-tenant-chip"
      data-prefix={MUTATING_IN_TENANT_CHIP_PREFIX}
      title={copy.label}
    >
      <StatusTag kind="neutral" label={copy.label} data-testid="mutating-in-tenant-chip-tag" />
    </span>
  );
}
