/**
 * Maps first-pilot proof finding names to remediation doc paths and in-app routes.
 * Keep aligned with scripts/FirstPilotSupportNextStep.ps1.
 */
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

export type FirstPilotProofRemediation = {
  readonly docPath: string;
  readonly inAppHref: string | null;
};

const DOC_LINKS: Readonly<Record<string, string>> = {
  "committed-run-evidence": "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-c--review-lifecycle",
  "pilot-preflight": "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-a--platform-ready",
  "pilot-preflight-exit": "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md#phase-a--platform-ready",
  "pilot-preflight-json": "docs/library/CLI_USAGE.md",
  "data-consistency-readiness": "docs/runbooks/DATA_CONSISTENCY_READINESS.md",
  "real-llm-sponsor-evidence": "docs/library/AGENT_OUTPUT_EVALUATION.md",
  "ai-quality-proof": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#ai-quality-proof",
  "ai-readiness-gate": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#consolidated-ai-readiness-gate",
  "roi-basis-labels": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#minimum-viable-roi-baseline-before-sponsor-readout",
  "procurement-deal-ready": "docs/runbooks/PROCUREMENT_DEAL_READY.md",
  "route-tier-policy-nav-parity": "docs/library/ROUTE_TIER_POLICY_NAV_DRIFT_GATE.md",
  "production-like-config-lint": "docs/library/CONFIGURATION_REFERENCE.md",
  "demo-workspace-validation": "docs/go-to-market/DEMO_WORKSPACES.md",
  "telemetry-export-readiness": "docs/runbooks/OBSERVABILITY_EXPORT_READINESS.md",
  "retrieval-ir-evidence": "docs/quality/retrieval-ir-report.md",
  "environment-reliability-rollup": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
  "committed-review-trace-chain-summary": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
  "scale-envelope-evidence": "docs/library/PERFORMANCE.md",
  "first-pilot-timing-budget": "docs/runbooks/FIRST_CREDIBLE_REVIEW_ONE_SITTING.md",
  "compliance-posture-clarity": "docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md",
  "v1-integration-correctness-drill": "docs/runbooks/V1_INTEGRATION_CORRECTNESS_DRILL.md",
  "mutating-route-audit-matrix": "docs/library/AUDIT_MATRIX.md",
};

const DEFAULT_DOC = "docs/runbooks/FIRST_PILOT_TRIAGE_CARDS.md";

function reviewDetailHref(runId: string | null | undefined): string | null {
  if (runId === null || runId === undefined || runId.trim() === "") {
    return "/reviews";
  }

  return `/reviews/${encodeURIComponent(runId.trim())}`;
}

function inAppHrefForFinding(name: string, runId: string | null | undefined): string | null {
  if (name.startsWith("pilot-preflight")) {
    return "/health";
  }

  switch (name) {
    case "data-consistency-readiness":
    case "environment-reliability-rollup":
    case "telemetry-export-readiness":
      return "/health";
    case "committed-run-evidence":
    case "real-llm-sponsor-evidence":
    case "ai-quality-proof":
    case "ai-readiness-gate":
    case "committed-review-trace-chain-summary":
      return reviewDetailHref(runId);
    case "roi-basis-labels":
      return "/scorecard#roi-baselines";
    case "demo-workspace-validation":
      return "/see-it";
    case "procurement-deal-ready":
    case "route-tier-policy-nav-parity":
    case "scale-envelope-evidence":
    case "first-pilot-timing-budget":
    case "compliance-posture-clarity":
    case "v1-integration-correctness-drill":
    case "mutating-route-audit-matrix":
    case "retrieval-ir-evidence":
      return null;
    default:
      return null;
  }
}

export function resolveFirstPilotProofRemediation(
  findingName: string,
  runId?: string | null,
): FirstPilotProofRemediation {
  const docPath = DOC_LINKS[findingName] ?? DEFAULT_DOC;

  return {
    docPath,
    inAppHref: inAppHrefForFinding(findingName, runId),
  };
}

export function buildDocsBlobHref(docPath: string, _githubBlobBase?: string): string {
  return resolveInAppDocHref(docPath);
}
