"use client";

import { useEffect } from "react";

type UseUnsavedChangesGuardArgs = {
  readonly when: boolean;
  readonly message?: string;
};

/** Browser tab close guard for architecture drafts with unsaved server state. */
export function useUnsavedChangesGuard(args: UseUnsavedChangesGuardArgs): void {
  useEffect(() => {
    if (!args.when) {
      return;
    }

    const message = args.message ?? "You have unsaved architecture changes.";

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = message;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [args.message, args.when]);
}
