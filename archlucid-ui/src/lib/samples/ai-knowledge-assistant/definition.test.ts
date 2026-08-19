import { describe, expect, it } from "vitest";

import {
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION,
  AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID,
  AI_KNOWLEDGE_ASSISTANT_SECONDARY_BUYER_SENTENCE,
} from "@/lib/samples/ai-knowledge-assistant/definition";
import { buildAiKnowledgeAssistantShowcaseStaticPayload } from "@/lib/samples/ai-knowledge-assistant/static-showcase-payload";

const FORBIDDEN_PRIMARY_MARKETING_ORGS = ["contoso", "northwind"] as const;

describe("ai-knowledge-assistant sample package (TB-982)", () => {
  it("pins the secondary buyer sentence for the created AI showcase", () => {
    expect(AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.primaryBuyerSentence).toBe(
      AI_KNOWLEDGE_ASSISTANT_SECONDARY_BUYER_SENTENCE,
    );
    expect(AI_KNOWLEDGE_ASSISTANT_SECONDARY_BUYER_SENTENCE).toContain("Enterprise AI Knowledge Assistant");
  });

  it("does not include Contoso or Northwind in primary marketing strings", () => {
    const haystack = [
      AI_KNOWLEDGE_ASSISTANT_SECONDARY_BUYER_SENTENCE,
      AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.buyerReviewPackageTitle,
      AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.buyerReviewTitle,
      AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.tenantName,
    ]
      .join("\n")
      .toLowerCase();

    for (const forbidden of FORBIDDEN_PRIMARY_MARKETING_ORGS) {
      expect(haystack).not.toContain(forbidden);
    }
  });

  it("serves the created static showcase payload at the pinned run slug", () => {
    const payload = buildAiKnowledgeAssistantShowcaseStaticPayload(AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID);

    expect(payload.run.runId).toBe(AI_KNOWLEDGE_ASSISTANT_SAMPLE_RUN_ID);
    expect(payload.manifest.manifestId).toBe(AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.manifestId);
    expect(payload.runExplanation?.findingCount).toBe(
      AI_KNOWLEDGE_ASSISTANT_SAMPLE_DEFINITION.spineCounts.findingCount,
    );
  });
});
