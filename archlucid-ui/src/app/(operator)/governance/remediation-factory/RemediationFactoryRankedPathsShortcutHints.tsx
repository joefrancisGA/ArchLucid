"use client";

import { ShortcutHint } from "@/components/ShortcutHint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { REMEDIATION_FACTORY_QUEUE_NAVIGATION_SHORTCUTS } from "@/lib/remediation-factory/remediation-factory-page-shortcuts";
import { cn } from "@/lib/utils";

export function RemediationFactoryRankedPathsShortcutHints(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 flex flex-wrap items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="remediation-factory-ranked-path-queue-shortcuts"
    >
      {REMEDIATION_FACTORY_QUEUE_NAVIGATION_SHORTCUTS.map((entry) => (
        <span key={entry.key} className="inline-flex items-center gap-1">
          {entry.label} <ShortcutHint shortcut={entry.key} />
        </span>
      ))}
    </p>
  );
}
