"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { AskRunCoverageHonestyStrip } from "@/components/ask/AskRunCoverageHonestyStrip";
import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { askReviewQuestionsHref } from "@/lib/ask-review-questions-route";
import { useAskStream } from "@/hooks/useAskStream";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseReviewAskDockOpenFromSearch,
  parseReviewAskDockThreadIdFromSearch,
  reviewAskDockHrefFromSearch,
} from "@/lib/reviews/review-ask-dock-url";
import { formatWhyDisabledCtaMessage, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

const DEFAULT_REVIEW_QUESTION =
  "What are the top unresolved risks in this review and what evidence supports them?";

export type ReviewAskDockProps = {
  readonly runId: string;
  readonly reviewTitle?: string | null;
  readonly disabled?: boolean;
  readonly disabledReason?: WhyDisabledCtaReason | null;
  readonly disabledDescribedById?: string;
};

type AskTurn = {
  question: string;
  answer: string;
};

/** Review-scoped Ask dock: grounded Q&A without leaving the review detail page. */
export function ReviewAskDock(props: ReviewAskDockProps): ReactElement {
  const runId = props.runId.trim();
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${encodeURIComponent(runId)}`;
  const searchParams = useSearchParams();
  const urlAskDockOpen = parseReviewAskDockOpenFromSearch(searchParams.get("askDock"));
  const urlAskThreadId = parseReviewAskDockThreadIdFromSearch(searchParams.get("askThread"));
  const [open, setOpenState] = useState(urlAskDockOpen);
  const [question, setQuestion] = useState(DEFAULT_REVIEW_QUESTION);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [threadId, setThreadIdState] = useState<string | null>(urlAskThreadId.length > 0 ? urlAskThreadId : null);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { ask: askStream, isStreaming, tokens: streamingContent, reset: resetStream } = useAskStream();
  const askDockDisabled = props.disabled === true;
  const disabledReasonMessage = formatWhyDisabledCtaMessage(props.disabledReason);

  const syncAskDockToUrl = useCallback(
    (nextOpen: boolean, nextThreadId: string | null) => {
      router.replace(
        reviewAskDockHrefFromSearch(
          searchParams.toString(),
          { open: nextOpen, threadId: nextThreadId },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      setOpenState(nextOpen);
      syncAskDockToUrl(nextOpen, threadId);
    },
    [syncAskDockToUrl, threadId],
  );

  const setThreadId = useCallback(
    (nextThreadId: string | null) => {
      setThreadIdState(nextThreadId);
      syncAskDockToUrl(open, nextThreadId);
    },
    [open, syncAskDockToUrl],
  );

  useEffect(() => {
    if (askDockDisabled) {
      if (urlAskDockOpen) {
        setOpenState(false);
        syncAskDockToUrl(false, threadId);
      }

      return;
    }

    setOpenState(urlAskDockOpen);

    if (urlAskThreadId.length > 0) {
      setThreadIdState(urlAskThreadId);
    }
  }, [askDockDisabled, syncAskDockToUrl, threadId, urlAskDockOpen, urlAskThreadId]);

  const submitQuestion = useCallback(async (): Promise<void> => {
    const trimmed = question.trim();

    if (trimmed.length === 0 || isStreaming || runId.length === 0) {
      return;
    }

    setError(null);
    resetStream();

    try {
      const { response, error: streamError } = await askStream({
        question: trimmed,
        runId,
        threadId: threadId ?? undefined,
      });

      if (streamError !== null) {
        setError({
          message: streamError,
          problem: null,
          correlationId: null,
        });
        return;
      }

      if (response === null) {
        setError({
          message: "Ask request returned no answer.",
          problem: null,
          correlationId: null,
        });
        return;
      }

      if (response.threadId.trim().length > 0) {
        setThreadId(response.threadId);
      }

      setTurns((current) => [...current, { question: trimmed, answer: response.answer }]);
      setQuestion("");
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setError({
          message: e instanceof Error ? e.message : "Ask request failed.",
          problem: null,
          correlationId: null,
        });
      }
    }
  }, [askStream, isStreaming, question, resetStream, runId, threadId]);

  if (runId.length === 0) {
    return <></>;
  }

  const fullAskHref = askReviewQuestionsHref({ runId });

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={askDockDisabled}
        aria-describedby={askDockDisabled ? props.disabledDescribedById : undefined}
        aria-label={
          askDockDisabled
            ? disabledReasonMessage ?? "Ask about this review unavailable until the review completes"
            : undefined
        }
        onClick={() => {
          if (askDockDisabled) {
            return;
          }

          setOpen(true);
        }}
        data-testid="review-ask-dock-trigger"
      >
        <MessageCircleQuestion className="h-4 w-4" aria-hidden />
        Ask about this review
      </Button>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <HelpDrawerContent
          modal={false}
          returnFocusRef={triggerRef}
          className="z-[52]"
          data-testid="review-ask-dock-panel"
        >
          <DialogHeader className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <DialogTitle className={cn("text-left text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Ask about this review
            </DialogTitle>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Grounded answers cite indexed evidence from{" "}
              <span className="font-medium text-al-text-primary">{props.reviewTitle ?? "this review"}</span>.
            </p>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <AskRunCoverageHonestyStrip runId={runId} />
            {turns.length > 0 ? (
              <ol className="m-0 list-none space-y-4 p-0">
                {turns.map((turn, index) => (
                  <li
                    key={`${index}-${turn.question.slice(0, 24)}`}
                    className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
                  >
                    <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                      You asked
                    </p>
                    <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{turn.question}</p>
                    <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
                      Answer
                    </p>
                    <AskAssistantMessageBody content={turn.answer} />
                  </li>
                ))}
              </ol>
            ) : null}

            {isStreaming && streamingContent.trim().length > 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
                <AskAssistantMessageBody content={streamingContent} />
              </div>
            ) : null}

            {error !== null ? (
              <OperatorApiProblem
                problem={error.problem}
                fallbackMessage={error.message}
                correlationId={error.correlationId}
              />
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="review-ask-dock-question" className={OPERATOR_TYPOGRAPHY.helper}>
                Your question
              </Label>
              <Textarea
                id="review-ask-dock-question"
                value={question}
                rows={3}
                disabled={isStreaming}
                onChange={(event) => {
                  setQuestion(event.target.value);
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={isStreaming || question.trim().length === 0}
                  onClick={() => {
                    void submitQuestion();
                  }}
                  data-testid="review-ask-dock-submit"
                >
                  {isStreaming ? "Asking…" : "Ask"}
                </Button>
                <Link className={OPERATOR_LINK.inline} href={fullAskHref}>
                  Open full Ask workspace →
                </Link>
              </div>
            </div>
          </div>
        </HelpDrawerContent>
      </Dialog>
    </>
  );
}
