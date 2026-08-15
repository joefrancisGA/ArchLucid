"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CtoDemoLeaveBehindExportButton } from "@/components/cto-demo/CtoDemoLeaveBehindExportButton";
import { CtoDemoNextStepsClosingSection } from "@/components/cto-demo/CtoDemoNextStepsClosingSection";
import { CtoDemoShareSnapshotButton } from "@/components/cto-demo/CtoDemoShareSnapshotButton";
import { Button } from "@/components/ui/button";
import {
  buildStaticCtoDemoRecapPayload,
  formatCtoDemoRecapMarkdown,
} from "@/lib/buyer/buyer-cto-demo-recap";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import {
  BUYER_CTO_DEMO_AUDIT_CLOSING_HEADING,
  BUYER_CTO_DEMO_AUDIT_CLOSING_SUBTEXT,
  BUYER_CTO_DEMO_RECAP_BOARD_PACKET_BUSY_CTA,
  BUYER_CTO_DEMO_RECAP_BOARD_PACKET_CTA,
  BUYER_CTO_DEMO_RECAP_COPY_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { downloadFirstValueReportPdf } from "@/lib/api";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { showError, showSuccess } from "@/lib/toast";

/**
 * Primary board-packet CTA at the end of audit step 5 — visible in the page body, not only the tour overlay.
 * Renders when the presenter pack env is active OR when the CTO demo tour is active in buyer-polished mode,
 * so the closing beat is always available during a live walkthrough regardless of env flag state.
 */
export function CtoDemoAuditClosingBeat(): React.JSX.Element | null {
  const [boardPacketBusy, setBoardPacketBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isCtoDemoPackEnv() || (isBuyerPolishedOperatorShellEnv() && readBuyerCtoDemoTourActive()));
  }, []);

  const markdown = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return formatCtoDemoRecapMarkdown(buildStaticCtoDemoRecapPayload(origin));
  }, []);

  const onBoardPacketDownload = useCallback(async () => {
    setBoardPacketBusy(true);

    try {
      await downloadFirstValueReportPdf(SHOWCASE_STATIC_DEMO_RUN_ID);
      showSuccess("Board packet download started.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      showError("Board packet download failed", message);
    } finally {
      setBoardPacketBusy(false);
    }
  }, []);

  const onCopyRecap = useCallback(async () => {
    setCopyBusy(true);

    try {
      await navigator.clipboard.writeText(markdown);
      showSuccess("Sponsor recap copied to clipboard.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Clipboard unavailable.";

      showError("Copy recap", message);
    } finally {
      setCopyBusy(false);
    }
  }, [markdown]);

  if (!visible) {
    return null;
  }

  return (
    <section
      aria-labelledby="cto-demo-audit-closing-heading"
      className="mt-6 rounded-lg border border-teal-200/80 bg-teal-50/30 p-4 print:hidden dark:border-teal-900/40 dark:bg-teal-950/20"
      data-testid="cto-demo-audit-closing-beat"
    >
      <h3 id="cto-demo-audit-closing-heading" className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_CTO_DEMO_AUDIT_CLOSING_HEADING}
      </h3>
      <p className={cn("m-0 mt-2 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_CTO_DEMO_AUDIT_CLOSING_SUBTEXT}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          disabled={boardPacketBusy}
          onClick={() => void onBoardPacketDownload()}
          data-testid="cto-demo-audit-closing-board-packet"
        >
          {boardPacketBusy ? BUYER_CTO_DEMO_RECAP_BOARD_PACKET_BUSY_CTA : BUYER_CTO_DEMO_RECAP_BOARD_PACKET_CTA}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={copyBusy}
          onClick={() => void onCopyRecap()}
          data-testid="cto-demo-audit-closing-copy-recap"
        >
          {BUYER_CTO_DEMO_RECAP_COPY_CTA}
        </Button>
        <CtoDemoLeaveBehindExportButton />
        <CtoDemoShareSnapshotButton />
      </div>
      <CtoDemoNextStepsClosingSection />
    </section>
  );
}
