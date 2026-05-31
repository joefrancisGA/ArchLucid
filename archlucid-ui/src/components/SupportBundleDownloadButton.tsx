"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useSupportBundleDownload } from "@/lib/use-support-bundle-download";

type SupportBundleDownloadButtonProps = {
  className?: string;
  showAdminLink?: boolean;
};

/** Discoverable support-bundle download for Help and Settings surfaces. */
export function SupportBundleDownloadButton({
  className,
  showAdminLink = true,
}: SupportBundleDownloadButtonProps) {
  const { downloading, error, onDownload } = useSupportBundleDownload();

  return (
    <div className={className ?? "space-y-2"}>
      <Button
        type="button"
        data-testid="support-bundle-download-button"
        disabled={downloading}
        onClick={() => void onDownload()}
      >
        {downloading ? "Preparing bundle…" : "Download support bundle"}
      </Button>

      {showAdminLink ? (
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          Requires admin API access. Full diagnostics page:{" "}
          <Link className="text-teal-800 underline dark:text-teal-300" href="/admin/support">
            Admin → Support
          </Link>
          .
        </p>
      ) : null}

      {error !== null ? (
        <p
          role="alert"
          className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 p-2 text-sm"
          data-testid="support-bundle-download-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
