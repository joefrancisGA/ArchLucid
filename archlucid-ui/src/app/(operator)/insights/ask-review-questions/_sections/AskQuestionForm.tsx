import { cn } from "@/lib/utils";
import Link from "next/link";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";
import {
  BUYER_ASK_CARD_TITLE,
  BUYER_ASK_INPUT_PLACEHOLDER,
  BUYER_ASK_SUGGESTED_QUESTIONS_HEADING,
  BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  ASK_BUYER_PROMPT_GROUPS,
  ASK_DEEP_LINK_RUN_PROMPTS,
  ASK_EXAMPLE_PROMPTS,
} from "@/app/(operator)/insights/ask-review-questions/_sections/ask-page-constants";

export type AskQuestionFormProps = {
  questionRef: RefObject<HTMLTextAreaElement | null>;
  question: string;
  onQuestionChange: (value: string) => void;
  buyerPolishedShell: boolean;
  showRunDeepLinkPrompts: boolean;
  runAnchorUnset: boolean;
  onMergePromptLine: (line: string) => void;
  loading: boolean;
  askDisabled: boolean;
  onAsk: () => void;
  /** Tier B staged wait — pre-stream hold only (not while SSE tokens arrive). */
  showLongWait?: boolean;
  /** When true, hides grouped starter chips (shown instead under the latest assistant reply). */
  hideBuyerStarterPromptGroups?: boolean;
};

function SuggestedQuestionChips(props: {
  buyerPolishedShell: boolean;
  showRunDeepLinkPrompts: boolean;
  hideBuyerStarterPromptGroups: boolean;
  runAnchorUnset: boolean;
  onMergePromptLine: (line: string) => void;
}) {
  const showBuyerGroups =
    props.buyerPolishedShell && !props.hideBuyerStarterPromptGroups && !props.showRunDeepLinkPrompts;

  if (!showBuyerGroups && !props.showRunDeepLinkPrompts && !props.buyerPolishedShell) {
    return (
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example prompts">
        {ASK_EXAMPLE_PROMPTS.map((line) => (
          <Button
            key={line}
            type="button"
            variant="outline"
            size="sm"
            className="h-auto max-w-full whitespace-normal border-neutral-200/80 py-1 text-left dark:border-neutral-700"
            disabled={false}
            onClick={() => props.onMergePromptLine(line)}
          >
            {line}
          </Button>
        ))}
      </div>
    );
  }

  if (!showBuyerGroups && !props.showRunDeepLinkPrompts) {
    return null;
  }

  const groups = props.showRunDeepLinkPrompts
    ? [{ heading: "Review context", prompts: ASK_DEEP_LINK_RUN_PROMPTS }]
    : ASK_BUYER_PROMPT_GROUPS;

  return (
    <div className="space-y-2" data-testid="ask-suggested-questions">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {props.buyerPolishedShell ? BUYER_ASK_SUGGESTED_QUESTIONS_HEADING : "Example prompts"}
      </p>
      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.heading} className="space-y-1">
            {props.buyerPolishedShell ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>{group.heading}</p>
            ) : null}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={group.heading}>
              {group.prompts.map((line) => (
                <Button
                  key={`${group.heading}-${line}`}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto max-w-full whitespace-normal border-neutral-200/80 py-1 text-left dark:border-neutral-700"
                  disabled={false}
                  onClick={() => props.onMergePromptLine(line)}
                >
                  {line}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AskQuestionForm(props: AskQuestionFormProps) {
  const {
    questionRef,
    question,
    onQuestionChange,
    buyerPolishedShell,
    showRunDeepLinkPrompts,
    runAnchorUnset,
    onMergePromptLine,
    loading,
    askDisabled,
    onAsk,
    showLongWait = false,
    hideBuyerStarterPromptGroups = false,
  } = props;

  return (
    <section className="space-y-3" aria-labelledby="ask-question-card-title">
      <h3 id="ask-question-card-title" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell ? BUYER_ASK_CARD_TITLE : "Question"}
      </h3>
      <div className="space-y-2">
        <Label htmlFor="ask-question">{buyerPolishedShell ? "Your question" : "Question"}</Label>
        <Textarea
          id="ask-question"
          ref={questionRef}
          className="min-h-[5rem] font-sans"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder={buyerPolishedShell ? BUYER_ASK_INPUT_PLACEHOLDER : "Ask about your architecture..."}
          rows={4}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" className="w-fit" onClick={() => void onAsk()} disabled={askDisabled}>
          {loading ? "Thinking…" : "Ask"}
        </Button>
        {runAnchorUnset ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="ask-workspace-scope-helper">
            Searching all reviews in this workspace. Pick a review above to narrow scope.
          </p>
        ) : null}
      </div>

      <LongOperationWaitNotice
        active={showLongWait}
        operationLabel="Answering your question"
        stageLabel="Retrieving evidence and composing an answer"
        testId="ask-long-wait"
      />

      <SuggestedQuestionChips
        buyerPolishedShell={buyerPolishedShell}
        showRunDeepLinkPrompts={showRunDeepLinkPrompts}
        hideBuyerStarterPromptGroups={hideBuyerStarterPromptGroups}
        runAnchorUnset={runAnchorUnset}
        onMergePromptLine={onMergePromptLine}
      />

      {runAnchorUnset && buyerPolishedShell ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="ask-prompts-sample-callout">
          Open the{" "}
          <Link className={OPERATOR_LINK.nav} href={`/insights/evidence-graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>
            {BUYER_EVIDENCE_GRAPH_SAMPLE_LINK_LABEL}
          </Link>{" "}
          (not your tenant workspace) to try these questions.
        </p>
      ) : null}
    </section>
  );
}
