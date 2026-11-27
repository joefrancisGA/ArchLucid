import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowAdoptionFrictionNextStep } from "@/lib/product-line/resolve-securenow-adoption-friction-next-step";
import { SECURENOW_ADOPTION_FRICTION_NOT_CERTIFICATION_LINE } from "@/lib/product-line/securenow-adoption-friction-next-step-copy";
import { cn } from "@/lib/utils";

export type SecureNowAdoptionFrictionNextStepStripProps = {
  readonly testId: string;
  readonly nextStep: SecureNowAdoptionFrictionNextStep;
};

export function SecureNowAdoptionFrictionNextStepStrip(
  props: SecureNowAdoptionFrictionNextStepStripProps,
): React.JSX.Element {
  const blockerKindTestId = props.testId + "-blocker-kind";
  const notCertificationTestId = props.testId + "-not-certification";
  const primaryCtaTestId = props.testId + "-primary-cta";

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid={props.testId}
      aria-label="SecureNow adoption friction next step"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.nextStep.lead}</p>
      {props.nextStep.blockerKindLine !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={blockerKindTestId}>
          {props.nextStep.blockerKindLine}
        </p>
      ) : null}
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={notCertificationTestId}>
        {SECURENOW_ADOPTION_FRICTION_NOT_CERTIFICATION_LINE}
      </p>
      <div className="mt-2">
        <Button type="button" variant="default" size="sm" asChild data-testid={primaryCtaTestId}>
          <Link href={props.nextStep.href}>{props.nextStep.ctaLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
