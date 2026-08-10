"use client";

import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import {
  ENTERPRISE_ONBOARDING_HUB_STEPS,
  type EnterpriseOnboardingHubStepLink,
} from "@/lib/enterprise-onboarding-hub-steps";
import { enterpriseOnboardingStepStatusTag } from "@/lib/enterprise-onboarding-step-status";
import { useEnterpriseOnboardingDerivedStepStatus } from "@/lib/use-enterprise-onboarding-derived-step-status";
import { OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function HubStepLinks(props: {
  readonly primaryLink: EnterpriseOnboardingHubStepLink;
  readonly secondaryLinks?: readonly EnterpriseOnboardingHubStepLink[];
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link className={cn(OPERATOR_LINK.stepPill, "no-underline")} href={props.primaryLink.href}>
        {props.primaryLink.label}
      </Link>
      {props.secondaryLinks?.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          className={cn(OPERATOR_LINK.stepPill, "no-underline")}
          href={link.href}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

/** Tracked onboarding hub for `/help/enterprise-onboarding` — status is not derived from tenant APIs yet. */
export function EnterpriseOnboardingHubSteps(): React.JSX.Element {
  const { statuses, progress } = useEnterpriseOnboardingDerivedStepStatus();

  return (
    <section
      id="onboarding-hub"
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24 space-y-4")}
      data-testid="enterprise-onboarding-hub-steps"
    >
      <div className="space-y-1">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Onboarding hub</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Use this checklist to track hosted SaaS enterprise onboarding. For task-specific guidance, open each step.
        </p>
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}
          data-testid="enterprise-onboarding-hub-progress"
        >
          {progress.completedCount} of {progress.totalCount} steps tracked in ArchLucid
        </p>
      </div>

      <ol className="m-0 list-none space-y-4 p-0">
        {ENTERPRISE_ONBOARDING_HUB_STEPS.map((step, index) => {
          const stepStatus = statuses[index] ?? "not-tracked";
          const statusTag = enterpriseOnboardingStepStatusTag(stepStatus);

          return (
            <li
              key={step.title}
              className="border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0 dark:border-neutral-800"
              data-testid={`enterprise-onboarding-hub-step-${index + 1}`}
            >
              <div className="flex flex-wrap items-start gap-2">
                <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {index + 1}. {step.title}
                </span>
                <StatusTag kind={statusTag.kind} label={statusTag.label} />
              </div>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
                Owner: {step.owner}
              </p>
              <div className="mt-2">
                <HubStepLinks primaryLink={step.primaryLink} secondaryLinks={step.secondaryLinks} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
