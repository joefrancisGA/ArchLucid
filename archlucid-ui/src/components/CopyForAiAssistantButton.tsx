"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildGoldenManifestMarkdownFilename,
  formatGoldenManifestMarkdown,
  isUsableGoldenManifestExportJson,
  triggerGoldenManifestMarkdownDownload,
} from "@/lib/export-markdown";
import { runCollateralSealedManifestCopyBlockedReason, manifestSummarySealedVersionForCopyGuard } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

const DEFAULT_LABEL = "Copy for AI assistant";
const COPIED_LABEL = "Copied";
const DOWNLOADED_LABEL = "Downloaded";
const FEEDBACK_MS = 1_500;

export type CopyForAiAssistantButtonProps = {
  goldenManifestJson: unknown | null;
  manifestSummary: ManifestSummary | null;
  trustEvidenceCard?: RunTrustEvidenceCard | null;
  runId: string;
};

/**
 * Copies formatted golden-manifest Markdown to the clipboard for pasting into Claude, GPT, or Gemini.
 * Falls back to a one-shot Markdown download when the clipboard API is unavailable.
 */
export function CopyForAiAssistantButton(props: CopyForAiAssistantButtonProps) {
  const { goldenManifestJson, manifestSummary, trustEvidenceCard, runId } = props;
  const [buttonLabel, setButtonLabel] = useState(DEFAULT_LABEL);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleLabelReset = useCallback(() => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setButtonLabel(DEFAULT_LABEL);
      resetTimerRef.current = null;
    }, FEEDBACK_MS);
  }, []);

  if (!isUsableGoldenManifestExportJson(goldenManifestJson)) {
    return null;
  }

  async function handleCopyForAiAssistant(): Promise<void> {
    const blockedReason = runCollateralSealedManifestCopyBlockedReason({
      runId,
      manifestVersion: manifestSummarySealedVersionForCopyGuard(manifestSummary),
    });

    if (blockedReason !== null) {
      return;
    }

    const markdown: string = formatGoldenManifestMarkdown(goldenManifestJson, {
      runId,
      manifestSummaryFallback: manifestSummary,
      trustEvidenceCard: trustEvidenceCard ?? null,
    });

    try {
      await navigator.clipboard.writeText(markdown);
      setButtonLabel(COPIED_LABEL);
      scheduleLabelReset();
    } catch {
      const filename: string = buildGoldenManifestMarkdownFilename(
        runId,
        manifestSummary?.manifestId ?? null,
      );

      triggerGoldenManifestMarkdownDownload(markdown, filename);
      setButtonLabel(DOWNLOADED_LABEL);
      scheduleLabelReset();
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9"
      data-testid="copy-for-ai-assistant-button"
      onClick={() => {
        void handleCopyForAiAssistant();
      }}
    >
      {buttonLabel}
    </Button>
  );
}
