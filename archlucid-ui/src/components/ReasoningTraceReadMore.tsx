"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

const REASON_TRUNC = 500;

/** Sidebar-friendly reasoning excerpt with deterministic cutoff (Improvement #10 UX). */
export function ReasoningTraceReadMore({ heading, trace }: { heading: string; trace: string }) {
  const normalized = trace.trim();
  const [expanded, setExpanded] = useState(false);

  const needsTruncate = normalized.length > REASON_TRUNC;

  const display = useMemo(() => {
    if (!needsTruncate || expanded)
      return normalized;

    return `${normalized.slice(0, REASON_TRUNC)}…`;
  }, [needsTruncate, expanded, normalized]);

  return (
    <div className="space-y-2">
      <h4 className="m-0">{heading}</h4>
      <p className="m-0 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">{display}</p>
      {needsTruncate ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Expand full reasoning"}
        </Button>
      ) : null}
    </div>
  );
}
