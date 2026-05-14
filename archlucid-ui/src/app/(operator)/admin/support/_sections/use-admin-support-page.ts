"use client";

import { useCallback, useState } from "react";

import { defaultSupportBundleFilename } from "./default-support-bundle-filename";
import type { AdminSupportPageServerLoad } from "./load-admin-support-page-data";
import { parseFilenameFromContentDisposition } from "./parse-filename-from-content-disposition";

export type UseAdminSupportPageModel = {
  downloading: boolean;
  error: string | null;
  isDemo: boolean;
  onDownload: () => Promise<void>;
};

export function useAdminSupportPage(loaded: AdminSupportPageServerLoad): UseAdminSupportPageModel {
  const isDemo = loaded.demo;
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

  return {
    downloading,
    error,
    isDemo,
    onDownload,
  };
}
