"use client";

import { useEffect, useState, type ReactElement } from "react";

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
import {
  ADVISORY_SCANS_DISPOSITION_COMMENT_LABEL,
  ADVISORY_SCANS_DISPOSITION_CONFIRM_LABEL,
  ADVISORY_SCANS_DISPOSITION_DIALOG_DESCRIPTION,
  ADVISORY_SCANS_DISPOSITION_DIALOG_TITLE,
  ADVISORY_SCANS_DISPOSITION_RATIONALE_LABEL,
} from "@/lib/advisory-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AdvisoryRecommendationDispositionDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Human disposition label (Accept, Defer, …). */
  readonly actionLabel: string | null;
  readonly busy: boolean;
  readonly errorMessage: string | null;
  readonly onConfirm: (comment: string, rationale: string) => void;
};

/** On-system comment/rationale capture for advisory recommendation dispositions (TB-1566). */
export function AdvisoryRecommendationDispositionDialog(
  props: AdvisoryRecommendationDispositionDialogProps,
): ReactElement {
  const [comment, setComment] = useState("");
  const [rationale, setRationale] = useState("");

  useEffect(() => {
    if (!props.open) {
      setComment("");
      setRationale("");
    }
  }, [props.open]);

  function close(): void {
    setComment("");
    setRationale("");
    props.onOpenChange(false);
  }

  function submit(): void {
    props.onConfirm(comment.trim(), rationale.trim());
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
      <DialogContent data-testid="advisory-recommendation-disposition-dialog">
        <DialogHeader>
          <DialogTitle>{ADVISORY_SCANS_DISPOSITION_DIALOG_TITLE}</DialogTitle>
          <DialogDescription>{ADVISORY_SCANS_DISPOSITION_DIALOG_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        {props.actionLabel !== null ? (
          <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            Disposition: <span className="font-medium text-al-text-primary">{props.actionLabel}</span>
          </p>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="advisory-disposition-comment">{ADVISORY_SCANS_DISPOSITION_COMMENT_LABEL}</Label>
            <Textarea
              id="advisory-disposition-comment"
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
              }}
              rows={3}
              disabled={props.busy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="advisory-disposition-rationale">{ADVISORY_SCANS_DISPOSITION_RATIONALE_LABEL}</Label>
            <Textarea
              id="advisory-disposition-rationale"
              value={rationale}
              onChange={(event) => {
                setRationale(event.target.value);
              }}
              rows={3}
              disabled={props.busy}
            />
          </div>
        </div>

        {props.errorMessage !== null ? (
          <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {props.errorMessage}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={props.busy} onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={props.busy || props.actionLabel === null}
            data-testid="advisory-recommendation-disposition-confirm"
            onClick={submit}
          >
            {ADVISORY_SCANS_DISPOSITION_CONFIRM_LABEL}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
