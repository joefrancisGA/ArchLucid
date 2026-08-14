"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { Check, FileCheck, ListOrdered, Play, Rocket } from "lucide-react";
import type { ComponentType } from "react";
import { Fragment } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_START_REVIEW_QUICK_ACTION_LABEL } from "@/lib/operator/operator-nav-labels";

type PipelineStepStatus = "not-started" | "current" | "completed";

type PipelineStepConfig = {
  step: 1 | 2 | 3 | 4;
  stage: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  description: string;
  href: string;
  shortcut?: string;
  linkAccessibleName?: string;
};

const PIPELINE_STEPS: PipelineStepConfig[] = [
  {
    step: 1,
    stage: "Start",
    icon: Rocket,
    label: OPERATOR_START_REVIEW_QUICK_ACTION_LABEL,
    description: "Start an architecture review from a brief, documents, or optional cloud evidence.",
    href: "/architecture/reviews/new",
    shortcut: "Alt+N",
  },
  {
    step: 2,
    stage: "Track",
    icon: ListOrdered,
    label: "Track Progress",
    description: "Monitor pipeline progress and inspect review detail.",
    href: "/architecture/reviews",
    shortcut: "Alt+R",
    linkAccessibleName: "Reviews",
  },
  {
    step: 3,
    stage: "Finalize",
    icon: Play,
    label: "Finalize review",
    description: "Finalize the sealed review record and export deliverables.",
    href: "/architecture/reviews",
  },
  {
    step: 4,
    stage: "Review",
    icon: FileCheck,
    label: "Review exports",
    description: "Review, download, and share architecture deliverables.",
    href: "/architecture/reviews",
  },
];

function PipelineConnectorBar() {
  return (
    <div className="flex w-5 shrink-0 items-center justify-center self-center" aria-hidden>
      <div className="h-0.5 w-4 shrink-0 rounded-full bg-teal-300 dark:bg-teal-700" />
    </div>
  );
}

/**
 * Product-layer cards for operator home — replaces the prior prose-heavy glossary sections.
 * Four action cards for Core Pilot + two summary cards for optional maturity layers.
 */
export function OperatorHomeGlossarySections() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section className="mt-1 mb-2" aria-labelledby="quick-actions-heading">
      <h3 id="quick-actions-heading" className="sr-only">
        Quick actions
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
        {PIPELINE_STEPS.map((config) => (
          <ActionCard key={config.step} {...config} shortcut={buyerPolishedShell ? undefined : config.shortcut} />
        ))}
      </div>
      <div className="hidden lg:flex lg:items-stretch lg:gap-0">
        {PIPELINE_STEPS.map((config, index) => (
          <Fragment key={config.step}>
            <div className="min-w-0 flex-1">
              <ActionCard {...config} shortcut={buyerPolishedShell ? undefined : config.shortcut} />
            </div>
            {index < PIPELINE_STEPS.length - 1 ? <PipelineConnectorBar /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

type ActionCardProps = PipelineStepConfig & {
  /** Optional stepper state for future pipeline UX; omitted = all steps use the default “current” emphasis. */
  pipelineStatus?: PipelineStepStatus;
  /** Optional buyer-polished hint shown on hover/focus. */
  tooltip?: string;
};

function StepIndicator({ step, pipelineStatus }: { step: 1 | 2 | 3 | 4; pipelineStatus?: PipelineStepStatus }) {
  const resolved: PipelineStepStatus = pipelineStatus ?? "current";
  const base = cn(
    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-bold leading-none",
    OPERATOR_TYPOGRAPHY.micro,
  );

  if (resolved === "completed") {
    return (
      <span
        className={`${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300`}
        aria-hidden
      >
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
      </span>
    );
  }

  if (resolved === "not-started") {
    return (
      <span
        className={`${base} bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400`}
        aria-hidden
      >
        {step}
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-300`}
      aria-hidden
    >
      {step}
    </span>
  );
}

function ActionCard({
  step,
  stage,
  icon: Icon,
  label,
  description,
  href,
  shortcut,
  linkAccessibleName,
  pipelineStatus,
  tooltip,
}: ActionCardProps) {
  const link = (
    <Link
      href={href}
      aria-label={linkAccessibleName}
      className={`group flex h-full flex-col gap-2 rounded-lg border p-4 no-underline transition-shadow ${
        pipelineStatus === "current"
          ? "border-neutral-300 bg-al-surface-raised shadow-md ring-1 ring-[var(--al-accent-border-focus)]/20 hover:shadow-lg dark:border-neutral-600 dark:bg-neutral-800/80"
          : "border-neutral-200 bg-white shadow-sm hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
      }`}
    >
      <div className="flex items-start gap-2">
        <StepIndicator step={step} pipelineStatus={pipelineStatus} />
        <div className="min-w-0 flex flex-col gap-0">
          <span className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-500")}>
            {stage}
          </span>
          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            Step {step}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-7 w-7 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden />
        <span className={cn("font-bold text-neutral-900 group-hover:text-teal-800 dark:text-neutral-100 dark:group-hover:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
          {label}
        </span>
        {shortcut ? (
          <kbd className={cn("ml-auto rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
            {shortcut}
          </kbd>
        ) : null}
      </div>
      <span className={cn("leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{description}</span>
    </Link>
  );

  if (tooltip !== undefined && tooltip.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-left">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
