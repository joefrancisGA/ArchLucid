"use client";

import { useMemo } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { useSupportBundleDownload } from "@/lib/use-support-bundle-download";

import type { AdminSupportPageServerLoad } from "./load-admin-support-page-data";

export type UseAdminSupportPageModel = {
  readonly downloading: boolean;
  readonly bundleStatus: ReturnType<typeof useSupportBundleDownload>["bundleStatus"];
  readonly error: string | null;
  readonly lastGeneratedAt: Date | null;
  readonly isDemo: boolean;
  readonly canGenerateBundle: boolean;
  readonly showInternalDiagnostics: boolean;
  readonly workspaceLabel: string | null;
  readonly onDownload: () => Promise<void>;
};

export function useAdminSupportPage(loaded: AdminSupportPageServerLoad): UseAdminSupportPageModel {
  const isDemo = loaded.demo;
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const { downloading, bundleStatus, error, lastGeneratedAt, onDownload } = useSupportBundleDownload();

  const canGenerateBundle = callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const showInternalDiagnostics = isShowSystemAdministrationNavEnabled();

  const workspaceLabel = useMemo(() => {
    const scope = readOperatorScopeFromStorage();

    if (scope === null) {
      return null;
    }

    if (scope.workspaceLabel.trim().length > 0) {
      return scope.workspaceLabel.trim();
    }

    return scope.workspaceId;
  }, []);

  return {
    downloading,
    bundleStatus,
    error,
    lastGeneratedAt,
    isDemo,
    canGenerateBundle,
    showInternalDiagnostics,
    workspaceLabel,
    onDownload,
  };
}
