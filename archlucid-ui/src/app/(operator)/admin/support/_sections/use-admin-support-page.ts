"use client";

import type { AdminSupportPageServerLoad } from "./load-admin-support-page-data";
import { useSupportBundleDownload } from "@/lib/use-support-bundle-download";

export type UseAdminSupportPageModel = {
  downloading: boolean;
  error: string | null;
  isDemo: boolean;
  onDownload: () => Promise<void>;
};

export function useAdminSupportPage(loaded: AdminSupportPageServerLoad): UseAdminSupportPageModel {
  const isDemo = loaded.demo;
  const { downloading, error, onDownload } = useSupportBundleDownload();

  return {
    downloading,
    error,
    isDemo,
    onDownload,
  };
}
