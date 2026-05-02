"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  submitProductLearningSignal,
  type ProductLearningDisposition,
  type ProductLearningSignalRequest,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ProductLearningFeedbackControlsProps = {
  readonly runId?: string | null;
  readonly manifestVersion?: string | null;
  readonly subjectType: ProductLearningSignalRequest["subjectType"];
  readonly artifactHint?: string | null;
  readonly patternKey?: string | null;
  readonly detail?: Record<string, unknown>;
  readonly compact?: boolean;
  readonly title?: string;
};

const dispositionOptions: { readonly value: ProductLearningDisposition; readonly label: string }[] = [
  { value: "Trusted", label: "Trusted" },
  { value: "Revised", label: "Needs revision" },
  { value: "Rejected", label: "Rejected" },
  { value: "NeedsFollowUp", label: "Follow up" },
];

function isGuidLike(value: string | null | undefined): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
  );
}

/**
 * Small pilot-feedback capture control. It writes product-learning signals, not remediation workflow state.
 */
export function ProductLearningFeedbackControls({
  runId,
  manifestVersion,
  subjectType,
  artifactHint,
  patternKey,
  detail,
  compact = false,
  title = "Was this useful?",
}: ProductLearningFeedbackControlsProps) {
  const [comment, setComment] = useState("");
  const [busyDisposition, setBusyDisposition] = useState<ProductLearningDisposition | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const detailJson = useMemo(() => {
    if (!detail) {
      return undefined;
    }

    return JSON.stringify(detail);
  }, [detail]);

  async function submit(disposition: ProductLearningDisposition): Promise<void> {
    setBusyDisposition(disposition);
    setStatus("idle");

    const trimmedRunId = runId?.trim();
    const trimmedComment = comment.trim();
    const request: ProductLearningSignalRequest = {
      subjectType,
      disposition,
      ...(isGuidLike(trimmedRunId) ? { architectureRunId: trimmedRunId, authorityRunId: trimmedRunId } : {}),
      ...(manifestVersion && manifestVersion.trim().length > 0 ? { manifestVersion: manifestVersion.trim() } : {}),
      ...(artifactHint && artifactHint.trim().length > 0 ? { artifactHint: artifactHint.trim() } : {}),
      ...(patternKey && patternKey.trim().length > 0 ? { patternKey: patternKey.trim() } : {}),
      ...(trimmedComment.length > 0 ? { commentShort: trimmedComment } : {}),
      ...(detailJson ? { detailJson } : {}),
    };

    try {
      await submitProductLearningSignal(request);
      setStatus("saved");
      setComment("");
    } catch {
      setStatus("error");
    } finally {
      setBusyDisposition(null);
    }
  }

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-white/80 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900/60",
        compact ? "space-y-2" : "space-y-3",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 font-semibold text-neutral-800 dark:text-neutral-100">{title}</p>
        {status === "saved" ? (
          <span className="text-teal-700 dark:text-teal-300" role="status">
            Feedback saved.
          </span>
        ) : null}
        {status === "error" ? (
          <span className="text-red-700 dark:text-red-300" role="alert">
            Could not save feedback.
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dispositionOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={option.value === "Trusted" ? "outline" : "ghost"}
            className="h-7 px-2 text-xs"
            disabled={busyDisposition !== null}
            onClick={() => void submit(option.value)}
          >
            {busyDisposition === option.value ? "Saving..." : option.label}
          </Button>
        ))}
      </div>
      <label className="block">
        <span className="sr-only">Optional feedback comment</span>
        <input
          type="text"
          maxLength={2000}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
          }}
          placeholder="Optional note for product learning; do not include secrets."
          className="auth-panel-focus w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
        />
      </label>
    </div>
  );
}
