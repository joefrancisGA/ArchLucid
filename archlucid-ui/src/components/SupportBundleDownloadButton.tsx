"use client";

import Link from "next/link";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button, type ButtonProps } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { TROUBLESHOOTING_SUPPORT_BUNDLE_DISCLOSURE } from "@/lib/troubleshooting-help-evidence-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  resolveSupportBundleStatusTag,
  type SupportBundleStatus,
} from "@/lib/support-workspace-present";
import { useSupportBundleDownload } from "@/lib/use-support-bundle-download";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type SupportBundleDownloadModel = {
  readonly canGenerateBundle: boolean;
  readonly downloading: boolean;
  readonly bundleStatus: SupportBundleStatus;
  readonly error: string | null;
  readonly lastGeneratedAt: Date | null;
  readonly onDownload: () => Promise<void>;
};

function supportBundleButtonVariant(
  variant: SupportBundleDownloadButtonProps["variant"],
): ButtonProps["variant"] {
  switch (variant) {
    case "link":
    case "ghost":
      return "outline";
    case undefined:
      return undefined;
    default:
      return variant;
  }
}

type SupportBundleDownloadButtonProps = {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "primary" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  /** When true, shows a secondary link to the full support diagnostics page (Execute+ surfaces). */
  showDiagnosticsLink?: boolean;
  /** When true, always shows redaction / contents disclosure beside the download control. */
  showContentsDisclosure?: boolean;
  /** When true, renders only the download button for embedding in a parent flex action row. */
  buttonOnly?: boolean;
  /** Optional shared download model when the parent already owns bundle session state. */
  model?: SupportBundleDownloadModel;
};

export type SupportBundleDownloadButtonMetaProps = {
  readonly className?: string;
  readonly showContentsDisclosure?: boolean;
  readonly showDiagnosticsLink?: boolean;
  readonly model?: SupportBundleDownloadModel;
};

export function useSupportBundleDownloadModel(): SupportBundleDownloadModel {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const canGenerateBundle = callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const { downloading, bundleStatus, error, lastGeneratedAt, onDownload } = useSupportBundleDownload();

  return {
    canGenerateBundle,
    downloading,
    bundleStatus,
    error,
    lastGeneratedAt,
    onDownload,
  };
}

export function SupportBundleDownloadButtonMeta(
  props: SupportBundleDownloadButtonMetaProps,
): React.JSX.Element {
  const { className, showContentsDisclosure = false, showDiagnosticsLink = false, model } = props;
  const defaultModel = useSupportBundleDownloadModel();
  const resolvedModel = model ?? defaultModel;
  const statusTag = resolveSupportBundleStatusTag(resolvedModel.bundleStatus, resolvedModel.lastGeneratedAt);

  return (
    <div className={cn("space-y-2", className)} data-testid="support-bundle-download-meta">
      {!resolvedModel.canGenerateBundle ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="support-bundle-download-permission"
          role="status"
        >
          Execute authority or higher is required to generate a support bundle.
        </p>
      ) : null}

      <StatusTag
        kind={statusTag.kind}
        label={statusTag.label}
        data-testid="support-bundle-download-status"
      />

      {showContentsDisclosure ? (
        <p
          className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="support-bundle-contents-disclosure"
        >
          {TROUBLESHOOTING_SUPPORT_BUNDLE_DISCLOSURE}
        </p>
      ) : null}

      {showDiagnosticsLink ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <Link className={OPERATOR_LINK.nav} href="/administration/support">
            Open support diagnostics
          </Link>
        </p>
      ) : null}

      {resolvedModel.error !== null ? (
        <p
          role="alert"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="support-bundle-download-error"
        >
          {resolvedModel.error}
        </p>
      ) : null}
    </div>
  );
}

/** Discoverable support-bundle download for Help and Settings surfaces. */
export function SupportBundleDownloadButton({
  className,
  size,
  variant,
  showDiagnosticsLink = false,
  showContentsDisclosure = false,
  buttonOnly = false,
  model,
}: SupportBundleDownloadButtonProps): React.JSX.Element {
  const defaultModel = useSupportBundleDownloadModel();
  const internalModel = model ?? defaultModel;
  const { canGenerateBundle, downloading, onDownload } = internalModel;

  const button = (
    <Button
      type="button"
      size={size}
      variant={supportBundleButtonVariant(variant)}
      data-testid="support-bundle-download-button"
      disabled={downloading || !canGenerateBundle}
      onClick={() => void onDownload()}
    >
      {downloading ? "Preparing bundle…" : "Download support bundle"}
    </Button>
  );

  if (buttonOnly) {
    return button;
  }

  return (
    <div className={className ?? "space-y-2"}>
      {button}
      <SupportBundleDownloadButtonMeta
        model={internalModel}
        showContentsDisclosure={showContentsDisclosure}
        showDiagnosticsLink={showDiagnosticsLink}
      />
    </div>
  );
}
