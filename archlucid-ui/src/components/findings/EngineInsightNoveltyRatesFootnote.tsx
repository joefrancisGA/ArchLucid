"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { getEngineInsightNoveltyRates } from "@/lib/api/engine-insight-novelty-rates-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatEngineInsightNoveltyRatesPresentation,
  type EngineInsightNoveltyRateRow,
} from "@/lib/quality/engine-insight-novelty-rates";
import { cn } from "@/lib/utils";

export type EngineInsightNoveltyRatesFootnoteProps = {
  readonly className?: string;
};

/** Working-mode internal novelty-rate footnote (DX-23). */
export function EngineInsightNoveltyRatesFootnote(props: EngineInsightNoveltyRatesFootnoteProps): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    if (!isWorkingMode) {
      return;
    }

    let cancelled = false;
    const toUtc = new Date();
    const fromUtc = new Date(toUtc.getTime() - 90 * 24 * 60 * 60 * 1000);

    void getEngineInsightNoveltyRates(fromUtc.toISOString(), toUtc.toISOString())
      .then((response) => {
        if (cancelled) {
          return;
        }

        const rows: readonly EngineInsightNoveltyRateRow[] = response.rows ?? [];
        const presentation = formatEngineInsightNoveltyRatesPresentation(rows);
        setLine(presentation?.line ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLine(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isWorkingMode]);

  if (!isWorkingMode || line === null) {
    return null;
  }

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid="engine-insight-novelty-rates-footnote"
    >
      {line}
    </p>
  );
}
