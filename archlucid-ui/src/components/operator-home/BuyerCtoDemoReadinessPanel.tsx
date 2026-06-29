"use client";
import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { CtoDemoResetButton } from "@/components/cto-demo/CtoDemoResetButton";
import {
  BUYER_CTO_DEMO_READINESS_ARIA,
  BUYER_CTO_DEMO_READINESS_CHECKING_LABEL,
  BUYER_CTO_DEMO_READINESS_HEADING,
  BUYER_CTO_DEMO_READINESS_NOT_READY_LABEL,
  BUYER_CTO_DEMO_READINESS_READY_LABEL,
  BUYER_CTO_DEMO_READINESS_REFRESH_CTA,
  BUYER_CTO_DEMO_READINESS_STATIC_LABEL,
  BUYER_CTO_DEMO_RUN_OF_SHOW_DOWNLOAD_CTA,
} from "@/lib/buyer-polish-copy";
import {
  buyerCtoDemoReadinessStatusKind,
  evaluateBuyerCtoDemoReadiness,
  type BuyerCtoDemoReadinessResult,
} from "@/lib/buyer-cto-demo-readiness";
import { buildCtoDemoRunOfShowMarkdown } from "@/lib/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

function readinessBadgeLabel(result: BuyerCtoDemoReadinessResult | null): string {
  if (result === null) {
    return BUYER_CTO_DEMO_READINESS_CHECKING_LABEL;
  }

  if (result.verdict === "ready") {
    return BUYER_CTO_DEMO_READINESS_READY_LABEL;
  }

  if (result.verdict === "ready-with-static-fallback") {
    return BUYER_CTO_DEMO_READINESS_STATIC_LABEL;
  }

  return BUYER_CTO_DEMO_READINESS_NOT_READY_LABEL;
}

function downloadCtoDemoRunOfShow(): void {
  const markdown = buildCtoDemoRunOfShowMarkdown();
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "archlucid-cto-demo-runofshow.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Presenter-only preflight panel — verifies showcase seed and golden journey before Start CTO demo. */
export function BuyerCtoDemoReadinessPanel(): React.JSX.Element | null {
  const [result, setResult] = useState<BuyerCtoDemoReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  const runChecks = useCallback(async () => {
    setLoading(true);

    try {
      const next = await evaluateBuyerCtoDemoReadiness();
      setResult(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isBuyerPolishedOperatorShellEnv()) {
      return;
    }

    void runChecks();
  }, [runChecks]);

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const statusKind = result === null ? "needs-attention" : buyerCtoDemoReadinessStatusKind(result.verdict);

  return (
    <section
      aria-label={BUYER_CTO_DEMO_READINESS_ARIA}
      data-testid="buyer-cto-demo-readiness-panel"
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 id="buyer-cto-demo-readiness-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle)}>
            {BUYER_CTO_DEMO_READINESS_HEADING}
          </h2>
          <StatusTag
            kind={statusKind}
            label={readinessBadgeLabel(result)}
            data-testid="buyer-cto-demo-readiness-badge"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => {
            void runChecks();
          }}
        >
          {BUYER_CTO_DEMO_READINESS_REFRESH_CTA}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="buyer-cto-demo-run-of-show-download"
          onClick={() => {
            downloadCtoDemoRunOfShow();
          }}
        >
          {BUYER_CTO_DEMO_RUN_OF_SHOW_DOWNLOAD_CTA}
        </Button>
        <CtoDemoResetButton />
      </div>

      {result !== null ? (
        <ul className={cn("m-0 mt-3 list-none space-y-2 p-0", OPERATOR_TYPE_SCALE.body)}>
          {result.checks.map((check) => (
            <li
              key={check.id}
              data-testid={`buyer-cto-demo-readiness-check-${check.id}`}
              className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag
                  kind={
                    check.status === "pass"
                      ? "ready"
                      : check.status === "warn"
                        ? "needs-attention"
                        : check.status === "fail"
                          ? "blocked"
                          : "needs-attention"
                  }
                  label={check.label}
                />
              </div>
              <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">{check.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
