"use client";

import { useMemo } from "react";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  AUDIT_EVIDENCE_CONTROL_LINEAGE_CHAIN_TOGGLE_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_SHORTCUT,
  AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SHORTCUT,
} from "@/lib/audit-evidence-page-copy";

type AuditEvidenceControlLineageShortcutHandlers = {
  readonly toggleChain: () => void;
  readonly copyLineageLink: () => void;
  readonly downloadPackage: () => void;
  readonly lineageLoaded: boolean;
};

type UseAuditEvidenceControlLineageShortcutsOptions = {
  readonly enabled: boolean;
};

export function useAuditEvidenceControlLineageShortcuts(
  handlers: AuditEvidenceControlLineageShortcutHandlers,
  options: UseAuditEvidenceControlLineageShortcutsOptions,
): void {
  const shortcuts = useMemo(() => {
    if (!options.enabled) {
      return {};
    }

    const map = {
      [AUDIT_EVIDENCE_CONTROL_LINEAGE_CHAIN_TOGGLE_SHORTCUT]: {
        handler: handlers.toggleChain,
        description: "Toggle chain of custody",
      },
      [AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_SHORTCUT]: {
        handler: handlers.copyLineageLink,
        description: "Copy lineage link",
      },
    };

    if (handlers.lineageLoaded) {
      return {
        ...map,
        [AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_SHORTCUT]: {
          handler: handlers.downloadPackage,
          description: "Download snapshot evidence bundle",
        },
      };
    }

    return map;
  }, [
    handlers.copyLineageLink,
    handlers.downloadPackage,
    handlers.lineageLoaded,
    handlers.toggleChain,
    options.enabled,
  ]);

  useKeyboardShortcuts(shortcuts);
}
