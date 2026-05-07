"use client";

import { useState } from "react";

import {
  buildGoldenManifestMarkdownFilename,
  formatGoldenManifestMarkdown,
  isUsableGoldenManifestExportJson,
  triggerGoldenManifestMarkdownDownload,
} from "@/lib/export-markdown";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

export type GoldenManifestExportMenuProps = {
  runId: string;
  manifestId: string;
  goldenManifestJson: unknown | null;
  manifestSummary: ManifestSummary | null;
  trustEvidenceCard?: RunTrustEvidenceCard | null;
};

/**
 * Export menu for reviewed (golden) manifest artifacts on run detail — Markdown is generated entirely in the browser.
 */
export function GoldenManifestExportMenu(props: GoldenManifestExportMenuProps) {
  const { runId, manifestId, goldenManifestJson, manifestSummary, trustEvidenceCard } = props;
  const [exportMenuKey, setExportMenuKey] = useState(0);

  const canExport: boolean =
    isUsableGoldenManifestExportJson(goldenManifestJson) || manifestSummary !== null;

  if (!canExport) {
    return null;
  }

  return (
    <Select
      key={exportMenuKey}
      onValueChange={(value: string) => {
        if (value !== "markdown-summary") {
          return;
        }

        const markdown: string = formatGoldenManifestMarkdown(goldenManifestJson, {
          runId,
          manifestSummaryFallback: manifestSummary,
          trustEvidenceCard: trustEvidenceCard ?? null,
        });

        const filename: string = buildGoldenManifestMarkdownFilename(runId, manifestId);

        triggerGoldenManifestMarkdownDownload(markdown, filename);
        recordFirstExportOpenedOnce();
        setExportMenuKey((k: number) => k + 1);
      }}
    >
      <SelectTrigger className="h-9 w-[10rem]" aria-label="Export reviewed manifest">
        <SelectValue placeholder="Export" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="markdown-summary">Markdown summary</SelectItem>
      </SelectContent>
    </Select>
  );
}
