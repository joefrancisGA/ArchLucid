"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  areFinishSetupRequiredStepsComplete,
  FINISH_SETUP_WIZARD_STEPS,
} from "@/lib/finish-setup-wizard-steps";

const FINISH_SETUP_STORAGE_KEY = "archlucid.finishSetupWizard.completed.v1";

export type FinishSetupWizardPanelProps = {
  /** When nested under onboarding optional setup, use softer framing. */
  readonly variant?: "default" | "optional";
};

const SETUP_STEPS = FINISH_SETUP_WIZARD_STEPS;

function readSetupCompleted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(FINISH_SETUP_STORAGE_KEY) === "1";
  }
  catch {
    return false;
  }
}

/** Guided post-deploy checklist: health, identity, admin role, optional extractor. */
export function FinishSetupWizardPanel({ variant }: FinishSetupWizardPanelProps = {}): React.JSX.Element | null {
  const panelVariant = variant ?? "default";
  const { phase, context } = useFinishSetupReadinessContext();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readSetupCompleted());
  }, []);

  const onMarkComplete = useCallback(() => {
    try {
      window.localStorage.setItem(FINISH_SETUP_STORAGE_KEY, "1");
    }
    catch {
      /* ignore */
    }

    setDismissed(true);
  }, []);

  if (dismissed || phase === "loading" || context === null) {
    return null;
  }

  const ctx = context;
  const allRequiredDone = areFinishSetupRequiredStepsComplete(ctx);

  return (
    <section id="finish-setup" className="scroll-mt-24" aria-labelledby="finish-setup-heading" data-testid="finish-setup-wizard">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle id="finish-setup-heading" className={OPERATOR_TYPOGRAPHY.body}>
              {panelVariant === "optional" ? "Optional workspace setup" : "Finish workspace setup"}
            </CardTitle>
            {allRequiredDone ? <StatusTag kind="ready" label="Required steps complete" /> : <StatusTag kind="needs-attention" label="Setup in progress" />}
          </div>
          <CardDescription>
            {panelVariant === "optional"
              ? "Configure identity, health, and tenant settings when you are ready. These steps are not required to complete your first review package unless noted below."
              : "Complete these steps after infrastructure deploy so your team can run the first architecture review without manual Key Vault edits."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="m-0 list-decimal space-y-3 pl-5">
            {SETUP_STEPS.map((step) => {
              const done = step.isDone(ctx);

              return (
                <li key={step.id} className={OPERATOR_TYPOGRAPHY.body}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{step.label}</span>
                    {done ? <StatusTag kind="ready" label="Done" /> : <StatusTag kind="needs-attention" label="Needs attention" />}
                  </div>
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">{step.description}</p>
                  <Link href={step.href} className={cn("mt-1 inline-block font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
                    {step.cta} →
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onMarkComplete}>
              Mark setup complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
