"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import {
  ADMIN_CONFIGURATION_CONFIG_LINT_PATH,
  ADMIN_CONFIGURATION_SUMMARY_PATH,
} from "./admin-configuration-constants";
import {
  normalizePath,
  parseConfigLintPayload,
  parseSummaryPayload,
} from "./admin-configuration-helpers";
import type {
  AdminConfigLintResponse,
  AdminConfigurationLoadState,
  ConfigSummaryKeyRow,
} from "./admin-configuration-types";
import type {
  AdminConfigurationPageViewModel,
  AdminConfigurationRowSectionGroup,
} from "./admin-configuration-view-model";

export function useAdminConfigurationPage(): AdminConfigurationPageViewModel {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const [loadState, setLoadState] = useState<AdminConfigurationLoadState>("idle");
  const [rows, setRows] = useState<ConfigSummaryKeyRow[]>([]);
  const [lintState, setLintState] = useState<AdminConfigurationLoadState>("idle");
  const [lint, setLint] = useState<AdminConfigLintResponse | null>(null);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("__all__");

  const load = useCallback(async () => {
    setLoadState("loading");

    try {
      const res = await fetch(
        ADMIN_CONFIGURATION_SUMMARY_PATH,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (res.status === 403) {
        setRows([]);
        setLoadState("forbidden");

        return;
      }

      if (!res.ok) {
        setRows([]);
        setLoadState("error");

        return;
      }

      const json: unknown = await res.json();
      const parsed = parseSummaryPayload(json);

      if (parsed.length === 0) {
        setRows([]);
        setLoadState("empty");

        return;
      }

      setRows(parsed);
      setLoadState("ok");
    } catch {
      setRows([]);
      setLoadState("error");
    }
  }, []);

  const loadLint = useCallback(async () => {
    setLintState("loading");

    try {
      const res = await fetch(
        ADMIN_CONFIGURATION_CONFIG_LINT_PATH,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (res.status === 403) {
        setLint(null);
        setLintState("forbidden");

        return;
      }

      if (!res.ok) {
        setLint(null);
        setLintState("error");

        return;
      }

      const json: unknown = await res.json();
      const parsed: AdminConfigLintResponse | null = parseConfigLintPayload(json);

      if (parsed === null) {
        setLint(null);
        setLintState("empty");

        return;
      }

      setLint(parsed);
      setLintState("ok");
    } catch {
      setLint(null);
      setLintState("error");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(), loadLint()]);
  }, [load, loadLint]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void load();
    void loadLint();
  }, [isDemo, load, loadLint]);

  const sections = useMemo(() => {
    const set = new Set<string>();

    for (const r of rows) {
      const sec = normalizePath(r.section);

      if (sec.length > 0) {
        set.add(sec);
      }
    }

    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      const path = normalizePath(r.configPath).toLowerCase();
      const sec = normalizePath(r.section);

      if (sectionFilter !== "__all__" && sec !== sectionFilter) {
        return false;
      }

      if (q.length === 0) {
        return true;
      }

      return path.includes(q);
    });
  }, [rows, search, sectionFilter]);

  const rowsBySection = useMemo(() => {
    const map = new Map<string, ConfigSummaryKeyRow[]>();

    for (const r of filteredRows) {
      const sec = normalizePath(r.section).length > 0 ? normalizePath(r.section) : "Other";

      if (!map.has(sec)) {
        map.set(sec, []);
      }

      map.get(sec)!.push(r);
    }

    const keys = [...map.keys()].sort((a, b) => a.localeCompare(b));
    const ordered: AdminConfigurationRowSectionGroup[] = [];

    for (const k of keys) {
      const items = map.get(k) ?? [];

      items.sort((a, b) => normalizePath(a.configPath).localeCompare(normalizePath(b.configPath)));
      ordered.push({ section: k, items });
    }

    return ordered;
  }, [filteredRows]);

  return {
    isDemo,
    loadState,
    lintState,
    lint,
    search,
    setSearch,
    sectionFilter,
    setSectionFilter,
    sections,
    filteredRows,
    rowsBySection,
    refreshAll,
  };
}
