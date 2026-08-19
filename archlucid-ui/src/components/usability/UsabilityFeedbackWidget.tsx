"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitProductFeedback } from "@/lib/api/tenant-customer-success";
import { showError, showSuccess } from "@/lib/toast";

type UsabilityFeedbackWidgetProps = {
  readonly runId?: string | null;
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** When false, only the dialog surface is rendered (parent supplies open state). */
  readonly showTrigger?: boolean;
};

/** Lightweight in-app feedback — posts to customer-success product-feedback. */
export function UsabilityFeedbackWidget(props: UsabilityFeedbackWidgetProps) {
  const pathname = usePathname() ?? "/";
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;
  const showTrigger = props.showTrigger !== false;
  const [comment, setComment] = useState("");
  const [score, setScore] = useState<number>(4);
  const [busy, setBusy] = useState(false);

  function setOpen(next: boolean): void {
    if (isControlled) {
      props.onOpenChange?.(next);
      return;
    }

    setInternalOpen(next);
  }

  async function submit(): Promise<void> {
    setBusy(true);

    try {
      await submitProductFeedback({
        score,
        comment: `[${pathname}] ${comment.trim()}`,
        runId: props.runId ?? null,
      });
      showSuccess("Thanks — feedback recorded.");
      setOpen(false);
      setComment("");
    }
    catch {
      showError("Could not send feedback. Try again later.");
    }
    finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="usability-feedback-trigger"
          >
            Feedback
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Was this helpful?</DialogTitle>
          <DialogDescription>Short notes help us improve the operator experience.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className={cn("block font-medium", OPERATOR_TYPOGRAPHY.body)} htmlFor="usability-feedback-score">
            Score (1–5)
          </label>
          <input
            id="usability-feedback-score"
            type="range"
            min={1}
            max={5}
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
            className="w-full"
          />
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What worked or felt confusing?"
            rows={4}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={busy || comment.trim().length < 3} onClick={() => void submit()}>
              Send feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
