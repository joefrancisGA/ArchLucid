import type { RunDetail } from "@/types/authority";

import {
  OPERATOR_DEMO_REVIEW_ARCHITECTURE_DESCRIPTION_PREFIX,
  OPERATOR_DEMO_REVIEW_ONE_CLICK_CONSTRAINT_MARKER,
  OPERATOR_DEMO_REVIEW_POLICY_PACK_DISPLAY_NAME,
} from "@/lib/operator/operator-demo-review";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";

import { FIXTURE_MANIFEST_ID, FIXTURE_PROJECT_ID } from "./ids";

export const OPERATOR_DEMO_REVIEW_RUN_ID = "operator-demo-review-e2e";

/** Loopback mock ArchLucid API base used by `e2e/start-e2e-with-mock.ts` (default port 18765). */
export function mockArchlucidApiBaseUrl(): string {
  const port = process.env.E2E_MOCK_API_PORT ?? "18765";

  return `http://127.0.0.1:${port}`;
}

function operatorDemoFinding(
  findingId: string,
  message: string,
  severity: "Critical" | "Error" | "Info" | "Warning",
  policyRuleId: string,
): NonNullable<NonNullable<RunDetail["results"]>[number]["findings"]>[number] {
  return {
    findingId,
    message,
    category: "Security",
    severity,
    policyRuleId,
    reasoningTrace: `Remediate ${message.toLowerCase()} to satisfy ${policyRuleId}.`,
  };
}

/** Mock run detail for operator one-click demo review E2E — three policy-linked findings minimum. */
export function fixtureOperatorDemoReviewRunDetail(
  runId: string = OPERATOR_DEMO_REVIEW_RUN_ID,
): RunDetail {
  return {
    executionFlavorBuyerSummary:
      "Policy-aware demo review with curated pack rules and traceable evidence for buyer rooms.",
    run: {
      runId,
      projectId: FIXTURE_PROJECT_ID,
      description: `${OPERATOR_DEMO_REVIEW_ARCHITECTURE_DESCRIPTION_PREFIX} ${OPERATOR_DEMO_REVIEW_ONE_CLICK_CONSTRAINT_MARKER}`,
      createdUtc: "2026-06-23T04:00:00.000Z",
      completedUtc: "2026-06-23T04:01:00.000Z",
      goldenManifestId: FIXTURE_MANIFEST_ID,
      hasGoldenManifest: true,
      structuralExecutionMode: StructuralExecutionModeWire.Simulator,
    },
    contextSnapshot: { fixture: true },
    graphSnapshot: { fixture: true },
    findingsSnapshot: { fixture: true },
    decisionTrace: { fixture: true },
    goldenManifest: { fixture: true },
    artifactBundle: { fixture: true },
    results: [
      {
        resultId: `${runId}-policy-demo`,
        taskId: `${runId}-compliance`,
        runId,
        agentType: "Compliance",
        claims: [],
        evidenceRefs: [],
        findings: [
          operatorDemoFinding("demo-finding-1", "Public SQL endpoint without private link", "Critical", "sec-base-001"),
          operatorDemoFinding("demo-finding-2", "Storage account allows anonymous blob read", "Critical", "sec-base-010"),
          operatorDemoFinding("demo-finding-3", "Application secrets stored in plain settings", "Error", "sec-base-020"),
        ],
        confidence: 0.9,
      },
    ],
  };
}

export function operatorDemoReviewApiResponse(runId: string = OPERATOR_DEMO_REVIEW_RUN_ID): Record<string, unknown> {
  return {
    runId,
    manifestId: FIXTURE_MANIFEST_ID,
    policyPackName: OPERATOR_DEMO_REVIEW_POLICY_PACK_DISPLAY_NAME,
    runDetailUrl: `/architecture/reviews/${encodeURIComponent(runId)}`,
    topFindings: [
      {
        title: "Public SQL endpoint without private link",
        severity: "Critical",
        policyRuleKey: "sec-base-001",
      },
      {
        title: "Storage account allows anonymous blob read",
        severity: "Critical",
        policyRuleKey: "sec-base-010",
      },
      {
        title: "Application secrets stored in plain settings",
        severity: "Error",
        policyRuleKey: "sec-base-020",
      },
    ],
  };
}
