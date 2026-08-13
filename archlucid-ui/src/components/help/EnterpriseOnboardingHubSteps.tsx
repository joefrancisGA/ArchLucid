"use client";

import Link from "next/link";

import {
  ENTERPRISE_ONBOARDING_HUB_STEPS,
  isEnterpriseOnboardingInPageAnchorHref,
  type EnterpriseOnboardingHubStepLink,
} from "@/lib/enterprise-onboarding-hub-steps";
import { OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function HubStepLink(props: {
  readonly link: EnterpriseOnboardingHubStepLink;
  readonly stepTitle: string;
  readonly emphasizeRecommended: boolean;
}): React.JSX.Element | null {
  const { link, stepTitle, emphasizeRecommended } = props;

  // Title already deep-links when the primary anchor label duplicates the step title.
  if (isEnterpriseOnboardingInPageAnchorHref(link.href) && link.label === stepTitle) {
    return null;
  }

  if (isEnterpriseOnboardingInPageAnchorHref(link.href)) {
    return (
      <Link className={cn(OPERATOR_LINK.step, "no-underline")} href={link.href}>
        {link.label}
      </Link>
    );
  }

  return (
    <Link
      className={cn(
        OPERATOR_LINK.stepPill,
        emphasizeRecommended ? OPERATOR_LINK.stepPillRecommended : undefined,
        "no-underline",
      )}
      href={link.href}
    >
      {link.label}
    </Link>
  );
}

function HubStepLinks(props: {
  readonly stepTitle: string;
  readonly primaryLink: EnterpriseOnboardingHubStepLink;
  readonly secondaryLinks?: readonly EnterpriseOnboardingHubStepLink[];
  readonly emphasizeRecommended: boolean;
}): React.JSX.Element | null {
  const links = [props.primaryLink, ...(props.secondaryLinks ?? [])].map((link) => (
    <HubStepLink
      key={`${link.href}-${link.label}`}
      link={link}
      stepTitle={props.stepTitle}
      emphasizeRecommended={props.emphasizeRecommended && !isEnterpriseOnboardingInPageAnchorHref(link.href)}
    />
  ));

  const visibleLinks = links.filter((link) => link !== null);

  if (visibleLinks.length === 0) {
    return null;
  }

  return <div className="flex flex-wrap items-center gap-2">{visibleLinks}</div>;
}

function HubStepTitle(props: {
  readonly index: number;
  readonly title: string;
  readonly primaryLink: EnterpriseOnboardingHubStepLink;
}): React.JSX.Element {
  const titleText = `${props.index + 1}. ${props.title}`;

  if (isEnterpriseOnboardingInPageAnchorHref(props.primaryLink.href)) {
    return (
      <Link
        className={cn(OPERATOR_LINK.step, "font-semibold", OPERATOR_TYPOGRAPHY.body)}
        href={props.primaryLink.href}
      >
        {titleText}
      </Link>
    );
  }

  return <span className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{titleText}</span>;
}

/** Eight-step onboarding index for `/help/enterprise-onboarding`. */
export function EnterpriseOnboardingHubSteps(): React.JSX.Element {
  return (
    <section
      id="onboarding-hub"
      className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "scroll-mt-24 space-y-4")}
      data-testid="enterprise-onboarding-hub-steps"
    >
      <div className="space-y-1">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>Onboarding hub</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Use this checklist for hosted SaaS enterprise onboarding. Open each step for task-specific guidance.
        </p>
      </div>

      <ol className="m-0 list-none space-y-4 p-0">
        {ENTERPRISE_ONBOARDING_HUB_STEPS.map((step, index) => {
          const recommendedNext = index === 0;

          return (
            <li
              key={step.title}
              className="border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0 dark:border-neutral-800"
              data-testid={`enterprise-onboarding-hub-step-${index + 1}`}
              data-recommended-next={recommendedNext ? "true" : undefined}
            >
              <div className="flex flex-wrap items-start gap-2">
                <HubStepTitle index={index} title={step.title} primaryLink={step.primaryLink} />
                {recommendedNext ? (
                  <span
                    className={cn("font-medium text-teal-900 dark:text-teal-200", OPERATOR_TYPOGRAPHY.micro)}
                    data-testid="enterprise-onboarding-hub-recommended-next"
                  >
                    Recommended next
                  </span>
                ) : null}
              </div>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
                Owner: {step.owner}
              </p>
              <div className="mt-2">
                <HubStepLinks
                  stepTitle={step.title}
                  primaryLink={step.primaryLink}
                  secondaryLinks={step.secondaryLinks}
                  emphasizeRecommended={recommendedNext}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
