import Link from "next/link";

import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GettingStartedStepLink = {
  readonly href: string;
  readonly label: string;
};

export type GettingStartedStepsProps = {
  heading: string;
  steps: readonly string[];
  stepLinkByIndex?: Readonly<Partial<Record<number, GettingStartedStepLink>>>;
  className?: string;
};

/**
 * Ordered “how it works” guidance for empty dashboards — keeps copy consistent across Alerts, Governance, etc.
 */
export function GettingStartedSteps({
  heading,
  steps,
  stepLinkByIndex,
  className,
}: GettingStartedStepsProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 px-4 py-3 text-left",
        className,
      )}
    >
      <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{heading}</p>
      <ol className={cn("mb-0 mt-2 list-decimal space-y-1.5 pl-5 leading-snug text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {steps.map((step, index) => {
          const link = stepLinkByIndex?.[index];

          return (
            <li key={index}>
              {link === undefined ? (
                <InlineGuidanceText text={step} />
              ) : (
                <span>
                  <InlineGuidanceText text={step} />{" "}
                  <Link href={link.href} className={OPERATOR_LINK.inline}>
                    {link.label}
                  </Link>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
