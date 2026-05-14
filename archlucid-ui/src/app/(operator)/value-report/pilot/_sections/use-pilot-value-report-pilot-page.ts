"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buildPilotValueReportQuery, getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import type { PilotValueReportPageServerLoad } from "./load-pilot-value-report-page-data";
import type { PilotValueReportPilotPageError, PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";
import { toPilotValueReportPilotPageError } from "./to-pilot-value-report-pilot-page-error";

export function usePilotValueReportPilotPage(loaded: PilotValueReportPageServerLoad): PilotValueReportPilotPageViewModel {
  const [fromUtc, setFromUtc] = useState(loaded.initialFromUtc);
  const [toUtc, setToUtc] = useState(loaded.initialToUtc);
  const [data, setData] = useState<PilotValueReportJson | null>(loaded.data);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PilotValueReportPilotPageError | null>(loaded.failure);

  const skipInitialClientLoadRef = useRef(true);

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

  useEffect(() => {
    if (skipInitialClientLoadRef.current) {
      skipInitialClientLoadRef.current = false;

      return;
    }

    void load();
  }, [load]);

  const onDownloadMarkdown = useCallback(async () => {
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
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `archlucid-pilot-value-report-${data?.tenantId ?? "tenant"}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError({
        message: e instanceof Error ? e.message : "Download failed.",
        problem: null,
        correlationId: null,
      });
    }
  }, [data?.tenantId, fromUtc, toUtc]);

  const onEmailSponsor = useCallback(async () => {
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
      const subject = encodeURIComponent("ArchLucid pilot value report");
      const maxBody = 1800;
      const clipped =
        text.length > maxBody ? `${text.slice(0, maxBody)}\n\n…(truncated; attach downloaded Markdown for full report)` : text;
      const body = encodeURIComponent(clipped);
      const mail = `mailto:?subject=${subject}&body=${body}`;

      window.location.href = mail;
    } catch (e: unknown) {
      try {
        await navigator.clipboard.writeText(
          data ? JSON.stringify(data, null, 2) : "ArchLucid pilot value report unavailable.",
        );
      } catch {
        /* clipboard unavailable */
      }

      setError({
        message: e instanceof Error ? `${e.message} (summary copied to clipboard as fallback)` : "Email handoff failed.",
        problem: null,
        correlationId: null,
      });
    }
  }, [data, fromUtc, toUtc]);

  return {
    fromUtc,
    setFromUtc,
    toUtc,
    setToUtc,
    data,
    busy,
    error,
    load,
    onDownloadMarkdown,
    onEmailSponsor,
  };
}
