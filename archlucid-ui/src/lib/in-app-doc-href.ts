import { inAppHelpHref, PRODUCT_DOCUMENTATION_REGISTRY } from "@/lib/product-documentation-registry";

/**
 * Repo-relative markdown paths that map to in-app help slugs but are not the registry primary `sourcePaths`.
 * Keys are normalized: lowercase, no leading slash, no hash fragment.
 */
const DOC_PATH_TO_SLUG: Readonly<Record<string, string>> = {
  "docs/library/first_run_wizard.md": "getting-started",
  "docs/library/operator-shell.md": "operator-shell",
  "docs/library/comparison_replay.md": "comparison-replay",
  "docs/library/knowledge_graph.md": "knowledge-graph",
  "docs/library/api_contracts.md": "governance-api-contracts",
  "docs/library/alerts.md": "alerts",
  "docs/library/observability.md": "observability",
  "docs/operations/projection_cache_and_replicas.md": "projection-cache-replicas",
  "docs/troubleshooting.md": "developer-troubleshooting",
  "docs/library/live_e2e_jwt_setup.md": "operator-auth-roles",
  "docs/library/glossary.md": "glossary",
  "docs/library/product_learning.md": "pilot-feedback",
  "docs/templates/architecture-requests/readme.md": "specialty-walkthroughs",
  "docs/runbooks/troubleshooting.md": "developer-troubleshooting",
  "docs/runbooks/first_pilot_triage_cards.md": "troubleshooting",
  "docs/runbooks/first_pilot_troubleshooting.md": "troubleshooting",
  "docs/library/customer-facing/operator_troubleshooting.md": "troubleshooting",
  "docs/library/customer-facing/operator_admin_diagnostics.md": "admin-diagnostics",
  "docs/library/operator_quickstart.md": "getting-started",
  "docs/library/security.md": "operator-auth-roles",
  "docs/library/release_smoke.md": "developer-troubleshooting",
  "docs/library/audit_coverage_matrix.md": "audit-trail",
  "docs/library/pre_commit_governance_gate.md": "governance-approval",
  "docs/library/connector_readiness_matrix.md": "troubleshooting",
  "docs/library/v1_scope.md": "getting-started",
  "docs/architecture_on_one_page.md": "getting-started",
  "docs/library/architecture_flows.md": "getting-started",
  "docs/library/live_e2e_happy_path.md": "developer-troubleshooting",
  "docs/library/product_packaging.md": "getting-started",
  "docs/library/finding_engine_output_reference.md": "evidence-trail",
  "docs/go-to-market/competitive_comparison.md": "executive-summary",
  "docs/demo/demo_recording_storyboard.md": "pilot-guide",
  "docs/start_here.md": "path-chooser",
  "docs/core_pilot.md": "core-pilot",
  "docs/runbooks/first_pilot_operator_path.md": "first-pilot-path",
  "docs/runbooks/first_value_20_minutes.md": "first-value-20-minutes",
  "docs/library/governance_workflow_ui.md": "governance-approval",
  "docs/library/customer-facing/workflow_recipes_by_persona.md": "evidence-intake",
  "docs/library/customer-facing/operator_quickstart.md": "getting-started",
  "docs/library/customer-facing/concepts_in_5_minutes.md": "getting-started",
  "docs/library/customer-facing/faq.md": "executive-summary",
  "docs/library/customer-facing/pilot_guide.md": "pilot-guide",
  "docs/library/walkthroughs/readme.md": "specialty-walkthroughs",
  "docs/library/contributor-reference/security.md": "operator-auth-roles",
  "docs/runbooks/common_errors.md": "developer-troubleshooting",
  "docs/go-to-market/trust_center.md": "executive-summary",
  "docs/go-to-market/how_to_request_procurement_pack.md": "executive-summary",
  "docs/runbooks/azure_extractor_ingest.md": "evidence-intake",
  "docs/go-to-market/tenant_isolation.md": "audit-trail",
  "docs/go-to-market/customer_trust_and_access.md": "audit-trail",
  "docs/library/azure_extractor.md": "evidence-intake",
  "docs/library/azure_extractor_technical_backlog.md": "evidence-intake",
  "docs/go-to-market/procurement_faq.md": "executive-summary",
  "docs/deployment/per_tenant_cost_model.md": "executive-summary",
  "docs/library/per_tenant_cost_model.md": "executive-summary",
  "docs/executive_sponsor_brief.md": "executive-summary",
  "docs/go-to-market/executive_sponsor_brief.md": "executive-summary",
  "docs/library/agent_output_evaluation.md": "observability",
  "docs/library/saml_sp_certificate_rotation_runbook.md": "operator-auth-roles",
  "docs/go-to-market/default_policy_packs_v1.md": "governance-approval",
  "docs/go-to-market/quote_to_proof_packet.md": "path-chooser",
  "docs/go-to-market/pricing_philosophy.md": "executive-summary",
  "docs/go-to-market/custom_policy_pack_authoring_sow_template.md": "executive-summary",
  "docs/go-to-market/order_form_template.md": "executive-summary",
  "docs/security/multi_tenant_rls.md": "audit-trail",
  "docs/security/caiq_lite_2026.md": "audit-trail",
  "docs/security/sig_core_2026.md": "audit-trail",
  "docs/security/compliance_matrix.md": "audit-trail",
  "docs/go-to-market/dpa_template.md": "audit-trail",
  "docs/go-to-market/subprocessors.md": "audit-trail",
  "docs/go-to-market/trust_center.md": "audit-trail",
};

function normalizeDocPath(docPath: string): string {
  const withoutHash = docPath.split("#")[0] ?? docPath;

  return withoutHash.replace(/^\//, "").trim().toLowerCase();
}

function slugFromRegistry(normalizedPath: string): string | null {
  for (const entry of PRODUCT_DOCUMENTATION_REGISTRY) {
    for (const sourcePath of entry.sourcePaths) {
      if (normalizeDocPath(sourcePath) === normalizedPath) {
        return entry.slug;
      }
    }
  }

  return null;
}

/**
 * Resolves a repo-relative docs path to an in-app operator help route (`/help` or `/help/{slug}`).
 * Product UI must not link to GitHub blob URLs by default.
 */
export function resolveInAppDocHref(docPath: string): string {
  const hashIndex = docPath.indexOf("#");
  const pathPart = hashIndex >= 0 ? docPath.slice(0, hashIndex) : docPath;
  const fragment = hashIndex >= 0 ? docPath.slice(hashIndex + 1) : "";
  const normalized = normalizeDocPath(pathPart);

  if (normalized.length === 0) {
    return "/help";
  }

  const aliasSlug = DOC_PATH_TO_SLUG[normalized];
  const slug = aliasSlug ?? slugFromRegistry(normalized);

  if (slug === undefined || slug === null || slug.length === 0) {
    return "/help";
  }

  return inAppHelpHref(slug, fragment.length > 0 ? fragment : undefined);
}
