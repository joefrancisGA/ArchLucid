"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  advanceOperateNavUnlockToGovernance,
  readOperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";

/** Prompt to unlock governance nav group after first commit (phase 2). */
export function OperateGovernanceUnlockPrompt() {
  const [phase, setPhase] = useState<1 | 2>(2);

  useEffect(() => {
    setPhase(readOperateNavUnlockPhase());
  }, []);

  if (phase >= 2) {
    return null;
  }

  return (
    <div
      className="mx-2 mb-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid="operate-governance-unlock-prompt"
    >
      <p className="m-0 mb-2 text-neutral-700 dark:text-neutral-300">
        Governance workflow unlocks after your first committed review. One click reveals audit, alerts, and policy packs in the sidebar.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 w-full"
        onClick={() => {
          advanceOperateNavUnlockToGovernance();
          setPhase(2);
          window.location.reload();
        }}
      >
        Show governance workflow
      </Button>
    </div>
  );
}
