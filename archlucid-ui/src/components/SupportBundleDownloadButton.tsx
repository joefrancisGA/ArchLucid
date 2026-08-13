"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TROUBLESHOOTING_SUPPORT_BUNDLE_DISCLOSURE } from "@/lib/troubleshooting-help-evidence-copy";
import { useSupportBundleDownload } from "@/lib/use-support-bundle-download";

type SupportBundleDownloadButtonProps = {
  className?: string;
  /** When true, shows a secondary link to the full support diagnostics page (Execute+ surfaces). */
  showDiagnosticsLink?: boolean;
  /** When true, always shows redaction / contents disclosure beside the download control. */
  showContentsDisclosure?: boolean;
};

/** Discoverable support-bundle download for Help and Settings surfaces. */
export function SupportBundleDownloadButton({
  className,
  showDiagnosticsLink = false,
  showContentsDisclosure = false,
}: SupportBundleDownloadButtonProps) {
  const { downloading, error, onDownload } = useSupportBundleDownload();

  return (
    <div className={className ?? "space-y-2"}>
      <Button
        type="button"
        className="min-h-6 min-w-6"
        data-testid="support-bundle-download-button"
        disabled={downloading}
        onClick={() => void onDownload()}
      >
        {downloading ? "Preparing bundle…" : "Download support bundle"}
      </Button>

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

      {error !== null ? (
        <p
          role="alert"
          className={cn("rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50 p-2", OPERATOR_TYPOGRAPHY.body)}
          data-testid="support-bundle-download-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
