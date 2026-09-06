"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusTag } from "@/components/ui/status-tag";
import { dryRunPolicyPack } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildPolicyPackSimulationSummary,
  type PolicyPackSimulationSummary,
} from "@/lib/policy/policy-pack-dry-run-summary";
import {
  type PolicyPackDryRunResponse,
} from "@/types/policy-pack-dry-run";
import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

export type PolicyPackWorkspaceAttachPreviewDialogProps = {
  readonly open: boolean;
  readonly item: PolicyPackWorkspaceSelectionItem | null;
  readonly nextEnabled: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => Promise<void>;
};

/** Dry-run impact preview before enabling or disabling a workspace policy pack assignment. */
export function PolicyPackWorkspaceAttachPreviewDialog(
  props: PolicyPackWorkspaceAttachPreviewDialogProps,
): ReactElement | null {
  const { open, item, nextEnabled, onOpenChange, onConfirm } = props;
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [result, setResult] = useState<PolicyPackDryRunResponse | null>(null);
  const [summary, setSummary] = useState<PolicyPackSimulationSummary | null>(null);
  const [failure, setFailure] = useState<ReturnType<typeof toApiLoadFailure> | null>(null);

  const loadPreview = useCallback(async (packId: string): Promise<void> => {
    setPreviewBusy(true);
    setFailure(null);
    setResult(null);
    setSummary(null);

    try {
      const dryRun = await dryRunPolicyPack(packId, {
        proposedThresholds: {},
        evaluateAgainstRunIds: [],
      });
      setResult(dryRun);
      setSummary(buildPolicyPackSimulationSummary(dryRun));
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setPreviewBusy(false);
    }
  }, []);

  if (item === null) {
    return null;
  }

  const actionLabel = nextEnabled ? "Enable pack" : "Disable pack";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
          setResult(null);
          setSummary(null);
          setFailure(null);
        }
      }}
    >
      <DialogContent className="max-w-lg" data-testid="policy-pack-workspace-attach-preview-dialog">
        <DialogHeader>
          <DialogTitle>Preview policy pack impact</DialogTitle>
          <DialogDescription>
            Simulate how <span className="font-medium">{item.name}</span> affects approval gates before you{" "}
            {nextEnabled ? "attach" : "detach"} it for this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag kind="neutral" label={`v${item.currentVersion}`} />
            <StatusTag kind={nextEnabled ? "ready" : "needs-attention"} label={actionLabel} />
          </div>

          {failure !== null ? (
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
            />
          ) : null}

          {summary !== null ? (
            <div className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {summary.headline}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{summary.detail}</p>
            </div>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Run a dry-run against recent reviews to see whether this pack would block, warn, or allow commit.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={previewBusy}
            onClick={() => {
              void loadPreview(item.policyPackId);
            }}
            data-testid="policy-pack-workspace-attach-preview-run"
          >
            {previewBusy ? "Simulating…" : "Run impact preview"}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);

                try {
                  await onConfirm();
                  onOpenChange(false);
                } finally {
                  setBusy(false);
                }
              }}
              data-testid="policy-pack-workspace-attach-preview-confirm"
            >
              {busy ? "Applying…" : `Confirm ${actionLabel.toLowerCase()}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
