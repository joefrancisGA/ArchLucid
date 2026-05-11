"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type WelcomeModalProps = {
  readonly open: boolean;
  /** Invoked when the user dismisses the dialog (overlay, Esc, close, Skip, or after Get Started). Persist storage in the parent. */
  readonly onDismiss: () => void;
  /** Buyer-polished shell: executive-facing onboarding copy (avoids internal-operator framing). */
  readonly buyerShell?: boolean;
};

type StepDef = {
  readonly title: string;
  readonly description: string;
};

const OPERATOR_WELCOME_STEPS: ReadonlyArray<StepDef> = [
  {
    title: "Welcome to ArchLucid",
    description:
      "You are in the operator workspace — where teams run governed architecture reviews, track pipeline progress, and export review packages.",
  },
  {
    title: "Define your architecture",
    description:
      "Start with a short brief: system identity, goals, and constraints. The new review wizard submits a pipeline run and keeps you on the critical path to a finalized package.",
  },
  {
    title: "Review AI findings",
    description:
      "When the pipeline completes, open a review to read findings, evidence, and narrative. Finalize when you are ready to lock the reviewed manifest and deliverables.",
  },
];

const BUYER_WELCOME_STEPS: ReadonlyArray<StepDef> = [
  {
    title: "Welcome to ArchLucid",
    description:
      "Walk through a completed executive review package—risk posture, evidence-linked findings, governance status, and audit-ready exports—without operator tooling upfront.",
  },
  {
    title: "Start from executive summary",
    description:
      "Open the executive workspace first for sponsor-ready posture and citations; drill into manifest, evidence traceability, and deliverables when you need deeper proof.",
  },
  {
    title: "Optional pilot motion",
    description:
      "When your team is ready to evaluate authoring workflows, use Reviews from Help or the pilot checklist—creation flows stay separate from this polished viewing path.",
  },
];

/**
 * Three-step welcome sequence for first-time operators. Uses Radix Dialog; parent controls `open` and owns persistence.
 */
export function WelcomeModal(props: WelcomeModalProps) {
  const { open, onDismiss, buyerShell = false } = props;
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const steps = buyerShell ? BUYER_WELCOME_STEPS : OPERATOR_WELCOME_STEPS;

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  const step = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;

  if (step === undefined) {
    return null;
  }

  const goNext = () => {
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleGetStartedInApp = () => {
    onDismiss();

    if (buyerShell) {
      router.push(`/executive/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);

      return;
    }

    router.push("/reviews/new");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onDismiss();
        }
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" data-testid="welcome-modal">
        <div className="space-y-4 p-6 pb-2">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Step {stepIndex + 1} of {steps.length}
          </p>
          <DialogHeader className="space-y-3 text-center sm:text-center">
            <DialogTitle className="text-xl">{step.title}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">{step.description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="flex-col gap-3 border-t border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40 sm:flex-col sm:space-x-0">
          {!isLastStep ? (
            <>
              <div className="flex w-full flex-wrap justify-center gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={onDismiss}>
                  Skip tour
                </Button>
                <Button type="button" variant="default" className="bg-teal-600 hover:bg-teal-700" onClick={goNext}>
                  Next
                </Button>
              </div>
              {stepIndex > 0 ? (
                <Button type="button" variant="ghost" className="self-center text-sm" onClick={goBack}>
                  Back
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex w-full flex-col gap-2">
                <Button
                  type="button"
                  variant="default"
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={handleGetStartedInApp}
                >
                  {buyerShell ? "Open sample executive summary" : "Get started — new review"}
                </Button>
                <Button type="button" variant="secondary" className="w-full" asChild>
                  <Link href="/quick-scan" onClick={onDismiss}>
                    Try Quick Scan (no sign-in demo)
                  </Link>
                </Button>
              </div>
              <div className="flex w-full flex-wrap justify-center gap-2">
                <Button type="button" variant="ghost" className="text-sm" onClick={goBack}>
                  Back
                </Button>
                <Button type="button" variant="ghost" className="text-sm text-neutral-600 dark:text-neutral-400" asChild>
                  <Link href="/reviews?projectId=default" onClick={onDismiss}>
                    Browse reviews
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
