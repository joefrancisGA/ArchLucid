"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { CtoDemoAgendaPreviewCard } from "@/components/cto-demo/CtoDemoAgendaPreviewCard";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  BUYER_CTO_DEMO_PREFLIGHT_BEGIN_CTA,
  BUYER_CTO_DEMO_PREFLIGHT_HEADING,
  BUYER_CTO_DEMO_READINESS_CHECKING_LABEL,
  BUYER_CTO_DEMO_READINESS_NOT_READY_LABEL,
  BUYER_CTO_DEMO_READINESS_READY_LABEL,
  BUYER_CTO_DEMO_READINESS_STATIC_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import {
  buyerCtoDemoReadinessStatusKind,
  evaluateBuyerCtoDemoReadiness,
  type BuyerCtoDemoReadinessResult,
} from "@/lib/buyer/buyer-cto-demo-readiness";
import { writeBuyerCtoDemoPreflightAcknowledged } from "@/lib/buyer/buyer-cto-demo-tour";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CtoDemoPreflightGateProps = {
  readonly onAcknowledged: () => void;
};

function readinessLabel(result: BuyerCtoDemoReadinessResult | null): string {
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

/** Agenda preview + readiness verdict before the presenter starts step 1. */
export function CtoDemoPreflightGate(props: CtoDemoPreflightGateProps): React.JSX.Element {
  const { onAcknowledged } = props;
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
    void runChecks();
  }, [runChecks]);

  const canBegin = result !== null && result.verdict !== "not-ready";

  return (
    <div className="space-y-3" data-testid="cto-demo-preflight-gate">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{BUYER_CTO_DEMO_PREFLIGHT_HEADING}</h3>
        <StatusTag
          kind={result === null ? "needs-attention" : buyerCtoDemoReadinessStatusKind(result.verdict)}
          label={readinessLabel(result)}
        />
      </div>
      <CtoDemoAgendaPreviewCard />
      <Button
        type="button"
        size="sm"
        className={CTA_WIDTH.content}
        disabled={loading || !canBegin}
        data-testid="cto-demo-preflight-begin"
        onClick={() => {
          writeBuyerCtoDemoPreflightAcknowledged(true);
          onAcknowledged();
        }}
      >
        {BUYER_CTO_DEMO_PREFLIGHT_BEGIN_CTA}
      </Button>
    </div>
  );
}
