"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getRunDetail } from "@/lib/api";
import { resolveNextFindingInReviewForRunDetail } from "@/lib/findings/resolve-next-finding-in-review";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { tryStaticDemoRunDetail } from "@/lib/operator/operator-static-demo";
import type { RunDetail } from "@/types/authority";

import { FindingInspectNextFindingEvidenceFooter } from "./FindingInspectNextFindingEvidenceFooter";

export type FindingInspectNextFindingEvidenceFooterClientProps = {
  readonly runId: string;
  readonly findingId: string;
};

/** Loads review findings and renders the next-finding evidence-trace footer when available. */
export function FindingInspectNextFindingEvidenceFooterClient(
  props: FindingInspectNextFindingEvidenceFooterClientProps,
): React.JSX.Element | null {
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);

  const loadDetail = useCallback(async () => {
    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();

    try {
      const envelope = await getRunDetail(props.runId, { scopeHeaders });
      const coerced = coerceRunDetail(envelope.data);

      if (coerced.ok) {
        setRunDetail(coerced.value);

        return;
      }
    } catch {
      /* Live detail is optional; static demo covers showcase reviews. */
    }

    setRunDetail(tryStaticDemoRunDetail(props.runId));
  }, [props.runId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const nextFinding = useMemo(() => {
    if (runDetail === null) {
      return null;
    }

    return resolveNextFindingInReviewForRunDetail(runDetail, props.findingId);
  }, [props.findingId, runDetail]);

  if (nextFinding === null) {
    return null;
  }

  return <FindingInspectNextFindingEvidenceFooter target={nextFinding} />;
}
