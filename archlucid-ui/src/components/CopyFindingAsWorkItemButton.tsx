"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Check, ClipboardList } from "lucide-react";
import { useCallback, useState } from "react";

import {
  findingInspectNarrativeFields,
  findingInspectPrimaryLabels,
} from "@/lib/findings/finding-display-from-inspect";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type WorkItemClipboardFormat,
  buildInspectFindingWorkItemBody,
  buildTraceRowWorkItemBody,
  writeWorkItemBodyToClipboard,
  type FindingWorkItemBuildInput,
} from "@/lib/copy-finding-as-work-item";
import { findingWorkItemSealedManifestCopyBlockedReason } from "@/lib/findings/finding-work-item-sealed-manifest-guard";
import { showError, showSuccess } from "@/lib/toast";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import type { FindingTraceConfidenceDto } from "@/types/explanation";

/** Target system for pasted body text (Markdown family shares the same builders today). */
const FORMAT_ITEMS: readonly { readonly value: WorkItemClipboardFormat; readonly label: string }[] = [
  { value: "jiraWiki", label: "Jira (wiki)" },
  { value: "serviceNowText", label: "ServiceNow (plain text)" },
  { value: "markdown", label: "Markdown" },
  { value: "githubMarkdown", label: "GitHub Issues" },
  { value: "azureDevOpsMarkdown", label: "Azure Boards" },
  { value: "json", label: "JSON (external seam)" },
] as const;

const COPY_FOR_JIRA_LABEL = "Copy for Jira";
const COPY_AS_WORK_ITEM_LABEL = "Copy as work item";
const COPY_FOR_ITSM_ARIA = "Copy finding for Jira or ServiceNow — formatted text to clipboard";
const QUICK_COPY_JIRA_ARIA = "Copy finding as Jira wiki markup to clipboard";

function evidenceLinesFromInspectPayload(payload: FindingInspectPayload): string[] {
  return payload.evidence.map((e) => {
    const base = e.excerpt?.trim() ?? e.artifactId?.trim() ?? "";
    const lr = e.lineRange?.trim();

    if (base.length === 0 && (lr === undefined || lr.length === 0)) {
      return "Not available";
    }

    if (lr !== undefined && lr.length > 0) {
      return `${base.length > 0 ? base : "(citation)"} (${lr})`;
    }

    return base;
  });
}

function buildFindingWorkItemInput(
  runId: string,
  findingId: string,
  siteOrigin: string,
  payload: FindingInspectPayload,
): FindingWorkItemBuildInput {
  const labels = findingInspectPrimaryLabels(payload);
  const narrative = findingInspectNarrativeFields(payload);

  return {
    runId,
    findingId,
    siteOrigin,
    severityLabel: labels.severityLabel,
    categoryLabel: labels.categoryLabel,
    impactedAreaLabel: labels.impactedAreaLabel,
    title: narrative.title,
    description: narrative.description,
    recommendedAction: labels.recommendedAction,
    decisionRuleId: payload.decisionRuleId,
    decisionRuleName: payload.decisionRuleName,
    evidenceExcerpts: evidenceLinesFromInspectPayload(payload),
    trustLabel: payload.trustLabel ?? null,
    trustLabelReason: payload.trustLabelReason ?? null,
    manifestVersion: payload.manifestVersion ?? null,
  };
}

type CopyFeedbackKind = "none" | "jira" | "selected";

type WorkItemCopyControlsProps = {
  format: WorkItemClipboardFormat;
  onFormatChange: (format: WorkItemClipboardFormat) => void;
  copied: CopyFeedbackKind;
  onQuickCopyJira: () => void;
  onCopySelectedFormat: () => void;
  compact?: boolean;
  prominent?: boolean;
  selectedFormatTestId?: string;
};

function WorkItemCopyControls({
  format,
  onFormatChange,
  copied,
  onQuickCopyJira,
  onCopySelectedFormat,
  compact = false,
  prominent = false,
  selectedFormatTestId = "copy-work-item-selected-format",
}: WorkItemCopyControlsProps) {
  const selectTriggerClass = compact
    ? "h-7 w-full"
    : prominent
      ? "h-9 w-[12rem]"
      : "h-8 w-[11.5rem]";

  const buttonClass = compact ? "h-7 gap-1 px-2" : prominent ? "h-9 gap-1.5" : "h-8 gap-1.5";

  return (
    <div className={compact ? "flex min-w-0 flex-col gap-1.5" : "flex flex-wrap items-center gap-2"}>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className={buttonClass}
        aria-label={QUICK_COPY_JIRA_ARIA}
        data-testid="copy-for-jira-button"
        onClick={onQuickCopyJira}
      >
        {copied === "jira" ? (
          <Check className="size-3.5 text-emerald-100" aria-hidden />
        ) : (
          <ClipboardList className="size-3.5" aria-hidden />
        )}
        {copied === "jira" ? "Copied for Jira" : COPY_FOR_JIRA_LABEL}
      </Button>
      <Select
        value={format}
        onValueChange={(value) => {
          onFormatChange(value as WorkItemClipboardFormat);
        }}
      >
        <SelectTrigger className={selectTriggerClass} aria-label="Work item format">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          {FORMAT_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value} className={OPERATOR_TYPOGRAPHY.helper}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant={compact ? "outline" : "secondary"}
        size="sm"
        className={buttonClass}
        aria-label={COPY_FOR_ITSM_ARIA}
        data-testid={selectedFormatTestId}
        onClick={onCopySelectedFormat}
      >
        {copied === "selected" ? (
          <Check className="size-3.5 text-emerald-600" aria-hidden />
        ) : (
          <ClipboardList className="size-3.5" aria-hidden />
        )}
        {copied === "selected" ? "Copied" : COPY_AS_WORK_ITEM_LABEL}
      </Button>
    </div>
  );
}

export type CopyFindingAsWorkItemButtonProps = {
  runId: string;
  findingId: string;
  payload: FindingInspectPayload;
  /** Larger controls for above-the-fold finding detail placement. */
  prominent?: boolean;
  /** Compact layout for grouped action bars. */
  compact?: boolean;
};

/**
 * Copies a structured work-item body for Jira, GitHub, Azure Boards, or ServiceNow from the finding inspect payload.
 */
export function CopyFindingAsWorkItemButton({
  runId,
  findingId,
  payload,
  prominent = false,
  compact = false,
}: CopyFindingAsWorkItemButtonProps) {
  const [format, setFormat] = useState<WorkItemClipboardFormat>("jiraWiki");
  const [copied, setCopied] = useState<CopyFeedbackKind>("none");

  const resetCopied = useCallback(() => {
    window.setTimeout(() => {
      setCopied("none");
    }, 2_000);
  }, []);

  const copyText = useCallback(
    async (text: string, kind: CopyFeedbackKind) => {
      const ok = await writeWorkItemBodyToClipboard(text);

      if (!ok) {
        showError("Could not copy to clipboard");

        return;
      }

      showSuccess(kind === "jira" ? "Copied for Jira" : "Copied for Jira/ITSM");
      setCopied(kind);
      resetCopied();
    },
    [resetCopied],
  );

  const ensureCopyAllowed = useCallback(
    (input: FindingWorkItemBuildInput): boolean => {
      const blockedReason = findingWorkItemSealedManifestCopyBlockedReason(input);

      if (blockedReason !== null) {
        showError(blockedReason);

        return false;
      }

      return true;
    },
    [],
  );

  const onQuickCopyJira = useCallback(async () => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const input = buildFindingWorkItemInput(runId, findingId, siteOrigin, payload);

    if (!ensureCopyAllowed(input)) {
      return;
    }

    const text = buildInspectFindingWorkItemBody("jiraWiki", input);
    await copyText(text, "jira");
  }, [copyText, ensureCopyAllowed, findingId, payload, runId]);

  const onCopySelectedFormat = useCallback(async () => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const input = buildFindingWorkItemInput(runId, findingId, siteOrigin, payload);

    if (!ensureCopyAllowed(input)) {
      return;
    }

    const text = buildInspectFindingWorkItemBody(format, input);
    await copyText(text, "selected");
  }, [copyText, ensureCopyAllowed, findingId, format, payload, runId]);

  return (
    <WorkItemCopyControls
      format={format}
      onFormatChange={setFormat}
      copied={copied}
      onQuickCopyJira={() => {
        void onQuickCopyJira();
      }}
      onCopySelectedFormat={() => {
        void onCopySelectedFormat();
      }}
      prominent={prominent}
      compact={compact}
    />
  );
}

export type CopyGovernanceQueueWorkItemButtonProps = {
  runId: string;
  findingId: string;
  findingTitle: string;
  severityLabel: string;
  recommendedAction: string;
  statusLabel: string;
  manifestVersion?: string | null;
  /** Compact layout for queue table cells. */
  compact?: boolean;
};

/**
 * Minimal copy affordance for governance findings queue rows (no inspect payload on the client).
 */
export function CopyGovernanceQueueWorkItemButton({
  runId,
  findingId,
  findingTitle,
  severityLabel,
  recommendedAction,
  statusLabel,
  manifestVersion = null,
  compact = false,
}: CopyGovernanceQueueWorkItemButtonProps) {
  const [format, setFormat] = useState<WorkItemClipboardFormat>("jiraWiki");
  const [copied, setCopied] = useState<CopyFeedbackKind>("none");

  const resetCopied = useCallback(() => {
    window.setTimeout(() => {
      setCopied("none");
    }, 2_000);
  }, []);

  const buildRowInput = useCallback(() => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

    return {
      runId,
      findingId,
      findingTitle,
      severityLabel,
      recommendedAction,
      statusLabel,
      ruleId: null,
      siteOrigin,
    };
  }, [findingId, findingTitle, recommendedAction, runId, severityLabel, statusLabel]);

  const copyText = useCallback(
    async (text: string, kind: CopyFeedbackKind) => {
      const ok = await writeWorkItemBodyToClipboard(text);

      if (!ok) {
        showError("Could not copy to clipboard");

        return;
      }

      showSuccess(kind === "jira" ? "Copied for Jira" : "Copied for Jira/ITSM");
      setCopied(kind);
      resetCopied();
    },
    [resetCopied],
  );

  const ensureCopyAllowed = useCallback((): boolean => {
    const blockedReason = findingWorkItemSealedManifestCopyBlockedReason({ runId, manifestVersion });

    if (blockedReason !== null) {
      showError(blockedReason);

      return false;
    }

    return true;
  }, [manifestVersion, runId]);

  const onQuickCopyJira = useCallback(async () => {
    if (!ensureCopyAllowed()) {
      return;
    }

    const text = buildTraceRowWorkItemBody("jiraWiki", buildRowInput());
    await copyText(text, "jira");
  }, [buildRowInput, copyText, ensureCopyAllowed]);

  const onCopySelectedFormat = useCallback(async () => {
    if (!ensureCopyAllowed()) {
      return;
    }

    const text = buildTraceRowWorkItemBody(format, buildRowInput());
    await copyText(text, "selected");
  }, [buildRowInput, copyText, ensureCopyAllowed, format]);

  return (
    <WorkItemCopyControls
      format={format}
      onFormatChange={setFormat}
      copied={copied}
      onQuickCopyJira={() => {
        void onQuickCopyJira();
      }}
      onCopySelectedFormat={() => {
        void onCopySelectedFormat();
      }}
      compact={compact}
      selectedFormatTestId="copy-governance-work-item-selected-format"
    />
  );
}

export type CopyTraceRowWorkItemButtonProps = {
  runId: string;
  row: FindingTraceConfidenceDto;
  manifestVersion?: string | null;
};

/**
 * Minimal copy for [`RunFindingExplainabilityTable`](/components/RunFindingExplainabilityTable) rows (aggregate trace list).
 */
export function CopyTraceRowWorkItemButton({
  runId,
  row,
  manifestVersion = null,
}: CopyTraceRowWorkItemButtonProps) {
  const [format, setFormat] = useState<WorkItemClipboardFormat>("jiraWiki");
  const [copied, setCopied] = useState<CopyFeedbackKind>("none");

  const resetCopied = useCallback(() => {
    window.setTimeout(() => {
      setCopied("none");
    }, 2_000);
  }, []);

  const buildRowInput = useCallback(() => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

    return {
      runId,
      findingId: row.findingId,
      findingTitle: row.findingTitle ?? null,
      severityLabel: null,
      recommendedAction: null,
      statusLabel: null,
      ruleId: row.ruleId ?? null,
      siteOrigin,
    };
  }, [row.findingId, row.findingTitle, row.ruleId, runId]);

  const copyText = useCallback(
    async (text: string, kind: CopyFeedbackKind) => {
      const ok = await writeWorkItemBodyToClipboard(text);

      if (!ok) {
        showError("Could not copy to clipboard");

        return;
      }

      showSuccess(kind === "jira" ? "Copied for Jira" : "Copied work item to clipboard");
      setCopied(kind);
      resetCopied();
    },
    [resetCopied],
  );

  const ensureCopyAllowed = useCallback((): boolean => {
    const blockedReason = findingWorkItemSealedManifestCopyBlockedReason({ runId, manifestVersion });

    if (blockedReason !== null) {
      showError(blockedReason);

      return false;
    }

    return true;
  }, [manifestVersion, runId]);

  const onQuickCopyJira = useCallback(async () => {
    if (!ensureCopyAllowed()) {
      return;
    }

    const text = buildTraceRowWorkItemBody("jiraWiki", buildRowInput());
    await copyText(text, "jira");
  }, [buildRowInput, copyText, ensureCopyAllowed]);

  const onCopySelectedFormat = useCallback(async () => {
    if (!ensureCopyAllowed()) {
      return;
    }

    const text = buildTraceRowWorkItemBody(format, buildRowInput());
    await copyText(text, "selected");
  }, [buildRowInput, copyText, ensureCopyAllowed, format]);

  return (
    <WorkItemCopyControls
      format={format}
      onFormatChange={setFormat}
      copied={copied}
      onQuickCopyJira={() => {
        void onQuickCopyJira();
      }}
      onCopySelectedFormat={() => {
        void onCopySelectedFormat();
      }}
      compact
      selectedFormatTestId="copy-trace-row-work-item-selected-format"
    />
  );
}
