"use client";

import { useCallback, useState } from "react";

import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { downloadBoardPackPdf, downloadValueReportDocx } from "@/lib/api";
import { DEFAULT_DEV_TENANT_ID } from "@/lib/scope-defaults";

import type { ValueReportPageServerLoad } from "./load-value-report-page-data";
import { resolveTenantIdFromMe } from "./resolve-tenant-id-from-me";
import { toValueReportActionError } from "./to-value-report-action-error";
import type { ValueReportActionError } from "./value-report-action-error";

export type UseValueReportPageModel = {
  boardBusy: boolean;
  busy: boolean;
  canMutate: boolean;
  error: ValueReportActionError | null;
  fromUtc: string;
  onBoardPack: () => Promise<void>;
  onGenerate: () => Promise<void>;
  setFromUtc: (next: string) => void;
  setToUtc: (next: string) => void;
  toUtc: string;
};

export function useValueReportPage(loaded: ValueReportPageServerLoad): UseValueReportPageModel {
  // Keeps hook boundary aligned with `load-value-report-page-data` when eligibility/tier arrives.
  void loaded;

  const canMutate = useEnterpriseMutationCapability();
  const [fromUtc, setFromUtc] = useState(() => {
    const d = new Date();

    d.setUTCDate(d.getUTCDate() - 30);

    return d.toISOString().slice(0, 16);
  });
  const [toUtc, setToUtc] = useState(() => new Date().toISOString().slice(0, 16));
  const [busy, setBusy] = useState(false);
  const [boardBusy, setBoardBusy] = useState(false);
  const [error, setError] = useState<ValueReportActionError | null>(null);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const tenantId = (await resolveTenantIdFromMe()) ?? DEFAULT_DEV_TENANT_ID;
      const fromIso = new Date(fromUtc).toISOString();
      const toIso = new Date(toUtc).toISOString();

      await downloadValueReportDocx(tenantId, fromIso, toIso);
    } catch (e: unknown) {
      setError(toValueReportActionError(e, "Could not generate value report."));
    } finally {
      setBusy(false);
    }
  }, [fromUtc, toUtc]);

  const onBoardPack = useCallback(async () => {
    setBoardBusy(true);
    setError(null);

    try {
      const now = new Date();
      const month = now.getUTCMonth() + 1;
      const year = now.getUTCFullYear();
      const quarter = Math.floor((month - 1) / 3) + 1;

      await downloadBoardPackPdf(year, quarter);
    } catch (e: unknown) {
      setError(toValueReportActionError(e, "Could not generate board pack."));
    } finally {
      setBoardBusy(false);
    }
  }, []);

  return {
    boardBusy,
    busy,
    canMutate,
    error,
    fromUtc,
    onBoardPack,
    onGenerate,
    setFromUtc,
    setToUtc,
    toUtc,
  };
}
