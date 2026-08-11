/**
 * TB-2191 — Ask ≠ frontier-chat differentiation (H7 / D1 residual after TB-2175–2184).
 * SoT for the Ask hub strip and compact finding-inline cue.
 */

import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";

/** Strip title — product language: Ask is evidence-scoped, not a general chat substitute. */
export const ASK_VS_FRONTIER_AI_TITLE = "Ask is not ChatGPT" as const;

/** Optional StatusTag label on the full strip. */
export const ASK_VS_FRONTIER_AI_STATUS_TAG_LABEL = "Evidence-scoped" as const;

export const ASK_VS_FRONTIER_AI_ASK_IS_FOR_HEADING = "Ask is for" as const;

export const ASK_VS_FRONTIER_AI_ASK_IS_FOR_BULLETS = [
  "Plain-language questions about a selected finalized review — findings, evidence, risks, and mitigations.",
  "Answers scoped to that review's signed review record and cited evidence when available.",
  "Quick links into executive summary, evidence trail, and audit anchors on the same package.",
] as const;

export const ASK_VS_FRONTIER_AI_ASK_WILL_NOT_HEADING = "Ask will not" as const;

export const ASK_VS_FRONTIER_AI_ASK_WILL_NOT_BULLETS = [
  "Replace formal governance records, approvals, or the Decision register.",
  "Invent architecture outside the selected review's evidence.",
  "Serve as an unaudited frontier-chat paste that becomes your system of record.",
] as const;

export const ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_HEADING =
  "Why a governed architecture review beats a frontier-chat paste" as const;

export const ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_BULLETS = [
  "Durable architecture review with an evidence trail you can reopen and export.",
  "Repeatable, audit-ready signed review record — not a one-off transcript.",
  "Sponsor-ready packaging and policy citations without reassembling chat history by hand.",
] as const;

/** Compact finding-inline line — complements BUYER_ASK_GROUNDING_ONCE; does not replace it. */
export const ASK_VS_FRONTIER_AI_COMPACT_LINE =
  "Ask is scoped to this review's evidence — not a frontier-chat paste." as const;

export const ASK_VS_FRONTIER_AI_COMPACT_LINK_LABEL = "Why a governed package beats chat" as const;

/** Full differentiation strip lives on the Ask hub. */
export const ASK_VS_FRONTIER_AI_COMPACT_LINK_HREF = ASK_REVIEW_QUESTIONS_PATH;

export type AskVsFrontierAiDifferentiation = {
  readonly title: string;
  readonly statusTagLabel: string;
  readonly askIsForHeading: string;
  readonly askIsForBullets: readonly string[];
  readonly askWillNotHeading: string;
  readonly askWillNotBullets: readonly string[];
  readonly whyPackageBeatsChatHeading: string;
  readonly whyPackageBeatsChatBullets: readonly string[];
  readonly compactLine: string;
  readonly compactLinkLabel: string;
  readonly compactLinkHref: string;
};

/** Readonly structure for the Ask vs frontier-AI differentiation strip. */
export function buildAskVsFrontierAiDifferentiation(): AskVsFrontierAiDifferentiation {
  return {
    title: ASK_VS_FRONTIER_AI_TITLE,
    statusTagLabel: ASK_VS_FRONTIER_AI_STATUS_TAG_LABEL,
    askIsForHeading: ASK_VS_FRONTIER_AI_ASK_IS_FOR_HEADING,
    askIsForBullets: ASK_VS_FRONTIER_AI_ASK_IS_FOR_BULLETS,
    askWillNotHeading: ASK_VS_FRONTIER_AI_ASK_WILL_NOT_HEADING,
    askWillNotBullets: ASK_VS_FRONTIER_AI_ASK_WILL_NOT_BULLETS,
    whyPackageBeatsChatHeading: ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_HEADING,
    whyPackageBeatsChatBullets: ASK_VS_FRONTIER_AI_WHY_PACKAGE_BEATS_CHAT_BULLETS,
    compactLine: ASK_VS_FRONTIER_AI_COMPACT_LINE,
    compactLinkLabel: ASK_VS_FRONTIER_AI_COMPACT_LINK_LABEL,
    compactLinkHref: ASK_VS_FRONTIER_AI_COMPACT_LINK_HREF,
  };
}