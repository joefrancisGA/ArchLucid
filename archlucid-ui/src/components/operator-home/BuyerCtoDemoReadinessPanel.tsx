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
} from "@/lib/buyer/buyer-polish-copy";
import {
  buyerCtoDemoReadinessStatusKind,
  evaluateBuyerCtoDemoReadiness,
  type BuyerCtoDemoReadinessCheck,
  type BuyerCtoDemoReadinessResult,
} from "@/lib/buyer/buyer-cto-demo-readiness";
import { buildCtoDemoRunOfShowMarkdown } from "@/lib/buyer/buyer-cto-demo-tour";
import { DEMO_READINESS_RUN_OF_SHOW_DOWNLOAD_FILENAME } from "@/lib/demo-readiness-evidence-copy";
import {
  demoReadinessCheckStatusKind,
  demoReadinessCheckStatusLabel,
} from "@/lib/demo-readiness-check-status-label";
import { groupDemoReadinessChecksBySection } from "@/lib/demo-readiness-check-sections";
import { emitDemoReadinessInternalSignal } from "@/lib/demo-readiness-internal-telemetry";
import { EXPLORE_ARCHLUCID_ROW_CLASS } from "@/components/operator-home/explore-archlucid-row-class";
import { isCtoDemoInternalOperatorControlsEnv } from "@/lib/cto-demo-presenter-pack";
import { OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";

export type DemoReadinessRecheckControls = {
  readonly runChecks: () => void;
  readonly loading: boolean;
};

export type BuyerCtoDemoReadinessPanelProps = {
  /** When true, renders inside a parent disclosure without a duplicate card shell. */
  readonly embedded?: boolean;
  /** Internal admin page uses grouped sections and always shows operator diagnostics. */
  readonly layout?: "embedded" | "internal-page";
  /** When `page`, primary recheck renders in page chrome instead of the panel toolbar (TB-1412). */
  readonly recheckPlacement?: "panel" | "page";
  readonly onRecheckControlsChange?: (controls: DemoReadinessRecheckControls) => void;
};

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
  anchor.download = DEMO_READINESS_RUN_OF_SHOW_DOWNLOAD_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DemoReadinessCheckRow(props: { readonly check: BuyerCtoDemoReadinessCheck }): React.JSX.Element {
  return (
    <li
      data-testid={`buyer-cto-demo-readiness-check-${props.check.id}`}
      className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag
          kind={demoReadinessCheckStatusKind(props.check.status)}
          label={demoReadinessCheckStatusLabel(props.check.status)}
          data-testid={`demo-readiness-check-status-${props.check.id}`}
        />
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPE_SCALE.body)}>{props.check.label}</span>
      </div>
      <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">{props.check.detail}</p>
    </li>
  );
}

/** Internal demo-operator preflight — showcase seed and golden journey checks. */
export function BuyerCtoDemoReadinessPanel(props: BuyerCtoDemoReadinessPanelProps = {}): React.JSX.Element {
  const { embedded, layout: layoutProp, recheckPlacement: recheckPlacementProp, onRecheckControlsChange } = props;
  const [result, setResult] = useState<BuyerCtoDemoReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const layout = layoutProp ?? (embedded === true ? "embedded" : "internal-page");

  const runChecks = useCallback(async () => {
    setLoading(true);

    try {
      const next = await evaluateBuyerCtoDemoReadiness();
      setResult(next);
      setLastCheckedAt(new Date().toISOString());
      emitDemoReadinessInternalSignal(next.verdict);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const recheckPlacement = recheckPlacementProp ?? "panel";
  const recheckInPageChrome = layout === "internal-page" && recheckPlacement === "page";

  useEffect(() => {
    if (!recheckInPageChrome || onRecheckControlsChange === undefined) {
      return;
    }

    onRecheckControlsChange({
      runChecks: () => {
        void runChecks();
      },
      loading,
    });
  }, [loading, onRecheckControlsChange, recheckInPageChrome, runChecks]);

  const statusKind = result === null ? "needs-attention" : buyerCtoDemoReadinessStatusKind(result.verdict);
  const isEmbeddedLayout = layout === "embedded";
  const showPanelHeading = layout !== "embedded" && layout !== "internal-page";
  const shellClassName = isEmbeddedLayout ? "space-y-3" : cn(EXPLORE_ARCHLUCID_ROW_CLASS, "p-4");
  const showInternalDemoControls = isCtoDemoInternalOperatorControlsEnv();
  const groupedChecks = result === null ? [] : groupDemoReadinessChecksBySection(result.checks);

  return (
    <section
      aria-label={BUYER_CTO_DEMO_READINESS_ARIA}
      data-testid="buyer-cto-demo-readiness-panel"
      className={shellClassName}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          {showPanelHeading ? (
            <h2 id="buyer-cto-demo-readiness-heading" className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle)}>
              {BUYER_CTO_DEMO_READINESS_HEADING}
            </h2>
          ) : null}
          <StatusTag
            kind={statusKind}
            label={readinessBadgeLabel(result)}
            data-testid="buyer-cto-demo-readiness-badge"
          />
          {lastCheckedAt !== null ? (
            <p className={cn("m-0", OPERATOR_TYPE_SCALE.micro, "text-al-text-secondary")} data-testid="demo-readiness-last-checked">
              Last checked {new Date(lastCheckedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <div
          role="toolbar"
          aria-label="Demo operations actions"
          className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end"
        >
          {recheckInPageChrome ? null : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={loading}
              onClick={() => {
                void runChecks();
              }}
            >
              {BUYER_CTO_DEMO_READINESS_REFRESH_CTA}
            </Button>
          )}
          {showInternalDemoControls ? (
            <>
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
              <div className="flex items-center border-l border-neutral-200 pl-2 dark:border-neutral-700 sm:ml-1">
                <CtoDemoResetButton />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {result !== null ? (
        layout === "internal-page" ? (
          <div className={cn("space-y-4", isEmbeddedLayout ? "" : "mt-3")}>
            {groupedChecks.map((entry) => (
              <section key={entry.section.id} aria-labelledby={`demo-readiness-section-${entry.section.id}`}>
                <h3
                  id={`demo-readiness-section-${entry.section.id}`}
                  className={cn("m-0 mb-2", OPERATOR_TYPE_SCALE.sectionTitle)}
                >
                  {entry.section.title}
                </h3>
                <ul className={cn("m-0 list-none space-y-2 p-0", OPERATOR_TYPE_SCALE.body)}>
                  {entry.checks.map((check) => (
                    <DemoReadinessCheckRow key={check.id} check={check} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className={cn("m-0 list-none space-y-2 p-0", isEmbeddedLayout ? "" : "mt-3", OPERATOR_TYPE_SCALE.body)}>
            {result.checks.map((check) => (
              <DemoReadinessCheckRow key={check.id} check={check} />
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
