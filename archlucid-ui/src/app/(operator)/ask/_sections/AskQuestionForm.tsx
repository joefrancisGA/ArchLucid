import Link from "next/link";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BUYER_ASK_INPUT_PLACEHOLDER } from "@/lib/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
import {
  ASK_BUYER_PROMPT_GROUPS,
  ASK_DEEP_LINK_RUN_PROMPTS,
  ASK_EXAMPLE_PROMPTS,
} from "@/app/(operator)/ask/_sections/ask-page-constants";

export type AskQuestionFormProps = {
  questionRef: RefObject<HTMLTextAreaElement | null>;
  question: string;
  onQuestionChange: (value: string) => void;
  buyerPolishedShell: boolean;
  showRunDeepLinkPrompts: boolean;
  runMissing: boolean;
  onMergePromptLine: (line: string) => void;
  loading: boolean;
  askDisabled: boolean;
  onAsk: () => void;
  /** When true, hides grouped starter chips (shown instead under the latest assistant reply). */
  hideBuyerStarterPromptGroups?: boolean;
};

export function AskQuestionForm(props: AskQuestionFormProps) {
  const {
    questionRef,
    question,
    onQuestionChange,
    buyerPolishedShell,
    showRunDeepLinkPrompts,
    runMissing,
    onMergePromptLine,
    loading,
    askDisabled,
    onAsk,
    hideBuyerStarterPromptGroups = false,
  } = props;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="ask-question">Question</Label>
        <Textarea
          id="ask-question"
          ref={questionRef}
          className="min-h-[5rem] font-sans"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder={buyerPolishedShell ? BUYER_ASK_INPUT_PLACEHOLDER : "Ask about your architecture..."}
          rows={4}
        />
        <div
          className={cn(buyerPolishedShell ? "flex flex-col gap-3" : "flex flex-wrap gap-2")}
          role="group"
          aria-label={buyerPolishedShell ? "Suggested prompts" : "Example prompts"}
        >
          {showRunDeepLinkPrompts ? (
            <div className="space-y-1.5">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Review context</p>
              <div className="flex flex-wrap gap-2">
                {ASK_DEEP_LINK_RUN_PROMPTS.map((line) => (
                  <Button
                    key={`deeplink-${line}`}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={cn("h-auto max-w-full whitespace-normal py-1.5 text-left font-normal", OPERATOR_TYPOGRAPHY.helper)}
                    disabled={runMissing}
                    onClick={() => onMergePromptLine(line)}
                  >
                    {line}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {buyerPolishedShell && !hideBuyerStarterPromptGroups && !showRunDeepLinkPrompts
            ? ASK_BUYER_PROMPT_GROUPS.map((group) => (
                <div key={group.heading} className="space-y-1.5">
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>{group.heading}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.prompts.map((line) => (
                      <Button
                        key={`${group.heading}-${line}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("h-auto max-w-full whitespace-normal py-1.5 text-left font-normal", OPERATOR_TYPOGRAPHY.helper)}
                        disabled={runMissing}
                        onClick={() => onMergePromptLine(line)}
                      >
                        {line}
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            : ASK_EXAMPLE_PROMPTS.map((line) => (
                <Button
                  key={line}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("h-auto max-w-full whitespace-normal py-1.5 text-left font-normal", OPERATOR_TYPOGRAPHY.helper)}
                  disabled={runMissing}
                  onClick={() => onMergePromptLine(line)}
                >
                  {line}
                </Button>
              ))}
        </div>
        {runMissing ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="ask-prompts-sample-callout">
            Load the{" "}
            <Link className={OPERATOR_LINK.nav} href={`/graph?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>
              sample workspace
            </Link>{" "}
            to try these questions.
          </p>
        ) : null}
      </div>

      <Button type="button" variant="primary" className="w-fit" onClick={() => void onAsk()} disabled={askDisabled}>
        {loading ? "Thinking…" : "Ask this review"}
      </Button>
      {runMissing ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="ask-select-review-helper">
          Select a review package first.
        </p>
      ) : null}
    </>
  );
}
