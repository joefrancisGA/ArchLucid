import { describe, expect, it } from "vitest";

import {
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT,
  ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT,
  resolveAskAssistantAnswerFollowUpPrompts,
} from "@/lib/ask-assistant-answer-follow-ups";

describe("ask-assistant-answer-follow-ups", () => {
  it("always offers evidence follow-up", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("A short answer.")).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
    ]);
  });

  it("offers top-risk follow-up only when the answer names a top risk", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("The top risk is exposed storage.")).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_TOP_RISK_PROMPT,
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
    ]);
  });

  it("offers finalize follow-up only when finalize is blocked", () => {
    expect(resolveAskAssistantAnswerFollowUpPrompts("Finalize is blocked until evidence is attached.")).toEqual([
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_EVIDENCE_PROMPT,
      ASK_ASSISTANT_ANSWER_FOLLOW_UP_UNBLOCK_FINALIZE_PROMPT,
    ]);
  });
});
