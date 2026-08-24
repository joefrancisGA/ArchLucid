"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_findings_triage_first_finding_strip_dismissed_v1";

export type FindingsTriageFirstFindingStripProps = {
  readonly findingId: string;
  readonly findingTitle: string;
  readonly href: string;
};

/** Dismissible strip that routes operators to the first finding in the queue. */
export function FindingsTriageFirstFindingStrip(
  props: FindingsTriageFirstFindingStripProps,
): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="findings-triage-first-finding-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Start with the first finding</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Triage top to bottom — begin with <span className="font-medium text-al-text-primary">{props.findingTitle}</span>.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button type="button" variant="primary" size="sm" asChild data-testid="findings-triage-first-finding-action">
          <Link href={props.href}>Open finding</Link>
        </Button>
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}
