import { describe, expect, it } from "vitest";

import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import {
  ARCHITECTURE_FRAMING_INCOMPLETE_GUIDANCE_MESSAGE,
  ARCHITECTURE_FRAMING_INCOMPLETE_PUBLISH_BLOCK_REASON,
  buildFramingAnswersPayload,
  collectOpenFramingInterviewQuestions,
  framingInterviewAnswersComplete,
  isFramingIncompletePublishBlock,
  mergeFramingAnswerDefaults,
  resolvePublishBlockedAlertMessage,
} from "@/lib/architecture/architecture-intelligence-framing-interview";

function sampleResult(overrides: Partial<ClosedLoopReasoningResult> = {}): ClosedLoopReasoningResult {
  return {
    publishBlocked: true,
    publishBlockReasons: [ARCHITECTURE_FRAMING_INCOMPLETE_PUBLISH_BLOCK_REASON],
    interview: {
      framingQuestions: [
        {
          questionId: "system-boundary",
          prompt: "What is inside and outside the system boundary?",
          isAnswered: false,
        },
      ],
      evidenceDrivenQuestions: [],
    },
    ...overrides,
  };
}

describe("architecture-intelligence-framing-interview", () => {
  it("detects the framing publish block reason", () => {
    expect(isFramingIncompletePublishBlock(sampleResult())).toBe(true);
    expect(isFramingIncompletePublishBlock({ publishBlockReasons: ["Other gate"] })).toBe(false);
  });

  it("uses operator guidance when framing questions remain open", () => {
    expect(resolvePublishBlockedAlertMessage(sampleResult())).toBe(
      ARCHITECTURE_FRAMING_INCOMPLETE_GUIDANCE_MESSAGE,
    );
    expect(
      resolvePublishBlockedAlertMessage({
        publishBlocked: true,
        publishBlockReasons: ["Trust gate rejected output."],
      }),
    ).toBe("Publish blocked: Trust gate rejected output.");
  });

  it("collects unanswered framing and evidence-driven questions", () => {
    expect(collectOpenFramingInterviewQuestions(sampleResult())).toEqual([
      {
        questionId: "system-boundary",
        prompt: "What is inside and outside the system boundary?",
        isAnswered: false,
      },
    ]);
  });

  it("merges confirmed answers into local framing answer state", () => {
    expect(
      mergeFramingAnswerDefaults(
        [
          {
            questionId: "business-outcome",
            prompt: "Outcome?",
            confirmedAnswer: "Faster claims",
          },
        ],
        {},
      ),
    ).toEqual({
      "business-outcome": "Faster claims",
    });
  });

  it("requires every open framing question before resubmit", () => {
    const questions = [
      {
        questionId: "business-outcome",
        prompt: "Outcome?",
      },
      {
        questionId: "system-boundary",
        prompt: "Boundary?",
      },
    ];

    expect(
      framingInterviewAnswersComplete(questions, {
        "business-outcome": "Faster claims",
      }),
    ).toBe(false);

    expect(
      framingInterviewAnswersComplete(questions, {
        "business-outcome": "Faster claims",
        "system-boundary": "API + DB in scope",
      }),
    ).toBe(true);
  });

  it("builds a trimmed framing answer payload", () => {
    expect(
      buildFramingAnswersPayload(
        [{ questionId: "architecture-kind", prompt: "Kind?" }],
        { "architecture-kind": "  migration  " },
      ),
    ).toEqual({
      "architecture-kind": "migration",
    });
  });
});
