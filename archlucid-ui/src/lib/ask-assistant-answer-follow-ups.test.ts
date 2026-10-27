import { describe, expect, it } from "vitest";

import {
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_CITATIONS_OMITTED_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNCITED_PROMPT,
  resolveAskAssistantAnswerFollowUpPrompts,
} from "@/lib/ask-assistant-answer-follow-ups";

describe("ask-assistant-answer-follow-ups", () => {
  it("returns no follow-ups when the assistant answer was omitted (P-18)", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("   ")).toEqual([]);
  });

  it("offers evidence follow-up when citations were stored", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("A short answer.", { hasCitations: true })).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
    ]);
  });

  it("offers uncited honesty chip when the answer has no citations (P-18)", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("A short answer.", { hasCitations: false })).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNCITED_PROMPT,
    ]);
  });

  it("uses omitted-metadata chip when citation refs were not stored (P-19)", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("No top risk was stored for this review.")).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_CITATIONS_OMITTED_PROMPT,
    ]);
    expect(
      resolveAskAssistantAnswerFollowUpPrompts("No top risk was stored for this review."),
    ).not.toContain(ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT);
  });

  it("offers top-risk follow-up only when the answer names a top risk", () => {
    expect(
      resolveAskAssistantAnswerFollowUpPrompts("The top risk is exposed storage.", { hasCitations: true }),
    ).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT,
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
    ]);
  });

  it("offers finalize follow-up only when finalize is blocked", () => {
    expect(
      resolveAskAssistantAnswerFollowUpPrompts("Finalize is blocked until evidence is attached.", {
        hasCitations: true,
      }),
    ).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT,
    ]);
  });
});
