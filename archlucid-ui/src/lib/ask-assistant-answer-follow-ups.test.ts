import { describe, expect, it } from "vitest";

import { ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS } from "@/lib/ask-assistant-answer-follow-ups";

describe("ask-assistant-answer-follow-ups", () => {
  it("exposes three review-scoped follow-up prompts", () => {
    expect(ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS).toHaveLength(3);
    expect(ASK_ASSISTANT_ANSWER_FOLLOW_UP_PROMPTS[0]).toMatch(/top risk/i);
  });
});
