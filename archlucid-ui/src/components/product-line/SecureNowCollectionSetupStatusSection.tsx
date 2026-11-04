"use client";

import Link from "next/link";

import { SecureNowCollectionSetupChecklist } from "@/components/product-line/SecureNowCollectionSetupChecklist";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import {
  formatSecureNowCollectionSetupProgressSummary,
  isSecureNowCollectionSetupComplete,
} from "@/lib/product-line/format-securenow-collection-setup-progress";
import { cn } from "@/lib/utils";

export type SecureNowCollectionSetupStatusSectionProps = {
  readonly testIdPrefix: string;
  readonly sectionId?: string;
};

export function SecureNowCollectionSetupStatusSection(
  props: SecureNowCollectionSetupStatusSectionProps,
): React.JSX.Element {
  const { collectionInput, isPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
  });

  if (isPending || collectionInput === null) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`${props.testIdPrefix}-collection-setup-loading`}
      >
        Loading collection setup status…
      </p>
    );
  }

  const collectionReady = isSecureNowCollectionSetupComplete(collectionInput);

  return (
    <section
      id={props.sectionId}
      aria-labelledby={`${props.testIdPrefix}-collection-setup-heading`}
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid={`${props.testIdPrefix}-collection-setup`}
    >
      <h2
        id={`${props.testIdPrefix}-collection-setup-heading`}
        className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Collection setup
      </h2>
      {collectionReady ? (
        <div className="space-y-2" data-testid={`${props.testIdPrefix}-collection-ready`}>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Collection ready.</p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              href={SECURENOW_REMEDIATION_FACTORY_PATH}
              className={OPERATOR_LINK.inline}
              data-testid={`${props.testIdPrefix}-collection-ready-path-inspect-link`}
            >
              Open Path inspect
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`${props.testIdPrefix}-collection-setup-progress`}
          >
            {formatSecureNowCollectionSetupProgressSummary(collectionInput)}
          </p>
          <SecureNowCollectionSetupChecklist
            input={collectionInput}
            testIdPrefix={props.testIdPrefix}
            titleHeadingLevel="helper"
          />
        </>
      )}
    </section>
  );
}
