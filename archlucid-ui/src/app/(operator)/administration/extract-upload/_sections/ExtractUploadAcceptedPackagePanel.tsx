"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  truncateExtractUploadPackageId,
  type ExtractUploadAcceptedPackageRecord,
} from "@/lib/extract-upload-accepted-package-record";
import {
  EXTRACT_UPLOAD_ACCEPTED_PACKAGE_PANEL_TITLE,
  EXTRACT_UPLOAD_ACCEPTED_REPLACE_LABEL,
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF,
  EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL,
  EXTRACT_UPLOAD_PACKAGE_ID_COPY_ERROR_DETAIL,
  EXTRACT_UPLOAD_PACKAGE_ID_COPY_ERROR_TITLE,
} from "@/lib/extract-upload-settings-page-copy";
import { EXTRACT_UPLOAD_SETTINGS_SOURCES } from "@/lib/extract-upload-settings-evidence-copy";
import { formatGovernanceInfrastructureInlineActionError } from "@/lib/governance/governance-infrastructure-copy";
import { showSuccess } from "@/lib/toast";

export type ExtractUploadAcceptedPackagePanelProps = {
  readonly record: ExtractUploadAcceptedPackageRecord;
  readonly onReplaceInventory: () => void;
};

export function ExtractUploadAcceptedPackagePanel(
  props: ExtractUploadAcceptedPackagePanelProps,
): React.JSX.Element {
  const { record, onReplaceInventory } = props;
  const [copied, setCopied] = useState(false);
  const [copyPackageIdError, setCopyPackageIdError] = useState<string | null>(null);
  const truncatedId = truncateExtractUploadPackageId(record.packageId);

  const onCopyPackageId = useCallback(async () => {
    setCopyPackageIdError(null);

    try {
      await navigator.clipboard.writeText(record.packageId);
      setCopied(true);
      showSuccess("Package id copied.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyPackageIdError(
        formatGovernanceInfrastructureInlineActionError(
          EXTRACT_UPLOAD_PACKAGE_ID_COPY_ERROR_TITLE,
          EXTRACT_UPLOAD_PACKAGE_ID_COPY_ERROR_DETAIL,
        ),
      );
    }
  }, [record.packageId]);

  const acceptedAtLabel = new Date(record.acceptedAtUtc).toLocaleString();

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="extract-upload-accepted-package-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {EXTRACT_UPLOAD_ACCEPTED_PACKAGE_PANEL_TITLE}
            </h2>
            <StatusTag kind="ready" label="Accepted" data-testid="extract-upload-accepted-package-status" />
          </div>
          <dl className="m-0 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className={cn("font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Package id
              </dt>
              <dd className={cn("m-0 mt-0.5 flex flex-wrap items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
                <span className="font-mono" data-testid="extract-upload-accepted-package-id-truncated">
                  {truncatedId}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="extract-upload-accepted-package-id-copy"
                  aria-describedby={copyPackageIdError != null ? "extract-upload-accepted-package-id-copy-error" : undefined}
                  onClick={() => {
                    void onCopyPackageId();
                  }}
                >
                  <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                  {copied ? "Copied" : "Copy id"}
                </Button>
              </dd>
              {copyPackageIdError != null ? (
                <OperatorMutationInlineError
                  message={copyPackageIdError}
                  testId="extract-upload-accepted-package-id-copy-error"
                  className="mt-2"
                />
              ) : null}
              <details className="mt-1">
                <summary className={cn("cursor-pointer text-al-link", OPERATOR_TYPOGRAPHY.helper)}>
                  Show full package id
                </summary>
                <p
                  className={cn("m-0 mt-1 break-all font-mono", OPERATOR_TYPOGRAPHY.micro)}
                  data-testid="extract-upload-accepted-package-id-full"
                >
                  {record.packageId}
                </p>
              </details>
            </div>
            <div>
              <dt className={cn("font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Accepted
              </dt>
              <dd className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.body)} data-testid="extract-upload-accepted-at">
                {acceptedAtLabel}
              </dd>
            </div>
            <div>
              <dt className={cn("font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Actor
              </dt>
              <dd className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.body)} data-testid="extract-upload-accepted-actor">
                {record.actorLabel.length > 0 ? record.actorLabel : "Unknown"}
              </dd>
            </div>
            <div>
              <dt className={cn("font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                Resources
              </dt>
              <dd className={cn("m-0 mt-0.5", OPERATOR_TYPOGRAPHY.body)} data-testid="extract-upload-accepted-resource-count">
                {record.resourceCount === null ? "—" : record.resourceCount}
              </dd>
            </div>
          </dl>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="extract-upload-accepted-replace"
          onClick={onReplaceInventory}
        >
          {EXTRACT_UPLOAD_ACCEPTED_REPLACE_LABEL}
        </Button>
      </div>
      <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Continue</p>
        <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {EXTRACT_UPLOAD_SETTINGS_SOURCES.map((source) => (
            <li key={source.href}>
              <Link href={source.href} className={OPERATOR_LINK.inline} data-testid={`extract-upload-continue-${source.label}`}>
                {source.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={EXTRACT_UPLOAD_EVIDENCE_TRAIL_HREF}
              className={OPERATOR_LINK.inline}
              data-testid="extract-upload-accepted-evidence-trail-link"
            >
              {EXTRACT_UPLOAD_EVIDENCE_TRAIL_LINK_LABEL}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
