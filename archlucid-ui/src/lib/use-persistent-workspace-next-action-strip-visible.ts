"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CORE_PILOT_STEPS } from "@/lib/core-pilot-steps";
import { isPersistentWorkspaceNextActionStripPath } from "@/lib/persistent-workspace-next-action-strip-path";
import { resolveCorePilotStepPresentation } from "@/lib/core-pilot-step-presentation";
import { resolvePersistentWorkspaceNextAction } from "@/lib/persistent-workspace-next-action";
import { useCorePilotCommitPresentationContext } from "@/lib/use-core-pilot-commit-presentation-context";
import { useCorePilotDerivedStepStatus } from "@/lib/use-core-pilot-derived-step-status";

/** True when {@link PersistentWorkspaceNextActionStrip} would render (hydrated, loaded, steps remain). */
export function usePersistentWorkspaceNextActionStripVisible(): boolean {
  const pathname = usePathname() ?? "/";
  const [hydrated, setHydrated] = useState(false);
  const commitPresentationContext = useCorePilotCommitPresentationContext();
  const { progress, nextStepIndex, isPending } = useCorePilotDerivedStepStatus();

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!isPersistentWorkspaceNextActionStripPath(pathname) || !hydrated || isPending) {
    return false;
  }

  const nextStep = nextStepIndex !== null ? CORE_PILOT_STEPS[nextStepIndex] : null;
  const nextPresentation =
    nextStepIndex !== null
      ? resolveCorePilotStepPresentation(nextStepIndex, commitPresentationContext)
      : null;

  return (
    resolvePersistentWorkspaceNextAction(
      progress,
      nextPresentation?.href ?? null,
      nextPresentation?.label ?? null,
      nextStep?.title ?? null,
    ) !== null
  );
}
