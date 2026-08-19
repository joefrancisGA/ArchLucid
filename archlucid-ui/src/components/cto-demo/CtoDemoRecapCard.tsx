"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildStaticCtoDemoRecapPayload,
  formatCtoDemoRecapMarkdown,
  type CtoDemoRecapPayload,
} from "@/lib/buyer/buyer-cto-demo-recap";
import {
  BUYER_CTO_DEMO_RECAP_BOARD_PACKET_BUSY_CTA,
  BUYER_CTO_DEMO_RECAP_BOARD_PACKET_CTA,
  BUYER_CTO_DEMO_RECAP_COPY_CTA,
  BUYER_CTO_DEMO_RECAP_DOWNLOAD_CTA,
  BUYER_CTO_DEMO_RECAP_HEADING,
  BUYER_CTO_DEMO_RECAP_SNAPSHOT_COPY_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { CtoDemoLeaveBehindExportButton } from "@/components/cto-demo/CtoDemoLeaveBehindExportButton";
import { CtoDemoShareSnapshotButton } from "@/components/cto-demo/CtoDemoShareSnapshotButton";
import { downloadFirstValueReportPdf } from "@/lib/api";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { showError, showSuccess } from "@/lib/toast";

export type CtoDemoRecapCardProps = {
  readonly payload?: CtoDemoRecapPayload;
};

export function CtoDemoRecapCard(props: CtoDemoRecapCardProps): React.JSX.Element {
  const { payload: payloadProp } = props;
  const [busy, setBusy] = useState(false);
  const [boardPacketBusy, setBoardPacketBusy] = useState(false);
  const showBoardPacket = isCtoDemoPackEnv();

  const payload = useMemo(() => {
    if (payloadProp !== undefined) {
      return payloadProp;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return buildStaticCtoDemoRecapPayload(origin);
  }, [payloadProp]);

  const markdown = useMemo(() => formatCtoDemoRecapMarkdown(payload), [payload]);

  const onCopy = useCallback(async () => {
    setBusy(true);

    try {
      await navigator.clipboard.writeText(markdown);
      showSuccess("Sponsor recap copied to clipboard.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Clipboard unavailable.";

      showError("Copy recap", message);
    } finally {
      setBusy(false);
    }
  }, [markdown]);

  const onDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = payload.systemName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    anchor.href = url;
    anchor.download = `sponsor-recap-${slug || "review"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    showSuccess("Sponsor recap download started.");
  }, [markdown, payload.systemName]);

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

  const onCopySnapshot = useCallback(async () => {
    if (payload.snapshotUrl.trim().length === 0) {
      return;
    }

    setBusy(true);

    try {
      await navigator.clipboard.writeText(payload.snapshotUrl);
      showSuccess("Snapshot link copied to clipboard.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Clipboard unavailable.";

      showError("Copy snapshot link", message);
    } finally {
      setBusy(false);
    }
  }, [payload.snapshotUrl]);

  return (
    <div
      className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
      data-testid="cto-demo-recap-card"
    >
      <p className={cn("m-0 font-semibold text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_CTO_DEMO_RECAP_HEADING}</p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {payload.findingsCount} findings · {payload.riskPosture} · ~{payload.firstValueMinutes} min to value
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onCopy()} data-testid="cto-demo-recap-copy">
          {BUYER_CTO_DEMO_RECAP_COPY_CTA}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDownload} data-testid="cto-demo-recap-download">
          {BUYER_CTO_DEMO_RECAP_DOWNLOAD_CTA}
        </Button>
        {payload.snapshotUrl.trim().length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void onCopySnapshot()}
            data-testid="cto-demo-recap-snapshot-copy"
          >
            {BUYER_CTO_DEMO_RECAP_SNAPSHOT_COPY_CTA}
          </Button>
        ) : null}
        <CtoDemoLeaveBehindExportButton />
        <CtoDemoShareSnapshotButton />
      </div>
      {showBoardPacket ? (
        <div className="mt-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="w-full justify-center sm:w-auto"
            disabled={boardPacketBusy}
            onClick={() => void onBoardPacketDownload()}
            data-testid="cto-demo-recap-board-packet"
          >
            {boardPacketBusy ? BUYER_CTO_DEMO_RECAP_BOARD_PACKET_BUSY_CTA : BUYER_CTO_DEMO_RECAP_BOARD_PACKET_CTA}
          </Button>
        </div>
      ) : null}
      {payload.snapshotUrl.trim().length > 0 ? (
        <p className={cn("m-0 mt-2 break-all font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {payload.snapshotUrl}
        </p>
      ) : null}
    </div>
  );
}
