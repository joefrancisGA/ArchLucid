import { DEFAULT_GITHUB_BLOB_BASE } from "./docs-public-base";

export type ContextualHelpEntry = {
  text: string;
  learnMoreUrl?: string;
};

/**
 * In-app help copy for the core pilot flow. `learnMoreUrl` values are app-relative; see
 * {@link toDocsBlobUrl} when linking to the repo default branch on the web.
 */
export const contextualHelpByKey: Record<string, ContextualHelpEntry> = {
  "new-run-wizard": {
    text: "Create an architecture request for what ArchLucid should analyze. Reference starters, Quick shapes, and industry templates pre-fill the form — edit anything before submit.",
    learnMoreUrl: "/docs/CORE_PILOT.md#new-run",
  },
  "runs-list-overview": {
    text: "Each row is one architecture review. Open a row to inspect the manifest, findings, pipeline timeline, and exports for that review.",
    learnMoreUrl: "/docs/CORE_PILOT.md",
  },
  "run-pipeline-status": {
    text: "The pipeline shows each AI agent's progress. When all steps complete, the run is ready to finalize. Elapsed labels (when shown) are wall time since the prior event — useful for sponsor readouts.",
    learnMoreUrl: "/docs/CORE_PILOT.md#pipeline-status",
  },
  "commit-manifest": {
    text: "Finalizing produces a versioned, reviewed manifest and synthesizes artifacts. This is the primary pilot deliverable.",
    learnMoreUrl: "/docs/CORE_PILOT.md#commit",
  },
  "manifest-review": {
    text: "Review the manifest's decisions, findings, and structured metadata. Download artifacts for offline review.",
    learnMoreUrl: "/docs/CORE_PILOT.md#manifest-review",
  },
  "governance-gate": {
    text: "When enabled, the governance gate checks findings against severity thresholds before allowing finalization.",
    learnMoreUrl: "/docs/CORE_PILOT.md#governance-gate",
  },
  "alerts-inbox": {
    text: "Alerts inbox shows deduplicated architecture-risk alerts. Acknowledge or resolve items tied to findings in this workspace.",
    learnMoreUrl: "/docs/ALERTS.md",
  },
  "compare-runs": {
    text: "Compare diffs two finalized manifests. Enter base and target review IDs from the Reviews list.",
    learnMoreUrl: "/docs/COMPARISON_REPLAY.md",
  },
  "governance-dashboard": {
    text:
      "Executive Workspace Health summarizes pre-commit outcomes, severity exposure, compliance drift, approval SLAs, and a hours-first value proxy for the active tenant/workspace/project scope.",
    learnMoreUrl: "/docs/CORE_PILOT.md#governance-gate",
  },
  "governance-workflow": {
    text:
      "Submit governed changes for approval, promote manifest versions, and activate environments. Execute role required for mutations; readers can review pending items.",
    learnMoreUrl: "/docs/library/GOVERNANCE.md",
  },
  "replay-run": {
    text: "Replay re-validates a stored comparison. Verify mode detects drift since the original comparison.",
    learnMoreUrl: "/docs/COMPARISON_REPLAY.md",
  },
  "architecture-graph": {
    text: "Review trail graph shows provenance or an architecture-oriented view for one review. Pick a review and mode, then load or refresh.",
    learnMoreUrl: "/docs/KNOWLEDGE_GRAPH.md",
  },
  "audit-log": {
    text: "Append-only audit trail with filters. See who approved what, when, and why.",
    learnMoreUrl: "/docs/AUDIT_COVERAGE_MATRIX.md",
  },
  "policy-packs": {
    text: "Policy packs bundle rules and scope defaults. Assign them to workspaces to enforce governance.",
    learnMoreUrl: "/docs/API_CONTRACTS.md",
  },
  "advisory-hub": {
    text: "Advisory scans evaluate your architecture against configurable advisory rules.",
    learnMoreUrl: "/docs/operator-shell.md",
  },
  "semantic-search": {
    text: "Scoped to your workspace. Uses the same embedding index as Ask ArchLucid.",
    learnMoreUrl: "/docs/operator-shell.md",
  },
  "ask-archlucid": {
    text: "Multi-turn conversations about an architecture review. Golden path in this workspace: New review → Reviews table → Manifest → Key finding → Ask → Governance handoff.",
    learnMoreUrl: "/docs/operator-shell.md",
  },
  "operator-scope-switcher": {
    text: "Scope headers (tenant / workspace / project) slice API data. Pick a project when the workspace list exists; otherwise dev defaults or registration scope apply.",
    learnMoreUrl: "/docs/library/GLOSSARY.md#scope-tenant--workspace--project",
  },
  "tenant-settings-page": {
    text: "Operator-facing tenant preferences: trial status, executive digest email schedule, and the active request scope. Sensitive infrastructure settings remain server-only.",
    learnMoreUrl: "/docs/library/API_CONTRACTS.md",
  },
  "admin-users-page": {
    text: "Principals in this tenant and their effective authority rank. The API is authoritative; role changes need the admin user management endpoints to be available on your environment.",
    learnMoreUrl: "/docs/library/API_CONTRACTS.md",
  },
  "system-health": {
    text: "System health shows API readiness checks, circuit breaker state, and onboarding milestone rates. For full metrics, connect Prometheus or Application Insights — see docs/library/OBSERVABILITY.md.",
    learnMoreUrl: "/docs/library/OBSERVABILITY.md",
  },
};

/**
 * Resolves a relative in-repo docs path (e.g. `/docs/CORE_PILOT.md#h`) to a `blob` URL for “Learn more”.
 * Override with <code>NEXT_PUBLIC_ARCHLUCID_DOCS_BLOB_BASE</code> when the default branch or fork differs;
 * when unset, uses the same public ArchLucid GitHub `main` blob base as `getDocHref` in `help-topics`.
 */
export function toDocsBlobUrl(learnMoreUrl: string): string {
  const custom = process.env.NEXT_PUBLIC_ARCHLUCID_DOCS_BLOB_BASE?.trim();

  if (custom && custom.length > 0) {
    return `${custom.replace(/\/$/, "")}/${learnMoreUrl.replace(/^\//, "")}`;
  }

  const withoutLeading = learnMoreUrl.replace(/^\//, "");
  return `${DEFAULT_GITHUB_BLOB_BASE.replace(/\/$/, "")}/${withoutLeading}`;
}
