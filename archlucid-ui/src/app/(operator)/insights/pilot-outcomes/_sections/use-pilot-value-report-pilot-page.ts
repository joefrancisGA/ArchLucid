"use client";

import { useCallback, useState } from "react";

import { buildPilotValueReportQuery, getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { formatPilotOutcomesReportingPeriod } from "@/lib/pilot-outcomes-report-diagnostics";
import {
  type PilotOutcomesPeriodPresetId,
  resolvePilotOutcomesPeriodPreset,
} from "@/lib/pilot-outcomes-period-presets";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import type { PilotValueReportPageServerLoad } from "./load-pilot-value-report-page-data";
import type {
  PilotOutcomesEmailPreview,
  PilotValueReportExportFormat,
  PilotValueReportPilotPageError,
  PilotValueReportPilotPageViewModel,
} from "./pilot-value-report-pilot-page-view-model";
import { toPilotValueReportPilotPageError } from "./to-pilot-value-report-pilot-page-error";

const SPONSOR_REPORT_SECTIONS = [
  "Pilot summary",
  "Review activity",
  "Risk discovery",
  "Governance outcomes",
  "Recommendations and remediation",
  "Finalized reviews",
] as const;

function resolveReportingTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function buildEmailPreview(
  fromUtc: string,
  toUtc: string,
  hasData: boolean,
): PilotOutcomesEmailPreview {
  const fromIso = new Date(fromUtc).toISOString();
  const toIso = new Date(toUtc).toISOString();

  return {
    recipient: "(sponsor email — choose in your mail client)",
    reportingPeriodLabel: formatPilotOutcomesReportingPeriod(fromIso, toIso),
    includedSections: SPONSOR_REPORT_SECTIONS,
    attachmentFormat: "Markdown report in email body (full report via download)",
    basedOnCurrentData: hasData,
  };
}

export function usePilotValueReportPilotPage(loaded: PilotValueReportPageServerLoad): PilotValueReportPilotPageViewModel {
  const [fromUtc, setFromUtc] = useState(loaded.initialFromUtc);
  const [toUtc, setToUtc] = useState(loaded.initialToUtc);
  const [periodPreset, setPeriodPreset] = useState<PilotOutcomesPeriodPresetId>("last-30");
  const [data, setData] = useState<PilotValueReportJson | null>(loaded.data);
  const [busy, setBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [error, setError] = useState<PilotValueReportPilotPageError | null>(loaded.failure);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState<PilotOutcomesEmailPreview | null>(null);

  const includesSampleData = isNextPublicDemoMode();

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const fromIso = new Date(fromUtc).toISOString();
      const toIso = new Date(toUtc).toISOString();
      const json = await getTenantPilotValueReportJson(fromIso, toIso);

      setData(json);
    } catch (e: unknown) {
      setError(toPilotValueReportPilotPageError(e));
      setData(null);
    } finally {
      setBusy(false);
    }
  }, [fromUtc, toUtc]);

  const applyPeriodPreset = useCallback(
    (presetId: PilotOutcomesPeriodPresetId) => {
      setPeriodPreset(presetId);

      if (presetId === "custom") {
        return;
      }

      const resolved = resolvePilotOutcomesPeriodPreset(presetId);

      setFromUtc(resolved.fromUtc);
      setToUtc(resolved.toUtc);
    },
    [],
  );

  const downloadMarkdown = useCallback(
    async (fromIso: string, toIso: string, tenantId: string | undefined) => {
      const q = buildPilotValueReportQuery(fromIso, toIso);

      const res = await fetch(
        `/api/proxy/v1/tenant/pilot-value-report?${q}`,
        mergeRegistrationScopeForProxy({
          headers: { Accept: "text/markdown" },
        }),
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `archlucid-sponsor-report-${tenantId ?? "tenant"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const onDownloadReport = useCallback(
    async (format: PilotValueReportExportFormat) => {
      if (format === "pdf" || format === "csv") {
        setError({
          message: `${format.toUpperCase()} export is not available yet. Download the Markdown report or use Executive summary exports.`,
          problem: null,
          correlationId: null,
        });

        return;
      }

      setExportBusy(true);
      setError(null);

      try {
        const fromIso = new Date(fromUtc).toISOString();
        const toIso = new Date(toUtc).toISOString();

        await downloadMarkdown(fromIso, toIso, data?.tenantId);
      } catch (e: unknown) {
        setError({
          message: e instanceof Error ? e.message : "Download failed.",
          problem: null,
          correlationId: null,
        });
      } finally {
        setExportBusy(false);
      }
    },
    [data?.tenantId, downloadMarkdown, fromUtc, toUtc],
  );

  const openEmailPreview = useCallback(() => {
    setEmailPreview(buildEmailPreview(fromUtc, toUtc, data !== null && data.totalRunsCommitted > 0));
    setEmailPreviewOpen(true);
  }, [data, fromUtc, toUtc]);

  const closeEmailPreview = useCallback(() => {
    setEmailPreviewOpen(false);
  }, []);

  const confirmSendEmail = useCallback(async () => {
    setEmailBusy(true);
    setError(null);

    try {
      const fromIso = new Date(fromUtc).toISOString();
      const toIso = new Date(toUtc).toISOString();
      const q = buildPilotValueReportQuery(fromIso, toIso);

      const res = await fetch(
        `/api/proxy/v1/tenant/pilot-value-report?${q}`,
        mergeRegistrationScopeForProxy({
          headers: { Accept: "text/markdown" },
        }),
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      const subject = encodeURIComponent("ArchLucid sponsor report — pilot outcomes");
      const maxBody = 1800;
      const clipped =
        text.length > maxBody ? `${text.slice(0, maxBody)}\n\n…(truncated; download the full report for complete detail)` : text;
      const body = encodeURIComponent(clipped);
      const mail = `mailto:?subject=${subject}&body=${body}`;

      window.location.href = mail;
      setEmailPreviewOpen(false);
    } catch (e: unknown) {
      setError({
        message: e instanceof Error ? e.message : "Send executive briefing failed.",
        problem: null,
        correlationId: null,
      });
    } finally {
      setEmailBusy(false);
    }
  }, [fromUtc, toUtc]);

  return {
    fromUtc,
    setFromUtc,
    toUtc,
    setToUtc,
    periodPreset,
    setPeriodPreset,
    applyPeriodPreset,
    data,
    busy,
    exportBusy,
    emailBusy,
    error,
    load,
    onDownloadReport,
    emailPreviewOpen,
    emailPreview,
    openEmailPreview,
    closeEmailPreview,
    confirmSendEmail,
    includesSampleData,
    reportingTimezoneLabel: resolveReportingTimezoneLabel(),
  };
}
