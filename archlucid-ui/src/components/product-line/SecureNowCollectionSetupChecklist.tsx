"use client";

import Link from "next/link";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import {
  resolveSecureNowCollectionSetupEmphasizedStepId,
  resolveSecureNowCollectionSetupStepRecoveryHref,
  resolveSecureNowCollectionSetupSteps,
  SECURENOW_COLLECTION_SETUP_CHECKLIST_TITLE,
} from "@/lib/product-line/securenow-collection-setup-checklist";
import { cn } from "@/lib/utils";

export type SecureNowCollectionSetupChecklistProps = {
  readonly input: SecureNowCollectionMissingInput;
  readonly testIdPrefix: string;
  readonly titleHeadingLevel?: "helper" | "cardTitle";
  readonly suppressRecoveryLink?: boolean;
};

export function SecureNowCollectionSetupChecklist(
  props: SecureNowCollectionSetupChecklistProps,
): React.JSX.Element {
  const steps = resolveSecureNowCollectionSetupSteps(props.input);
  const emphasizedStepId = resolveSecureNowCollectionSetupEmphasizedStepId(props.input);
  const emphasizedStep = steps.find((step) => step.id === emphasizedStepId && !step.complete);
  const recoveryHref = resolveSecureNowCollectionSetupStepRecoveryHref(emphasizedStepId);

  return (
    <div className="space-y-2" data-testid={`${props.testIdPrefix}-collection-setup-checklist`}>
      <IntegrationConnectChecklist
        title={SECURENOW_COLLECTION_SETUP_CHECKLIST_TITLE}
        titleHeadingLevel={props.titleHeadingLevel ?? "helper"}
        steps={steps}
        emphasizedStepId={emphasizedStepId}
        testIdPrefix={props.testIdPrefix}
      />
      {emphasizedStep !== undefined && props.suppressRecoveryLink !== true ? (
        <p
          className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${props.testIdPrefix}-collection-setup-next`}
        >
          Next incomplete step:{" "}
          <Link href={recoveryHref} className={OPERATOR_LINK.inline}>
            {emphasizedStep.label}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
