"use client";

import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";

export type UseRemediationPatternsShortcutsOptions = {
  readonly onImportYaml: () => void;
  readonly importEnabled: boolean;
  readonly onApprove: () => void;
  readonly approveEnabled: boolean;
};

export function useRemediationPatternsShortcuts(options: UseRemediationPatternsShortcutsOptions): void {
  const map = useMemo((): KeyboardShortcutsMap => {
    const shortcuts: KeyboardShortcutsMap = {};

    if (options.importEnabled) {
      shortcuts["ctrl+enter"] = {
        description: "Import remediation pattern YAML as Draft",
        allowInInput: true,
        handler: () => {
          options.onImportYaml();
        },
      };

      shortcuts["meta+enter"] = {
        description: "Import remediation pattern YAML as Draft",
        allowInInput: true,
        handler: () => {
          options.onImportYaml();
        },
      };
    }

    if (options.approveEnabled) {
      shortcuts.a = {
        description: "Approve selected pattern version",
        handler: () => {
          options.onApprove();
        },
      };
    }

    return shortcuts;
  }, [options]);

  useKeyboardShortcuts(map);
}
