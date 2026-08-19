"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postFindingMute } from "@/lib/api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type QuickDecisionFindingMuteDialogProps = {
  readonly runId: string;
  /** Finding awaiting a mute reason; `null` while no row has requested muting. */
  readonly finding: QuickDecisionFinding | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /**
   * Textarea id, unique per rendered summary layout so the label association stays
   * valid when both the card and workspace layouts exist on one page.
   */
  readonly reasonInputId: string;
};

/** Reason capture for muting one finding; refreshes the route so the muted row disappears. */
export function QuickDecisionFindingMuteDialog(
  props: QuickDecisionFindingMuteDialogProps,
): ReactElement {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close(): void {
    setReason("");
    setError(null);
    setBusy(false);
    props.onOpenChange(false);
  }

  async function mute(finding: QuickDecisionFinding): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      await postFindingMute(props.runId, finding.findingId, reason.trim());
      close();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mute request failed.");
    } finally {
      setBusy(false);
    }
  }

  function submit(): void {
    const finding = props.finding;

    if (finding === null) {
      return;
    }

    void mute(finding);
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) {
          close();

          return;
        }

        props.onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mute finding</DialogTitle>
          <DialogDescription>
            Provide a short reason. Muted findings are hidden from this summary until you enable{" "}
            <strong>Show muted findings</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={props.reasonInputId}>Reason</Label>
          <Textarea
            id={props.reasonInputId}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
            }}
            rows={4}
            className="resize-y"
            disabled={busy}
          />
          {error ? (
            <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)}>{error}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={busy || reason.trim().length === 0}
            onClick={submit}
          >
            {busy ? "Saving…" : "Mute finding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
