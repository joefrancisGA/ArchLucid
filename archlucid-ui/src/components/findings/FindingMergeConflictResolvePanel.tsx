"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  resolveFindingMergeConflict,
  type FindingMergeConflictResolutionAction,
} from "@/lib/governance/finding-merge-conflict-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast";

export type FindingMergeConflictResolvePanelProps = {
  readonly runId: string;
  readonly findingId: string;
};

export function FindingMergeConflictResolvePanel(
  props: FindingMergeConflictResolvePanelProps,
): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const resolve = useCallback(
    async (action: FindingMergeConflictResolutionAction) => {
      setBusy(true);

      try {
        await resolveFindingMergeConflict(props.runId, props.findingId, action);
        showSuccess("Merge conflict resolved.");
        window.location.reload();
      } catch (error) {
        showError(
          "Merge conflict",
          error instanceof Error ? error.message : "Resolution failed.",
        );
      } finally {
        setBusy(false);
      }
    },
    [props.findingId, props.runId],
  );

  return (
    <section
      className="mt-3 space-y-2 rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30"
      data-testid="finding-merge-conflict-resolve-panel"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Resolve this finding merge conflict
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void resolve("AcceptPrimary")}
        >
          Accept primary
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void resolve("AcceptAlternate")}
        >
          Accept alternate
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void resolve("KeepBoth")}
        >
          Keep both
        </Button>
      </div>
    </section>
  );
}
