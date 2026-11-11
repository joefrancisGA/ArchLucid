"use client";

import Link from "next/link";

import { SecureNowCollectionPrimaryBlockerLine } from "@/components/product-line/SecureNowCollectionPrimaryBlockerLine";
import { SecureNowCollectionSetupChecklist } from "@/components/product-line/SecureNowCollectionSetupChecklist";
import { SecureNowCollectionLatestSnapshotLine } from "@/components/product-line/SecureNowCollectionLatestSnapshotLine";
import { SecureNowWorkspaceApiUnreachableNotice } from "@/components/product-line/SecureNowWorkspaceApiUnreachableNotice";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { useSecureNowLatestSucceededSnapshotId } from "@/hooks/use-securenow-latest-succeeded-snapshot-id";
import type { SecureNowCollectionMissingInput } from "@/lib/product-line/securenow-collection-missing-reason";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { EXTRACT_UPLOAD_PATH } from "@/lib/administration/extract-upload-demo-scenario-url";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { resolveSecureNowCollectionPrimaryBlocker } from "@/lib/product-line/securenow-collection-setup-checklist";
import {
  formatSecureNowCollectionSetupProgressSummary,
  isSecureNowCollectionSetupComplete,
} from "@/lib/product-line/format-securenow-collection-setup-progress";
import { SECURENOW_COLLECTION_SETUP_API_UNREACHABLE } from "@/lib/product-line/securenow-workspace-api-unreachable-copy";
import {
  resolveSecureNowCollectionReadyNextHref,
  resolveSecureNowCollectionReadyNextLinkLabel,
  SECURENOW_COLLECTION_READY_NEXT_LABEL,
  SECURENOW_COLLECTION_READY_NEXT_SUMMARY,
} from "@/lib/product-line/securenow-collection-setup-ready-copy";
import { cn } from "@/lib/utils";

export type SecureNowCollectionSetupStatusSectionProps = {
  readonly testIdPrefix: string;
  readonly sectionId?: string;
  /** When set, skips the cloud-connection fetch and uses this snapshot (for example cloud connections page props). */
  readonly collectionInput?: SecureNowCollectionMissingInput;
};

export function SecureNowCollectionSetupStatusSection(
  props: SecureNowCollectionSetupStatusSectionProps,
): React.JSX.Element {
  const hookResult = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
    enabled: props.collectionInput === undefined,
  });
  const latestSnapshotQuery = useSecureNowLatestSucceededSnapshotId();
  const collectionInput = props.collectionInput ?? hookResult.collectionInput;
  const isPending = props.collectionInput === undefined && hookResult.isPending;
  const collectionUnavailable = props.collectionInput === undefined && hookResult.isError;

  if (collectionUnavailable) {
    return (
      <SecureNowWorkspaceApiUnreachableNotice
        message={SECURENOW_COLLECTION_SETUP_API_UNREACHABLE}
        testId={`${props.testIdPrefix}-collection-setup-unreachable`}
      />
    );
  }

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
  const primaryBlocker = resolveSecureNowCollectionPrimaryBlocker(collectionInput);

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
          {latestSnapshotQuery.latestSnapshotId !== null ? (
            <SecureNowCollectionLatestSnapshotLine
              snapshotId={latestSnapshotQuery.latestSnapshotId}
              testIdPrefix={props.testIdPrefix}
            />
          ) : null}
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_COLLECTION_READY_NEXT_SUMMARY}</p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium">{SECURENOW_COLLECTION_READY_NEXT_LABEL}: </span>
            <Link
              href={resolveSecureNowCollectionReadyNextHref(latestSnapshotQuery.latestSnapshotId)}
              className={OPERATOR_LINK.inline}
              data-testid={`${props.testIdPrefix}-collection-ready-next-link`}
            >
              {resolveSecureNowCollectionReadyNextLinkLabel(latestSnapshotQuery.latestSnapshotId)}
            </Link>
          </p>
          <p className={cn("m-0 flex flex-wrap gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              href={SECURENOW_REMEDIATION_FACTORY_PATH}
              className={OPERATOR_LINK.inline}
              data-testid={`${props.testIdPrefix}-collection-ready-path-inspect-link`}
            >
              Open Path inspect
            </Link>
            <Link
              href={CLOUD_CONNECTIONS_PATH}
              className={OPERATOR_LINK.inline}
              data-testid={`${props.testIdPrefix}-collection-ready-cloud-connections-link`}
            >
              Cloud connections
            </Link>
          </p>
        </div>
      ) : (
        <>
          <SecureNowCollectionPrimaryBlockerLine input={collectionInput} testIdPrefix={props.testIdPrefix} />
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
          {latestSnapshotQuery.latestSnapshotId !== null ? (
            <SecureNowCollectionLatestSnapshotLine
              snapshotId={latestSnapshotQuery.latestSnapshotId}
              testIdPrefix={props.testIdPrefix}
            />
          ) : null}
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            <Link
              href={CLOUD_CONNECTIONS_PATH}
              className={OPERATOR_LINK.inline}
              data-testid={`${props.testIdPrefix}-collection-in-progress-cloud-connections-link`}
            >
              Cloud connections
            </Link>
            {primaryBlocker !== null && primaryBlocker.stepId === "capture" ? (
              <>
                {" · "}
                <Link
                  href={EXTRACT_UPLOAD_PATH}
                  className={OPERATOR_LINK.inline}
                  data-testid={`${props.testIdPrefix}-collection-in-progress-extract-upload-link`}
                >
                  Extract and upload
                </Link>
              </>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}
