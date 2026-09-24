"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

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
import {
  parseUsabilityFeedbackOpenFromSearch,
  usabilityFeedbackDisclosureHrefFromSearch,
} from "@/lib/usability/usability-feedback-disclosure-url";

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
  const [internalOpen, setInternalOpenState] = useState(() =>
    parseUsabilityFeedbackOpenFromSearch(
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("usabilityFeedbackOpen"),
    ),
  );
  const internalOpenRef = useRef(internalOpen);
  internalOpenRef.current = internalOpen;
  const isControlled = props.open !== undefined;
  const open = isControlled ? props.open : internalOpen;
  const showTrigger = props.showTrigger !== false;
  const [comment, setComment] = useState("");
  const [score, setScore] = useState<number>(4);
  const [busy, setBusy] = useState(false);

  const syncOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        return;
      }

      commitHrefIfChanged(
        usabilityFeedbackDisclosureHrefFromSearch(readWindowLocationSearch(), nextOpen, pathname),
        { notify: false },
      );
    },
    [isControlled, pathname],
  );

  useEffect(() => {
    if (isControlled) {
      return;
    }

    const syncOpenFromUrl = (): void => {
      const next = parseUsabilityFeedbackOpenFromSearch(
        new URLSearchParams(window.location.search).get("usabilityFeedbackOpen"),
      );

      if (internalOpenRef.current === next) {
        return;
      }

      internalOpenRef.current = next;
      setInternalOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, [isControlled]);

  function setOpen(next: boolean): void {
    if (isControlled) {
      props.onOpenChange?.(next);

      return;
    }

    if (internalOpenRef.current === next) {
      return;
    }

    internalOpenRef.current = next;
    setInternalOpenState(next);
    syncOpenToUrl(next);
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
            className="h-8 text-neutral-600 dark:text-neutral-400"
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
