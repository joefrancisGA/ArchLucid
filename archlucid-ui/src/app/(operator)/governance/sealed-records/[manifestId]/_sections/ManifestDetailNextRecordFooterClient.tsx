"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listRunsByProjectPaged } from "@/lib/api";
import { coerceRunSummaryPaged } from "@/lib/operator/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { tryStaticDemoRunSummariesPaged } from "@/lib/operator/operator-static-demo";
import { resolveNextSignedRecordsListRow } from "@/lib/resolve-next-signed-records-list-row";
import {
  buildSignedRecordsListRowsFromRuns,
  type SignedRecordsListRow,
} from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";

import { ManifestDetailNextRecordFooter } from "./ManifestDetailNextRecordFooter";

export type ManifestDetailNextRecordFooterClientProps = {
  readonly manifestId: string;
};

/** Loads sealed-record list context and renders the next-record footer when available. */
export function ManifestDetailNextRecordFooterClient(
  props: ManifestDetailNextRecordFooterClientProps,
): React.JSX.Element | null {
  const [rows, setRows] = useState<readonly SignedRecordsListRow[]>([]);

  const loadRows = useCallback(async () => {
    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const projectId = projectIdFromScopeHeaders(scopeHeaders) ?? "default";

    try {
      const raw: unknown = await listRunsByProjectPaged(projectId, 1, 100, { scopeHeaders });
      const coerced = coerceRunSummaryPaged(raw, { page: 1 });

      if (!coerced.ok) {
        setRows([]);

        return;
      }

      let runs = coerced.value.items;
      const staticFallback = tryStaticDemoRunSummariesPaged(projectId);

      if (runs.length === 0 && staticFallback !== null) {
        runs = staticFallback.items;
      }

      setRows(buildSignedRecordsListRowsFromRuns(runs));
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const nextRecord = useMemo(
    () => resolveNextSignedRecordsListRow(rows, props.manifestId),
    [props.manifestId, rows],
  );

  if (nextRecord === null) {
    return null;
  }

  return <ManifestDetailNextRecordFooter target={nextRecord} />;
}
