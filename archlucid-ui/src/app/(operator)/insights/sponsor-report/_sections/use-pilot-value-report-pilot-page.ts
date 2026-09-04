"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildPilotValueReportQuery, getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { downloadBoardPackPdf, downloadValueReportDocx } from "@/lib/api";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { formatPilotOutcomesReportingPeriod } from "@/lib/pilot-outcomes-report-diagnostics";
import {
  parseSponsorReportPeriodFromSearch,
  sponsorReportPeriodHrefFromSearch,
} from "@/lib/insights/sponsor-report-period-url";
import {
  parseSponsorReportCustomDateFromSearch,
  sponsorReportCustomDateHrefFromSearch,
} from "@/lib/insights/sponsor-report-custom-date-url";
import {
  parseSponsorReportEmailPreviewOpenFromSearch,
  sponsorReportEmailPreviewHrefFromSearch,
} from "@/lib/insights/sponsor-report-email-preview-url";
import {
  type PilotOutcomesPeriodPresetId,
  resolvePilotOutcomesPeriodPreset,
} from "@/lib/pilot-outcomes-period-presets";
import { formatBrowserTimeZoneAbbreviation } from "@/lib/locale-datetime";
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
  "Report summary",
  "Review activity",
  "Risk discovery",
  "Governance outcomes",
  "Recommendations and remediation",
  "Finalized reviews",
] as const;

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
  const router = useRouter();
  const pathname = usePathname() ?? "/insights/sponsor-report";
  const searchParams = useSearchParams();
  const urlPeriodPreset = parseSponsorReportPeriodFromSearch(searchParams.get("range"));
  const urlFromUtc = parseSponsorReportCustomDateFromSearch(searchParams.get("from"));
  const urlToUtc = parseSponsorReportCustomDateFromSearch(searchParams.get("to"));
  const urlEmailPreviewOpen = parseSponsorReportEmailPreviewOpenFromSearch(searchParams.get("emailPreview"));
  const [fromUtc, setFromUtc] = useState(
    urlPeriodPreset === "custom" && urlFromUtc.length > 0 ? urlFromUtc : loaded.initialFromUtc,
  );
  const [toUtc, setToUtc] = useState(
    urlPeriodPreset === "custom" && urlToUtc.length > 0 ? urlToUtc : loaded.initialToUtc,
  );
  const [periodPreset, setPeriodPreset] = useState<PilotOutcomesPeriodPresetId>(urlPeriodPreset);
  const [data, setData] = useState<PilotValueReportJson | null>(loaded.data);
  const canMutate = useOperateCapability();
  const [busy, setBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [docxBusy, setDocxBusy] = useState(false);
  const [boardBusy, setBoardBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [error, setError] = useState<PilotValueReportPilotPageError | null>(loaded.failure);
  const [emailPreviewOpen, setEmailPreviewOpenState] = useState(urlEmailPreviewOpen);
  const [emailPreview, setEmailPreview] = useState<PilotOutcomesEmailPreview | null>(null);

  const syncEmailPreviewToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        sponsorReportEmailPreviewHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setEmailPreviewOpenState(urlEmailPreviewOpen);

    if (urlEmailPreviewOpen && emailPreview === null) {
      setEmailPreview(buildEmailPreview(fromUtc, toUtc, data !== null && data.totalRunsCommitted > 0));
    }
  }, [data, emailPreview, fromUtc, toUtc, urlEmailPreviewOpen]);

  const includesSampleData = isNextPublicDemoMode();

  useEffect(() => {
    setPeriodPreset(urlPeriodPreset);

    if (urlPeriodPreset === "custom") {
      if (urlFromUtc.length > 0) {
        setFromUtc(urlFromUtc);
      }

      if (urlToUtc.length > 0) {
        setToUtc(urlToUtc);
      }

      return;
    }

    const resolved = resolvePilotOutcomesPeriodPreset(urlPeriodPreset);

    setFromUtc(resolved.fromUtc);
    setToUtc(resolved.toUtc);
  }, [urlFromUtc, urlPeriodPreset, urlToUtc]);

  useEffect(() => {
    if (periodPreset !== "custom") {
      return;
    }

    const handle = window.setTimeout(() => {
      const nextHref = sponsorReportCustomDateHrefFromSearch(searchParams.toString(), fromUtc, toUtc);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [fromUtc, periodPreset, router, searchParams, toUtc]);

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
      router.replace(sponsorReportPeriodHrefFromSearch(searchParams.toString(), presetId), { scroll: false });

      if (presetId === "custom") {
        return;
      }

      const resolved = resolvePilotOutcomesPeriodPreset(presetId);

      setFromUtc(resolved.fromUtc);
      setToUtc(resolved.toUtc);
    },
    [router, searchParams],
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
          message: `${format.toUpperCase()} export is not available yet. Download the Markdown report, or use the sponsor report (.docx) and board pack (.pdf) exports above.`,
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

  const onGenerateDocx = useCallback(async () => {
    setDocxBusy(true);
    setError(null);

    try {
      const fromIso = new Date(fromUtc).toISOString();
      const toIso = new Date(toUtc).toISOString();

      await downloadValueReportDocx(fromIso, toIso);
    } catch (e: unknown) {
      setError(toPilotValueReportPilotPageError(e, "Could not generate sponsor report."));
    } finally {
      setDocxBusy(false);
    }
  }, [fromUtc, toUtc]);

  const onBoardPack = useCallback(async () => {
    setBoardBusy(true);
    setError(null);

    try {
      // The board pack is quarter-scoped server-side, so it uses the current calendar quarter rather
      // than the reporting period selected above.
      const now = new Date();
      const quarter = Math.floor(now.getUTCMonth() / 3) + 1;

      await downloadBoardPackPdf(now.getUTCFullYear(), quarter);
    } catch (e: unknown) {
      setError(toPilotValueReportPilotPageError(e, "Could not generate board pack."));
    } finally {
      setBoardBusy(false);
    }
  }, []);

  const openEmailPreview = useCallback(() => {
    setEmailPreview(buildEmailPreview(fromUtc, toUtc, data !== null && data.totalRunsCommitted > 0));
    setEmailPreviewOpenState(true);
    syncEmailPreviewToUrl(true);
  }, [data, fromUtc, syncEmailPreviewToUrl, toUtc]);

  const closeEmailPreview = useCallback(() => {
    setEmailPreviewOpenState(false);
    syncEmailPreviewToUrl(false);
  }, [syncEmailPreviewToUrl]);

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
      setEmailPreviewOpenState(false);
      syncEmailPreviewToUrl(false);
    } catch (e: unknown) {
      setError({
        message: e instanceof Error ? e.message : "Send sponsor briefing failed.",
        problem: null,
        correlationId: null,
      });
    } finally {
      setEmailBusy(false);
    }
  }, [fromUtc, syncEmailPreviewToUrl, toUtc]);

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
    onGenerateDocx,
    onBoardPack,
    docxBusy,
    boardBusy,
    canMutate,
    emailPreviewOpen,
    emailPreview,
    openEmailPreview,
    closeEmailPreview,
    confirmSendEmail,
    includesSampleData,
    reportingTimezoneLabel: formatBrowserTimeZoneAbbreviation(),
  };
}
