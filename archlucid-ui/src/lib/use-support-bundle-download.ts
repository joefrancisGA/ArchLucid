"use client";

import { useCallback, useState } from "react";

import { defaultSupportBundleFilename } from "@/app/(operator)/admin/support/_sections/default-support-bundle-filename";
import { parseFilenameFromContentDisposition } from "@/app/(operator)/admin/support/_sections/parse-filename-from-content-disposition";

export type UseSupportBundleDownloadModel = {
  downloading: boolean;
  error: string | null;
  onDownload: () => Promise<void>;
};

/** Downloads the in-product support bundle ZIP via POST /v1/admin/support-bundle. */
export function useSupportBundleDownload(): UseSupportBundleDownloadModel {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/proxy/v1/admin/support-bundle", {
        method: "POST",
        headers: { Accept: "application/zip" },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");

        throw new Error(
          `Support-bundle download failed (HTTP ${response.status}). ${text.slice(0, 280)}`,
        );
      }

      const disposition = response.headers.get("content-disposition") ?? "";
      const filename =
        parseFilenameFromContentDisposition(disposition) ?? defaultSupportBundleFilename();

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, error, onDownload };
}
