import { describe, expect, it } from "vitest";

import {
  ASK_VS_FRONTIER_AI_ASK_IS_FOR_BULLETS,
  ASK_VS_FRONTIER_AI_ASK_WILL_NOT_BULLETS,
  ASK_VS_FRONTIER_AI_COMPACT_LINE,
  ASK_VS_FRONTIER_AI_COMPACT_LINK_HREF,
  ASK_VS_FRONTIER_AI_COMPACT_LINK_LABEL,
  ASK_VS_FRONTIER_AI_TITLE,
  ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_BULLETS,
  buildAskVsFrontierAiDifferentiation,
} from "@/lib/ask-vs-frontier-ai-differentiation";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { BUYER_ASK_GROUNDING_ONCE } from "@/lib/buyer-polish-copy";

describe("ask-vs-frontier-ai-differentiation (TB-2191)", () => {
  it("exports a non-empty title and three differentiation columns", () => {
    expect(ASK_VS_FRONTIER_AI_TITLE.toLowerCase()).toContain("chatgpt");
    expect(ASK_VS_FRONTIER_AI_ASK_IS_FOR_BULLETS.length).toBeGreaterThanOrEqual(2);
    expect(ASK_VS_FRONTIER_AI_ASK_WILL_NOT_BULLETS.length).toBeGreaterThanOrEqual(2);
    expect(ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_BULLETS.length).toBeGreaterThanOrEqual(2);
  });

  it("buildAskVsFrontierAiDifferentiation returns a readonly structure aligned with constants", () => {
    const built = buildAskVsFrontierAiDifferentiation();

    expect(built.title).toBe(ASK_VS_FRONTIER_AI_TITLE);
    expect(built.askIsForBullets).toEqual([...ASK_VS_FRONTIER_AI_ASK_IS_FOR_BULLETS]);
    expect(built.askWillNotBullets).toEqual([...ASK_VS_FRONTIER_AI_ASK_WILL_NOT_BULLETS]);
    expect(built.whyPackageBeatsChatBullets).toEqual([...ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_BULLETS]);
    expect(built.compactLine).toBe(ASK_VS_FRONTIER_AI_COMPACT_LINE);
    expect(built.compactLinkLabel).toBe(ASK_VS_FRONTIER_AI_COMPACT_LINK_LABEL);
    expect(built.compactLinkHref).toBe(ASK_REVIEW_QUESTIONS_PATH);
    expect(ASK_VS_FRONTIER_AI_COMPACT_LINK_HREF).toBe(ASK_REVIEW_QUESTIONS_PATH);
  });

  it("keeps compact copy distinct from BUYER_ASK_GROUNDING_ONCE", () => {
    expect(ASK_VS_FRONTIER_AI_COMPACT_LINE).not.toBe(BUYER_ASK_GROUNDING_ONCE);
    expect(ASK_VS_FRONTIER_AI_COMPACT_LINE.toLowerCase()).toContain("frontier-chat");
    expect(BUYER_ASK_GROUNDING_ONCE.toLowerCase()).toContain("scoped");
  });

  it("uses package / evidence / governance vocabulary (not run or job)", () => {
    const corpus = [
      ASK_VS_FRONTIER_AI_TITLE,
      ...ASK_VS_FRONTIER_AI_ASK_IS_FOR_BULLETS,
      ...ASK_VS_FRONTIER_AI_ASK_WILL_NOT_BULLETS,
      ...ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_BULLETS,
      ASK_VS_FRONTIER_AI_COMPACT_LINE,
    ]
      .join("\n")
      .toLowerCase();

    expect(corpus).toContain("architecture review");
    expect(corpus).toContain("evidence");
    expect(corpus).toContain("signed review record");
    expect(corpus).not.toMatch(/\bjob\b/);
    expect(corpus).not.toMatch(/\brun\b/);
  });
});