"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyboardShortcutsHelpContent } from "@/components/KeyboardShortcutsHelpContent";

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
  const [helpOpen, setHelpOpen] = useState(false);
  const showBuiltInHelpDialog = onHelpRequested === undefined;

  return (
    <>
      {children}

      {showBuiltInHelpDialog ? (
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Keyboard shortcuts</DialogTitle>
              <DialogDescription>
                Press Alt + key to navigate. Works anywhere except inside text inputs.
              </DialogDescription>
            </DialogHeader>
            <KeyboardShortcutsHelpContent />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
