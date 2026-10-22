"use client";

import { useCallback, useState } from "react";

import { defaultSupportBundleFilename } from "@/app/(operator)/administration/support/_sections/default-support-bundle-filename";
import { parseFilenameFromContentDisposition } from "@/app/(operator)/administration/support/_sections/parse-filename-from-content-disposition";
import {
  classifySupportBundleDownloadError,
  formatSupportBundleDownloadError,
  type SupportBundleStatus,
} from "@/lib/support-workspace-present";

export type UseSupportBundleDownloadModel = {
  downloading: boolean;
  bundleStatus: SupportBundleStatus;
  error: string | null;
  lastGeneratedAt: Date | null;
  onDownload: () => Promise<void>;
};

/** Downloads the in-product support bundle ZIP via POST /v1/admin/support-bundle. */
export function useSupportBundleDownload(): UseSupportBundleDownloadModel {
  const [downloading, setDownloading] = useState(false);
  const [bundleStatus, setBundleStatus] = useState<SupportBundleStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

  const onDownload = useCallback(async () => {
    setDownloading(true);
    setBundleStatus("generating");
    setError(null);

    try {
      const response = await fetch("/api/proxy/v1/admin/support-bundle", {
        method: "POST",
        headers: { Accept: "application/zip" },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const status = classifySupportBundleDownloadError(response.status, text);
        const message =
          status === "failed"
            ? `Support bundle download failed (HTTP ${response.status}). ${text.slice(0, 280)}`
            : formatSupportBundleDownloadError(status, null);

        setBundleStatus(status);
        setError(message);

        return;
      }

      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        parseFilenameFromContentDisposition(disposition) ?? defaultSupportBundleFilename();

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setBundleStatus("ready");
      setLastGeneratedAt(new Date());
    } catch (cause) {
      setBundleStatus("failed");
      setError(formatSupportBundleDownloadError("failed", cause));
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, bundleStatus, error, lastGeneratedAt, onDownload };
}
