"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

const HUB_TAB_SHORTCUT_ORDER: readonly ResourceHubTab[] = [
  "overview",
  "drift",
  "diagram",
  "terraform",
  "findings",
  "remediation",
  "audit",
];

const SEQUENCE_TIMEOUT_MS = 1_200;

export type UseResourceHubShortcutsOptions = {
  readonly enabled?: boolean;
  readonly setActiveTab: (tab: ResourceHubTab) => void;
  readonly explorerHref: string;
};

export function useResourceHubShortcuts(options: UseResourceHubShortcutsOptions): void {
  const { enabled = true, setActiveTab, explorerHref } = options;
  const router = useRouter();
  const pendingGRef = useRef(false);
  const pendingGTimerRef = useRef<number | null>(null);

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    const map: KeyboardShortcutsMap = {};

    HUB_TAB_SHORTCUT_ORDER.forEach((tab, index) => {
      map[`alt+${index + 1}`] = {
        handler: () => {
          setActiveTab(tab);
        },
        description: `Switch to resource hub ${tab} tab`,
      };
    });

    return map;
  }, [enabled, setActiveTab]);

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const clearPendingG = () => {
      pendingGRef.current = false;

      if (pendingGTimerRef.current != null) {
        window.clearTimeout(pendingGTimerRef.current);
        pendingGTimerRef.current = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLElement
        && (target.tagName === "INPUT"
          || target.tagName === "TEXTAREA"
          || target.tagName === "SELECT"
          || target.isContentEditable)
      ) {
        clearPendingG();
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey) {
        clearPendingG();
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "g") {
        clearPendingG();
        pendingGRef.current = true;
        pendingGTimerRef.current = window.setTimeout(() => {
          clearPendingG();
        }, SEQUENCE_TIMEOUT_MS);
        return;
      }

      if (pendingGRef.current && key === "e") {
        event.preventDefault();
        clearPendingG();
        router.push(explorerHref);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearPendingG();
    };
  }, [enabled, explorerHref, router]);
}
