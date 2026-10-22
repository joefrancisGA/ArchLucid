"use client";

import { useEffect, useState, type JSX } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  MUTATING_IN_WORKSPACE_CHIP_PREFIX,
  buildMutatingInWorkspaceChipCopy,
  readMutatingInWorkspaceChipCopy,
  resolveMutatingInWorkspaceChipFromRecord,
  type MutatingInWorkspaceChipCopy,
} from "@/lib/mutating-in-workspace-chip";
import { cn } from "@/lib/utils";

export type MutatingInWorkspaceChipProps = {
  readonly className?: string;
  /**
   * Optional label override (tests / parent already resolved scope).
   * When omitted, the chip reads the active operator workspace after mount.
   */
  readonly workspaceScopeLabel?: string;
  /** Optional full copy override for tests. */
  readonly copy?: MutatingInWorkspaceChipCopy;
};

/**
 * TB-2220 — Chip naming the workspace that an irreversible mutate CTA will write to.
 * Mount beside create/assign/save/invite controls on admin and approval surfaces.
 */
export function MutatingInWorkspaceChip(props: MutatingInWorkspaceChipProps): JSX.Element {
  const [copy, setCopy] = useState<MutatingInWorkspaceChipCopy>(() => {
    if (props.copy !== undefined) {
      return props.copy;
    }

    if (props.workspaceScopeLabel !== undefined) {
      return buildMutatingInWorkspaceChipCopy(props.workspaceScopeLabel);
    }

    // SSR / first paint: avoid storage so hydration matches the server.
    return resolveMutatingInWorkspaceChipFromRecord(null);
  });

  useEffect(() => {
    if (props.copy !== undefined) {
      setCopy(props.copy);
      return;
    }

    if (props.workspaceScopeLabel !== undefined) {
      setCopy(buildMutatingInWorkspaceChipCopy(props.workspaceScopeLabel));
      return;
    }

    setCopy(readMutatingInWorkspaceChipCopy());
  }, [props.copy, props.workspaceScopeLabel]);

  return (
    <span
      className={cn("inline-flex max-w-full items-center", props.className)}
      data-testid="mutating-in-workspace-chip"
      data-prefix={MUTATING_IN_WORKSPACE_CHIP_PREFIX}
    >
      <StatusTag kind="neutral" label={copy.label} data-testid="mutating-in-workspace-chip-tag" />
    </span>
  );
}
