import Link from "next/link";

import { SecureNowPartialCaptureRecoveryLinks } from "@/components/product-line/SecureNowPartialCaptureRecoveryLinks";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowTimeToValueNextStep } from "@/lib/product-line/resolve-securenow-time-to-value-next-step";
import { SECURENOW_TIME_TO_VALUE_NOT_SLA_LINE } from "@/lib/product-line/securenow-time-to-value-next-step-copy";
import { cn } from "@/lib/utils";

export type SecureNowTimeToValueNextStepStripProps = {
  readonly testId: string;
  readonly nextStep: SecureNowTimeToValueNextStep;
  readonly middleLine?: string;
  readonly returnPath?: string | null;
  readonly partialCaptureSnapshotId?: string | null;
  readonly cloudConnectionsTestId: string;
  readonly extractUploadTestId: string;
};

export function SecureNowTimeToValueNextStepStrip(
  props: SecureNowTimeToValueNextStepStripProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid={props.testId}
      aria-label="SecureNow time-to-value next step"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.nextStep.lead}</p>
      {props.middleLine !== undefined ? (
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid={`${props.testId}-middle`}>
          {props.middleLine}
        </p>
      ) : null}
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid={`${props.testId}-not-sla`}>
        {SECURENOW_TIME_TO_VALUE_NOT_SLA_LINE}
      </p>
      <div className="mt-2">
        <Button type="button" variant="default" size="sm" asChild data-testid={`${props.testId}-primary-cta`}>
          <Link href={props.nextStep.href}>{props.nextStep.ctaLabel}</Link>
        </Button>
      </div>
      {props.nextStep.phase === "needs-second-capture" ? (
        <p className="m-0 mt-2" data-testid={`${props.testId}-recovery`}>
          <SecureNowPartialCaptureRecoveryLinks
            partialCaptureSnapshotId={props.partialCaptureSnapshotId ?? null}
            returnPath={props.returnPath ?? ""}
            cloudConnectionsTestId={props.cloudConnectionsTestId}
            extractUploadTestId={props.extractUploadTestId}
          />
        </p>
      ) : null}
    </section>
  );
}
