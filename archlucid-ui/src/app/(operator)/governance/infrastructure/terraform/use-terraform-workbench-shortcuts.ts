"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { isInfraTerraformWorkbenchPath } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";

/** Terraform mapping workbench page shortcuts — Alt+1 focuses the scope picker. */
export function useTerraformWorkbenchShortcuts(
  focusScopePicker: () => void,
  options?: { readonly enabled?: boolean },
): void {
  const pathname = usePathname();
  const enabled = options?.enabled !== false;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    return {
      "alt+1": {
        handler: () => {
          if (!isInfraTerraformWorkbenchPath(pathname)) {
            return;
          }

          focusScopePicker();
        },
        description: "Focus cloud resource scope picker",
        allowInInput: true,
      },
    };
  }, [enabled, focusScopePicker, pathname]);

  useKeyboardShortcuts(shortcuts);
}
