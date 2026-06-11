"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  OPERATOR_SHELL_PRESET_LABELS,
  OPERATOR_SHELL_PRESET_ORDER,
  OPERATOR_SHELL_PRESET_STORAGE_KEY,
  type OperatorShellPresetId,
  parseOperatorShellPresetId,
} from "@/lib/operator-nav-preset";

/** Compact nav preset switcher for the operator header rail. */
export function NavPresetQuickSwitcher(): React.JSX.Element | null {
  const [presetId, setPresetId] = useState<OperatorShellPresetId>("pilot_operator");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const raw = window.localStorage.getItem(OPERATOR_SHELL_PRESET_STORAGE_KEY);
      setPresetId(parseOperatorShellPresetId(raw));
    }
    catch {
      setPresetId("pilot_operator");
    }
  }, []);

  const onSelect = useCallback((id: OperatorShellPresetId) => {
    setPresetId(id);

    try {
      window.localStorage.setItem(OPERATOR_SHELL_PRESET_STORAGE_KEY, id);
      window.dispatchEvent(new Event("archlucid-nav-preset-changed"));
    }
    catch {
      /* ignore */
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="nav-preset-quick-switcher" aria-label="Navigation preset">
      {OPERATOR_SHELL_PRESET_ORDER.map((id) => (
        <Button
          key={id}
          type="button"
          variant={presetId === id ? "primary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          aria-pressed={presetId === id}
          onClick={() => {
            onSelect(id);
          }}
        >
          {OPERATOR_SHELL_PRESET_LABELS[id]}
        </Button>
      ))}
      <Link href="/help/operator-shell" className="sr-only">
        Navigation preset help
      </Link>
    </div>
  );
}
