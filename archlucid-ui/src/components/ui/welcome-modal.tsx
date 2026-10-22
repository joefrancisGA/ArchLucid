"use client";
import { cn } from "@/lib/utils";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CheckCircle2, FileText, LayoutDashboard, Package, Route, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ArchLucidLogo } from "@/components/brand/ArchLucidLogo";
import { ARCHLUCID_BRAND } from "@/components/brand/brand-colors";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  productLineDisplayName,
  productLineShowsArchLucidMark,
} from "@/lib/product-line/product-line-display-name";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { WELCOME_OPERATOR_EVIDENCE_STEP } from "@/lib/onboarding-secondary-surfaces";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type WelcomeModalProps = {
  readonly open: boolean;
  /** Invoked when the user dismisses the dialog (overlay, Esc, Skip for now). Persist welcome-modal storage in the parent. */
  readonly onDismiss: () => void;
  /** Operator first-run: closes the welcome modal and starts the guided tour at step 1. */
  readonly onStartTour?: () => void;
  /** Buyer-polished shell: sponsor-facing onboarding copy (avoids internal-operator framing). */
  readonly buyerShell?: boolean;
};

type StepDef = {
  readonly title: string;
  readonly description: string;
  readonly Icon: LucideIcon;
};

/** Operator first-run welcome — single screen before the guided tour. */
export const OPERATOR_FIRST_RUN_WELCOME = {
  title: "Welcome to ArchLucid",
  description:
    "Start architecture reviews, inspect evidence, track findings, and finalize reviews from this workspace.",
} as const;

const OPERATOR_WELCOME_STEPS: ReadonlyArray<StepDef> = [
  {
    title: OPERATOR_FIRST_RUN_WELCOME.title,
    description: OPERATOR_FIRST_RUN_WELCOME.description,
    Icon: LayoutDashboard,
  },
  {
    title: WELCOME_OPERATOR_EVIDENCE_STEP.title,
    description: WELCOME_OPERATOR_EVIDENCE_STEP.description,
    Icon: FileText,
  },
  {
    title: "Review AI findings",
    description:
      "When the review completes, open it to read findings, evidence, and narrative. Finalize when you are ready to lock the sealed review record and sponsor exports.",
    Icon: CheckCircle2,
  },
];

const BUYER_WELCOME_STEPS: ReadonlyArray<StepDef> = [
  {
    title: "Welcome to ArchLucid",
    description:
      "Walk through a completed sponsor revie — isk posture, evidence-linked findings, approval status, and audit-ready export — ithout advanced tooling upfront.",
    Icon: Package,
  },
  {
    title: "Start from sponsor report",
    description:
      "Open the sponsor workspace first for sponsor-ready posture and citations; drill into sealed review record, evidence traceability, and deliverables when you need deeper proof.",
    Icon: Users,
  },
  {
    title: "Optional pilot motion",
    description:
      "When your team is ready to evaluate authoring workflows, use Reviews from Help or the pilot checklis — reation flows stay separate from this polished viewing path.",
    Icon: Route,
  },
];

/**
 * Operator first-run welcome dialog, or a three-step buyer sequence. Uses Radix Dialog; parent controls `open` and owns persistence.
 */
export function WelcomeModal(props: WelcomeModalProps) {
  const { open, onDismiss, onStartTour, buyerShell = false } = props;
  const router = useRouter();
  const { productLine } = useProductLine();
  const showArchLucidMark = productLineShowsArchLucidMark(productLine);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = buyerShell ? BUYER_WELCOME_STEPS : OPERATOR_WELCOME_STEPS;
  const operatorFirstRun = !buyerShell && onStartTour !== undefined;

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

  const { Icon } = step;
  const title = operatorFirstRun ? OPERATOR_FIRST_RUN_WELCOME.title : step.title;
  const description = operatorFirstRun ? OPERATOR_FIRST_RUN_WELCOME.description : step.description;

  const goNext = () => {
    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const handleGetStartedInApp = () => {
    onDismiss();

    if (buyerShell) {
      router.push(`/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);

      return;
    }

    router.push("/architecture/reviews/new");
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
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        closeAriaLabel={operatorFirstRun ? "Skip for now" : "Close dialog"}
        data-testid="welcome-modal"
      >
        <div
          className="relative flex flex-col items-center overflow-hidden px-6 pb-5 pt-6"
          style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #142d4c 100%)" }}
        >
          <div className="pointer-events-none absolute -top-4 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#00AEEF]/15 blur-2xl" />

          <div
            className={cn(
              "relative mb-3 flex items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm",
              operatorFirstRun && !showArchLucidMark ? "h-10 px-3" : "h-14 w-14",
            )}
            data-testid={operatorFirstRun ? "welcome-modal-brand-mark" : undefined}
          >
            {operatorFirstRun ? (
              <ArchLucidLogo
                variant={showArchLucidMark ? "mark" : "compact"}
                size={36}
                title=""
                showMark={showArchLucidMark}
                wordmarkText={productLineDisplayName(productLine)}
                navyColor="#FFFFFF"
                tealColor={ARCHLUCID_BRAND.teal}
              />
            ) : (
              <Icon className="h-8 w-8 text-[#00AEEF]" aria-hidden="true" />
            )}
          </div>

          <DialogTitle className={cn("text-center font-bold text-white", OPERATOR_TYPOGRAPHY.pageTitle)}>{title}</DialogTitle>

          {operatorFirstRun ? null : (
            <div
              className="mt-3 flex items-center gap-1.5"
              aria-label={`Step ${stepIndex + 1} of ${steps.length}`}
            >
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={
                    i === stepIndex
                      ? "h-1.5 w-5 rounded-full bg-[#00AEEF] transition-all duration-300"
                      : "h-1.5 w-1.5 rounded-full bg-white/30 transition-all duration-300"
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          <DialogDescription className={cn("text-center leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {description}
          </DialogDescription>
        </div>

        <DialogFooter className="flex-col gap-2 border-t border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40 sm:flex-col">
          {operatorFirstRun ? (
            <div className="flex w-full flex-wrap justify-center gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={onDismiss}>
                Skip for now
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  onStartTour();
                }}
              >
                Start tour
              </Button>
            </div>
          ) : !isLastStep ? (
            <>
              <div className="flex w-full flex-wrap justify-center gap-2 sm:justify-end">
                <Button type="button" variant="outline" onClick={onDismiss}>
                  Skip tour
                </Button>
                <Button type="button" variant="primary" onClick={goNext}>
                  Next
                </Button>
              </div>

              {stepIndex > 0 ? (
                <Button type="button" variant="outline" className="self-center" onClick={goBack}>
                  Back
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex w-full flex-col items-stretch gap-2 sm:items-end">
                <Button
                  type="button"
                  variant="primary"
                  className={CTA_WIDTH.formMatch}
                  onClick={handleGetStartedInApp}
                >
                  {buyerShell ? "Open sample sponsor report" : "Get started — new review"}
                </Button>
                <Button type="button" variant="secondary" className={CTA_WIDTH.formMatch} asChild>
                  <Link href="/quick-scan" onClick={onDismiss}>
                    Try Quick Scan (no sign-in demo)
                  </Link>
                </Button>
              </div>

              <div className="flex w-full flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={goBack}>
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-neutral-600 dark:text-neutral-400"
                  asChild
                >
                  <Link href="/architecture/reviews" onClick={onDismiss}>
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
