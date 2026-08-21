"use client";

import { useEffect, useState } from "react";

import { getReviewClarificationQuestions } from "@/lib/api/review-clarification-questions-api";
import type { ReviewClarificationQuestionsResponse } from "@/lib/review-clarification-questions-types";

export function useReviewClarificationQuestions(
  runId: string,
  enabled: boolean,
  priorRunId?: string | null,
): {
  readonly status: "idle" | "loading" | "ready" | "error";
  readonly data: ReviewClarificationQuestionsResponse | null;
} {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<ReviewClarificationQuestionsResponse | null>(null);

  useEffect(() => {
    if (!enabled || runId.trim().length === 0) {
      setStatus("idle");
      setData(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    void getReviewClarificationQuestions(runId, priorRunId)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, priorRunId, runId]);

  return { status, data };
}
