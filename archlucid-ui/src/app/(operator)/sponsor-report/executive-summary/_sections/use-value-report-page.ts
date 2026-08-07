"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { downloadBoardPackPdf, downloadValueReportDocx } from "@/lib/api";
import { getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import type { ValueReportPageServerLoad } from "./load-value-report-page-data";
import { toValueReportActionError } from "./to-value-report-action-error";
import type { ValueReportActionError } from "./value-report-action-error";
import {
  buildValueReportPreviewMetrics,
  valueReportHasData,
  type ValueReportPreviewMetrics,
} from "./value-report-preview-metrics";

export type UseValueReportPageModel = {
  boardBusy: boolean;
  busy: boolean;
  canDownload: boolean;
  canMutate: boolean;
  error: ValueReportActionError | null;
  fromUtc: string;
  hasReportData: boolean;
  onBoardPack: () => Promise<void>;
  onGenerate: () => Promise<void>;
  onRefreshPreview: () => Promise<void>;
  previewBusy: boolean;
  previewMetrics: ValueReportPreviewMetrics | null;
  setFromUtc: (next: string) => void;
  setToUtc: (next: string) => void;
  toUtc: string;
};

export function useValueReportPage(loaded: ValueReportPageServerLoad): UseValueReportPageModel {
  const canMutate = useOperateCapability();
  const [fromUtc, setFromUtc] = useState(loaded.initialFromUtc);
  const [toUtc, setToUtc] = useState(loaded.initialToUtc);
  const [preview, setPreview] = useState<PilotValueReportJson | null>(loaded.preview);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [boardBusy, setBoardBusy] = useState(false);
  const [error, setError] = useState<ValueReportActionError | null>(null);
  const skipInitialPreviewLoadRef = useRef(true);

  const loadPreview = useCallback(async () => {
    setPreviewBusy(true);

    try {
      const fromIso = new Date(fromUtc).toISOString();
      const toIso = new Date(toUtc).toISOString();
      const json = await getTenantPilotValueReportJson(fromIso, toIso);

      setPreview(json);
    } catch {
      setPreview(null);
    } finally {
      setPreviewBusy(false);
    }
  }, [fromUtc, toUtc]);

  useEffect(() => {
    if (skipInitialPreviewLoadRef.current) {
      skipInitialPreviewLoadRef.current = false;

      return;
    }

    void loadPreview();
  }, [loadPreview]);

  const hasReportData = valueReportHasData(preview);
  const canDownload = canMutate && hasReportData && !previewBusy;

  const previewMetrics = useMemo(() => {
    if (preview === null || !hasReportData) {
      return null;
    }

    return buildValueReportPreviewMetrics(preview);
  }, [hasReportData, preview]);

  const onGenerate = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const fromIso = new Date(fromUtc).toISOString();
      const toIso = new Date(toUtc).toISOString();

      await downloadValueReportDocx(fromIso, toIso);
    } catch (e: unknown) {
      setError(toValueReportActionError(e, "Could not generate sponsor report."));
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
    canDownload,
    canMutate,
    error,
    fromUtc,
    hasReportData,
    onBoardPack,
    onGenerate,
    onRefreshPreview: loadPreview,
    previewBusy,
    previewMetrics,
    setFromUtc,
    setToUtc,
    toUtc,
  };
}
