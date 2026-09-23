"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyboardShortcutsHelpContent } from "@/components/KeyboardShortcutsHelpContent";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useShortcutNavigation } from "@/hooks/useShortcutNavigation";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  keyboardShortcutsDialogHrefFromSearch,
  parseKeyboardShortcutsOpenFromSearch,
} from "@/lib/operator/keyboard-shortcuts-dialog-url";

export type KeyboardShortcutProviderProps = {
  children: ReactNode;
  /** When set (e.g. from App shell), Shift+? invokes this instead of the built-in shortcuts-only dialog. */
  onHelpRequested?: () => void;
};

/**
 * Deferred help overlay only — navigation shortcuts mount synchronously via
 * {@link AppShellSyncKeyboardShortcutListener}.
 */
export function KeyboardShortcutProvider({ children, onHelpRequested }: KeyboardShortcutProviderProps) {
  const pathname = usePathname() ?? "/";
  const { isWorkingMode } = useWorkspaceMode();
  const [helpOpen, setHelpOpenState] = useState(() =>
    parseKeyboardShortcutsOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("shortcutsOpen"),
    ),
  );
  const helpOpenRef = useRef(helpOpen);
  helpOpenRef.current = helpOpen;
  const showBuiltInHelpDialog = onHelpRequested === undefined;

  const syncShortcutsOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        keyboardShortcutsDialogHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setHelpOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setHelpOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (helpOpenRef.current === next) {
          return current;
        }

        helpOpenRef.current = next;
        syncShortcutsOpenToUrl(next);

        return next;
      });
    },
    [syncShortcutsOpenToUrl],
  );

  useEffect(() => {
    const syncHelpOpenFromUrl = (): void => {
      const next = parseKeyboardShortcutsOpenFromSearch(
        new URLSearchParams(window.location.search).get("shortcutsOpen"),
      );

      if (helpOpenRef.current === next) {
        return;
      }

      helpOpenRef.current = next;
      setHelpOpenState(next);
    };

    syncHelpOpenFromUrl();
    window.addEventListener("popstate", syncHelpOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncHelpOpenFromUrl);
    };
  }, []);

  useShortcutNavigation({
    onHelpRequested: showBuiltInHelpDialog ? () => setHelpOpen(true) : onHelpRequested,
  });

  return (
    <>
      {children}

      {showBuiltInHelpDialog ? (
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Keyboard shortcuts</DialogTitle>
              <DialogDescription>
                {isWorkingMode
                  ? "Desk work shortcuts are listed first. Press Alt + key to navigate when focus is not in a text field."
                  : "Press Alt + key to navigate. Works anywhere except inside text inputs."}
              </DialogDescription>
            </DialogHeader>
            <KeyboardShortcutsHelpContent />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
