"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { MessageCircleQuestion } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { AskAssistantMessageBody } from "@/components/AskAssistantMessageBody";
import { AskCitationActionFollowUps } from "@/components/ask/AskCitationActionFollowUps";
import { buildAskCitationActionFollowUps } from "@/lib/ask-citation-action-follow-ups";
import { AskRunCoverageHonestyStrip } from "@/components/ask/AskRunCoverageHonestyStrip";
import { HelpDrawerContent } from "@/components/help/HelpDrawerContent";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildReviewWorkspaceRouteHref } from "@/lib/architecture/review-workspace-route";
import { askReviewQuestionsHref } from "@/lib/ask-review-questions-route";
import { useAskStream } from "@/hooks/useAskStream";
import { isApiRequestError } from "@/lib/api-request-error";
import { askBlockedReason } from "@/lib/ask/ask-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import {
  REVIEW_ASK_DOCK_OPEN_PARAM,
  REVIEW_ASK_DOCK_THREAD_PARAM,
  parseReviewAskDockOpenFromSearch,
  parseReviewAskDockThreadIdFromSearch,
  reviewAskDockHrefFromSearch,
} from "@/lib/reviews/review-ask-dock-url";
import {
  ASK_ANSWER_NOT_STORED_LABEL,
  ASK_ANSWER_STORED_EMPTY_LABEL,
  askWireCitationRefsOmitted,
  askWireCitationRefsPresentInWire,
  normalizeAskWireAnswerForTurn,
  reviewAskSourcesHonestyLabel,
  REVIEW_ASK_STREAMING_ANSWER_PENDING_LABEL,
  REVIEW_ASK_STREAMING_UUID_LINKS_NOTE,
} from "@/lib/ask/ask-response-turn-honesty";
import { formatWhyDisabledCtaMessage, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";

const DEFAULT_REVIEW_QUESTION_PLACEHOLDER =
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
  answer: string | null;
  referencedFindings: readonly string[];
  referencedDecisions: readonly string[];
  referencedArtifacts: readonly string[];
  citationRefsOmitted: boolean;
};

function buildCitedReviewIdsFromTurn(turn: AskTurn): ReadonlySet<string> {
  if (turn.citationRefsOmitted) {
    return new Set();
  }

  const ids = new Set<string>();

  for (const id of [...turn.referencedFindings, ...turn.referencedDecisions, ...turn.referencedArtifacts]) {
    const trimmed = id.trim();

    if (trimmed.length > 0) {
      ids.add(trimmed.toLowerCase());
    }
  }

  return ids;
}

/** Review-scoped Ask dock: grounded Q&A without leaving the review detail page. */
export function ReviewAskDock(props: ReviewAskDockProps): ReactElement {
  const runId = props.runId.trim();
  const pathname = usePathname() ?? buildReviewWorkspaceRouteHref({ runId });
  const searchParams = useSearchParams();
  const urlAskDockOpen = parseReviewAskDockOpenFromSearch(
    searchParams.get(REVIEW_ASK_DOCK_OPEN_PARAM),
  );
  const urlAskThreadId = parseReviewAskDockThreadIdFromSearch(
    searchParams.get(REVIEW_ASK_DOCK_THREAD_PARAM),
  );
  const [open, setOpenState] = useState(urlAskDockOpen);
  const openRef = useRef(open);
  openRef.current = open;
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [threadId, setThreadIdState] = useState<string | null>(null);
  const disabledCleanupAttemptedRef = useRef(false);
  const [error, setError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { ask: askStream, isStreaming, tokens: streamingContent, reset: resetStream } = useAskStream();
  const askDockDisabled = props.disabled === true;
  const disabledReasonMessage = formatWhyDisabledCtaMessage(props.disabledReason);
  const reviewTitleForGrounding =
    props.reviewTitle !== null && props.reviewTitle !== undefined && props.reviewTitle.trim().length > 0
      ? props.reviewTitle.trim()
      : "Review title was not stored.";

  const syncAskDockToUrl = useCallback(
    (nextOpen: boolean, nextThreadId: string | null) => {
      commitHrefIfChanged(
        reviewAskDockHrefFromSearch(
          searchParams.toString(),
          { open: nextOpen, threadId: nextThreadId },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname, searchParams],
  );

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
      syncAskDockToUrl(nextOpen, threadId);
    },
    [syncAskDockToUrl, threadId],
  );

  const setThreadId = useCallback(
    (nextThreadId: string | null) => {
      if (threadId === nextThreadId) {
        return;
      }

      setThreadIdState(nextThreadId);
      syncAskDockToUrl(open, nextThreadId);
    },
    [open, syncAskDockToUrl, threadId],
  );

  useEffect(() => {
    const syncAskDockFromUrl = (): void => {
      const params = new URLSearchParams(window.location.search);
      const urlAskDockOpen = parseReviewAskDockOpenFromSearch(params.get("askDock"));
      const urlAskThreadId = parseReviewAskDockThreadIdFromSearch(params.get("askThread"));

      if (askDockDisabled) {
        if (urlAskDockOpen && !disabledCleanupAttemptedRef.current) {
          disabledCleanupAttemptedRef.current = true;
          setOpenState(false);
          syncAskDockToUrl(false, null);
        }

        return;
      }

      disabledCleanupAttemptedRef.current = false;

      if (openRef.current !== urlAskDockOpen) {
        openRef.current = urlAskDockOpen;
        setOpenState(urlAskDockOpen);
      }

      if (urlAskThreadId.length > 0) {
        setThreadIdState((current) => (current === urlAskThreadId ? current : urlAskThreadId));
      } else {
        setThreadIdState((current) => (current === null ? current : null));
      }
    };

    syncAskDockFromUrl();
    window.addEventListener("popstate", syncAskDockFromUrl);

    return () => {
      window.removeEventListener("popstate", syncAskDockFromUrl);
    };
  }, [askDockDisabled, syncAskDockToUrl]);

  useEffect(() => {
    if (askDockDisabled) {
      if (urlAskDockOpen && !disabledCleanupAttemptedRef.current) {
        disabledCleanupAttemptedRef.current = true;
        openRef.current = false;
        setOpenState(false);
        syncAskDockToUrl(false, null);
      }

      return;
    }

    disabledCleanupAttemptedRef.current = false;

    if (openRef.current !== urlAskDockOpen) {
      openRef.current = urlAskDockOpen;
      setOpenState(urlAskDockOpen);
    }

    if (urlAskThreadId.length > 0) {
      setThreadIdState((current) => (current === urlAskThreadId ? current : urlAskThreadId));
    } else {
      setThreadIdState((current) => (current === null ? current : null));
    }
  }, [askDockDisabled, syncAskDockToUrl, urlAskDockOpen, urlAskThreadId]);

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
        threadId: threadId ?? undefined});

      if (streamError !== null) {
        setError({
          message: streamError,
          problem: null,
          correlationId: null});

        return;
      }

      if (response === null) {
        setError({
          message: "The ask request failed before an answer was stored.",
          problem: null,
          correlationId: null});
        return;
      }

      if (response.threadId.trim().length > 0) {
        setThreadId(response.threadId);
      }

      const citationRefs = {
        referencedFindings: response.referencedFindings,
        referencedDecisions: response.referencedDecisions,
        referencedArtifacts: response.referencedArtifacts,
      };
      const citationRefsOmitted = askWireCitationRefsOmitted(citationRefs);

      setTurns((current) => [
        ...current,
        {
          question: trimmed,
          answer: normalizeAskWireAnswerForTurn(response.answer),
          referencedFindings: response.referencedFindings ?? [],
          referencedDecisions: response.referencedDecisions ?? [],
          referencedArtifacts: response.referencedArtifacts ?? [],
          citationRefsOmitted,
        },
      ]);
      setQuestion("");
    } catch (e: unknown) {
      const failure = toApiLoadFailure(e);

      if (isApiRequestError(e)) {
        setError({
          message: askBlockedReason(failure) ?? e.message,
          problem: e.problem,
          correlationId: e.correlationId});
      } else {
        setError({
          message: askBlockedReason(failure) ?? (e instanceof Error ? e.message : "Ask request failed."),
          problem: failure.problem,
          correlationId: failure.correlationId});
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
              Answers for{" "}
              <span className="font-medium text-al-text-primary">{reviewTitleForGrounding}</span>{" "}
              cite indexed evidence only when citations were stored on the answer.
            </p>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="review-ask-dock-review-id"
            >
              <span className="font-medium text-al-text-primary">Review id:</span>{" "}
              {runId.length > 0 ? runId : "Review id was not stored."}
            </p>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
            <AskRunCoverageHonestyStrip runId={runId} />
            {turns.length > 0 ? (
              <ol className="m-0 list-none space-y-4 p-0">
                {turns.map((turn, index) => {
                  const citationChips = buildAskCitationActionFollowUps(
                    turn.citationRefsOmitted
                      ? { runId }
                      : {
                          runId,
                          referencedFindings: turn.referencedFindings,
                          referencedDecisions: turn.referencedDecisions,
                          referencedArtifacts: turn.referencedArtifacts,
                        },
                  );
                  const citationRefs = {
                    referencedFindings: turn.citationRefsOmitted
                      ? undefined
                      : turn.referencedFindings,
                    referencedDecisions: turn.citationRefsOmitted
                      ? undefined
                      : turn.referencedDecisions,
                    referencedArtifacts: turn.citationRefsOmitted
                      ? undefined
                      : turn.referencedArtifacts,
                  };
                  const refsPresentInWire = askWireCitationRefsPresentInWire(citationRefs);
                  const sourcesHonestyLabel = reviewAskSourcesHonestyLabel(citationRefs);
                  const citedReviewIds = buildCitedReviewIdsFromTurn(turn);

                  return (
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
                    {turn.answer === null ? (
                      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {ASK_ANSWER_NOT_STORED_LABEL}
                      </p>
                    ) : turn.answer.trim().length === 0 ? (
                      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {ASK_ANSWER_STORED_EMPTY_LABEL}
                      </p>
                    ) : (
                      <AskAssistantMessageBody
                        content={turn.answer}
                        groundingLinks={refsPresentInWire ? [] : undefined}
                        citedReviewIds={citedReviewIds}
                        reviewIdInScope={runId}
                      />
                    )}
                    {refsPresentInWire ? (
                      <AskCitationActionFollowUps chips={citationChips} showHonestEmpty reviewId={runId} />
                    ) : sourcesHonestyLabel.length > 0 ? (
                      <p
                        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid="review-ask-dock-sources-not-stored"
                      >
                        {sourcesHonestyLabel}
                      </p>
                    ) : null}
                  </li>
                  );
                })}
              </ol>
            ) : null}

            {isStreaming ? (
              <div
                className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
                data-testid="review-ask-dock-streaming-answer"
              >
                {streamingContent.trim().length > 0 ? (
                  <>
                    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {REVIEW_ASK_STREAMING_UUID_LINKS_NOTE}
                    </p>
                    <AskAssistantMessageBody content={streamingContent} citedReviewIds={new Set()} />
                  </>
                ) : (
                  <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {REVIEW_ASK_STREAMING_ANSWER_PENDING_LABEL}
                  </p>
                )}
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
                placeholder={DEFAULT_REVIEW_QUESTION_PLACEHOLDER}
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
