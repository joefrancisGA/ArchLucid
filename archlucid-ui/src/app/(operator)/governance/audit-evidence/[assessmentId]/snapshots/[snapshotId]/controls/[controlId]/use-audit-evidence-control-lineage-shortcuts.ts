"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { isAuditEvidenceControlLineagePath } from "@/lib/audit-evidence-lineage-route";

type AuditEvidenceControlLineageShortcutHandlers = {
  readonly toggleChain: () => void;
  readonly copyLineageLink: () => void;
  readonly downloadPackage: () => void;
  readonly lineageLoaded: boolean;
};

/** Control lineage page shortcuts — Alt+1/2/3 when the route and lineage payload are active. */
export function useAuditEvidenceControlLineageShortcuts(
  handlers: AuditEvidenceControlLineageShortcutHandlers,
  options?: { readonly enabled?: boolean },
): void {
  const pathname = usePathname();
  const enabled = options?.enabled !== false;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled || !handlers.lineageLoaded) {
      return {};
    }

    return {
      "alt+1": {
        handler: () => {
          if (!isAuditEvidenceControlLineagePath(pathname)) {
            return;
          }

          handlers.toggleChain();
        },
        description: "Toggle chain of custody",
      },
      "alt+2": {
        handler: () => {
          if (!isAuditEvidenceControlLineagePath(pathname)) {
            return;
          }

          handlers.copyLineageLink();
        },
        description: "Copy lineage link",
      },
      "alt+3": {
        handler: () => {
          if (!isAuditEvidenceControlLineagePath(pathname)) {
            return;
          }

          handlers.downloadPackage();
        },
        description: "Download snapshot evidence bundle",
      },
    };
  }, [enabled, handlers, pathname]);

  useKeyboardShortcuts(shortcuts);
}
