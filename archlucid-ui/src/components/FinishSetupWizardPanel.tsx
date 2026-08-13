"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";
import {
  ONBOARDING_OPTIONAL_SETUP_DISMISS_DETAIL,
  ONBOARDING_OPTIONAL_SETUP_DISMISS_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  areFinishSetupRequiredStepsComplete,
  resolveFinishSetupWizardSteps,
} from "@/lib/finish-setup-wizard-steps";

const FINISH_SETUP_STORAGE_KEY = "archlucid.finishSetupWizard.completed.v1";

export type FinishSetupWizardPanelProps = {
  /** When nested under onboarding optional setup, use softer framing. */
  readonly variant?: "default" | "optional";
};

function readSetupDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(FINISH_SETUP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Guided post-deploy checklist: health, identity, and admin role. */
export function FinishSetupWizardPanel({ variant }: FinishSetupWizardPanelProps = {}): React.JSX.Element | null {
  const panelVariant = variant ?? "default";
  const { phase, context } = useFinishSetupReadinessContext();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readSetupDismissed());
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(FINISH_SETUP_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setDismissed(true);
  }, []);

  if (dismissed || phase === "loading" || context === null) {
    return null;
  }

  const ctx = context;
  const setupSteps = resolveFinishSetupWizardSteps();
  const allRequiredDone = areFinishSetupRequiredStepsComplete(ctx);

  return (
    <section id="finish-setup" className="scroll-mt-24" aria-labelledby="finish-setup-heading" data-testid="finish-setup-wizard">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle id="finish-setup-heading" className={OPERATOR_TYPOGRAPHY.body}>
              {panelVariant === "optional" ? "Optional workspace setup" : "Finish workspace setup"}
            </CardTitle>
            {allRequiredDone ? (
              <StatusTag kind="ready" label="Ready" />
            ) : (
              <StatusTag kind="neutral" label="Optional" />
            )}
          </div>
          <CardDescription>
            {panelVariant === "optional"
              ? "Configure identity, health, and tenant settings when you are ready. These steps are not required to complete your first review unless noted below."
              : "Complete these steps after infrastructure deploy so your team can run the first architecture review without manual secret-store configuration."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="m-0 list-decimal space-y-3 pl-5">
            {setupSteps.map((step) => {
              const done = step.isDone(ctx);

              return (
                <li key={step.id} className={OPERATOR_TYPOGRAPHY.body}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{step.label}</span>
                    {done ? (
                      <StatusTag kind="ready" label="Complete" />
                    ) : step.id === "identity" ? (
                      <StatusTag kind="neutral" label="Optional" />
                    ) : (
                      <StatusTag kind="draft" label="Not configured" />
                    )}
                  </div>
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">{step.description}</p>
                  <Link href={step.href} className={cn("mt-1 inline-block font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
                    {step.cta} →
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="space-y-1 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onDismiss}>
              {ONBOARDING_OPTIONAL_SETUP_DISMISS_LABEL}
            </Button>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ONBOARDING_OPTIONAL_SETUP_DISMISS_DETAIL}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
