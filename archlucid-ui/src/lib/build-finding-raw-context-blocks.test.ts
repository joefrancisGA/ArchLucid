import { describe, expect, it } from "vitest";

import { buildFindingRawContextBlocks } from "@/lib/build-finding-raw-context-blocks";
import type { FindingProvenance } from "@/lib/api/finding-provenance";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import type { FindingLlmAudit } from "@/types/explanation";

const inspectPayload = (overrides: Partial<FindingInspectPayload> = {}): FindingInspectPayload => ({
  findingId: "f-1",
  typedPayload: null,
  decisionRuleId: null,
  decisionRuleName: null,
  evidence: [],
  recommendedActions: [],
  auditRowId: null,
  runId: "run-1",
  manifestVersion: null,
  ...overrides,
});

describe("buildFindingRawContextBlocks", () => {
  it("includes cited evidence excerpts from inspect payload", () => {
    const blocks = buildFindingRawContextBlocks(
      inspectPayload({
        evidence: [
          {
            artifactId: "artifact-a",
            lineRange: "10-20",
            excerpt: "Patient demographics transmitted without encryption.",
          },
        ],
      }),
      null,
      null,
    );

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.kind).toBe("cited-evidence");
    expect(blocks[0]?.body).toContain("Patient demographics");
    expect(blocks[0]?.meta).toContain("artifact-a");
  });

  it("includes provenance input and evidence steps", () => {
    const provenance: FindingProvenance = {
      findingId: "f-1",
      steps: [
        { kind: "input", label: "Architecture brief", detail: "847-word intake brief." },
        { kind: "evidence", label: "Data flow", detail: "PHI field detected in payload." },
        { kind: "policy-check", label: "HIPAA rule", detail: "Should not appear in raw context." },
        { kind: "conclusion", label: "Finding raised", detail: "Also excluded." },
      ],
    };

    const blocks = buildFindingRawContextBlocks(null, provenance, null);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]?.kind).toBe("provenance-input");
    expect(blocks[1]?.kind).toBe("provenance-evidence");
  });

  it("appends redacted LLM user prompt when audit is available", () => {
    const audit: FindingLlmAudit = {
      traceId: "trace-1",
      agentType: "Compliance",
      systemPromptRedacted: "",
      userPromptRedacted: "Evaluate policy pack against graph snapshot …",
      rawResponseRedacted: "",
      modelDeploymentName: "gpt-4o",
      redactionCountsByCategory: {},
    };

    const blocks = buildFindingRawContextBlocks(null, null, audit);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.kind).toBe("llm-user-prompt");
    expect(blocks[0]?.meta).toContain("trace-1");
  });

  it("returns empty array when no context sources are present", () => {
    expect(buildFindingRawContextBlocks(inspectPayload(), null, null)).toEqual([]);
  });
});
