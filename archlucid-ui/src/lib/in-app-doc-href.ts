import { inAppHelpHref, PRODUCT_DOCUMENTATION_REGISTRY } from "@/lib/product-documentation-registry";

/**
 * Repo-relative markdown paths that resolve to absolute app routes (not only `/help/{slug}`).
 * Keys are normalized: lowercase, no leading slash, no hash fragment.
 * Values may include a default `#fragment`.
 */
const DOC_PATH_TO_ABSOLUTE_HREF: Readonly<Record<string, string>> = {
  /** Customer-facing FAQ.md is a path-stable stub; buyer Q&A lives on marketing `/faq`. */
  "docs/library/customer-facing/faq.md": "/faq",
  /** Pilot ROI measurement folded into executive-summary (PI retired 2026-08-11). */
  "docs/go-to-market/roi_model.md": "/help/executive-summary#pilot-roi-measurement",
  "docs/library/buyer_scalability_faq.md": "/help/security-trust#scalability-and-load-evidence",
  "docs/library/pilot_roi_model.md": "/help/executive-summary#pilot-roi-measurement",
  "docs/deployment/per_tenant_cost_model.md": "/help/executive-summary#pilot-roi-measurement",
  "docs/library/per_tenant_cost_model.md": "/help/executive-summary#pilot-roi-measurement",
  "docs/runbooks/first_value_20_minutes.md": "/help/first-architecture-review#first-value-in-20-minutes",
  /** Shared with the printable checklist entry; prefer the 20-minute anchor for this source path. */
  "docs/runbooks/first_pilot_operator_path.md": "/help/first-architecture-review#first-value-in-20-minutes",
  /** Finding provenance folded into Findings help (2026-08-04). */
  "docs/library/customer-facing/finding_provenance.md": "/help/findings#where-findings-come-from",
};

/**
 * Repo-relative markdown paths that map to in-app help slugs but are not the registry primary `sourcePaths`.
 * Keys are normalized: lowercase, no leading slash, no hash fragment.
 */
const DOC_PATH_TO_SLUG: Readonly<Record<string, string>> = {
  "docs/library/first_run_wizard.md": "getting-started",
  "docs/library/operator-shell.md": "pilot-guide",
  "docs/library/comparison_replay.md": "comparison-replay",
  "docs/library/customer-facing/comparison_replay_operator_guide.md": "comparison-replay",
  "docs/library/knowledge_graph.md": "evidence-trail",
  "docs/library/api_contracts.md": "api-contracts",
  "docs/library/alerts.md": "alerts",
  "docs/library/observability.md": "admin-diagnostics",
  "docs/troubleshooting.md": "developer-troubleshooting",
  "docs/library/live_e2e_jwt_setup.md": "configuration-reference",
  "docs/library/glossary.md": "glossary",
  "docs/library/customer-facing/customer_glossary.md": "glossary",
  "docs/library/product_learning.md": "pilot-feedback",
  "docs/templates/architecture-requests/readme.md": "specialty-walkthroughs",
  "docs/runbooks/troubleshooting.md": "developer-troubleshooting",
  "docs/runbooks/first_pilot_triage_cards.md": "troubleshooting",
  "docs/runbooks/first_pilot_troubleshooting.md": "troubleshooting",
  "docs/library/customer-facing/operator_troubleshooting.md": "troubleshooting",
  "docs/library/customer-facing/operator_admin_diagnostics.md": "admin-diagnostics",
  "docs/library/operator_quickstart.md": "cli-usage",
  "docs/library/release_smoke.md": "developer-troubleshooting",
  "docs/library/audit_coverage_matrix.md": "audit-trail",
  "docs/library/pre_commit_governance_gate.md": "governance-approval",
  "docs/library/connector_readiness_matrix.md": "troubleshooting",
  "docs/library/v1_scope.md": "getting-started",
  "docs/architecture_on_one_page.md": "getting-started",
  "docs/library/architecture_flows.md": "getting-started",
  "docs/library/live_e2e_happy_path.md": "developer-troubleshooting",
  "docs/library/finding_engine_output_reference.md": "evidence-trail",
  "docs/go-to-market/competitive_comparison.md": "executive-summary",
  "docs/demo/demo_recording_storyboard.md": "pilot-guide",
  "docs/start_here.md": "choose-your-next-step",
  "docs/core_pilot.md": "first-architecture-review",
  "docs/library/first_hour_operator_path.md": "first-architecture-review",
  "docs/library/customer-facing/complete_review_workflow.md": "first-architecture-review",
  "docs/library/governance_workflow_ui.md": "governance-approval",
  "docs/library/customer-facing/operator_quickstart.md": "cli-usage",
  "docs/library/customer-facing/concepts_in_5_minutes.md": "getting-started",
  "docs/library/customer-facing/how_archlucid_works.md": "getting-started",
  "docs/library/customer-facing/pilot_guide.md": "pilot-guide",
  "docs/library/customer-facing/review_guide.md": "review-guide",
  "docs/library/walkthroughs/readme.md": "specialty-walkthroughs",
  "docs/library/contributor-reference/security.md": "configuration-reference",
  "docs/library/contributor-reference/authentication_configuration.md": "configuration-reference",
  "docs/runbooks/common_errors.md": "developer-troubleshooting",
  "docs/go-to-market/how_to_request_procurement_pack.md": "procurement",
  "docs/go-to-market/soc2_status_procurement.md": "soc2-self-assessment",
  "docs/go-to-market/transactable_procurement_path.md": "procurement",
  "docs/library/customer-facing/workflow_recipes_by_persona.md": "evidence-intake",
  "docs/runbooks/azure_extractor_ingest.md": "evidence-intake",
  "docs/go-to-market/tenant_isolation.md": "audit-trail",
  "docs/go-to-market/customer_trust_and_access.md": "audit-trail",
  "docs/library/azure_extractor.md": "evidence-intake",
  "docs/library/azure_extractor_technical_backlog.md": "evidence-intake",
  "docs/go-to-market/procurement_faq.md": "procurement",
  "docs/go-to-market/buyer_security_procurement_packet.md": "procurement",
  "docs/library/hosted_enterprise_onboarding_checklist.md": "enterprise-onboarding",
  "docs/library/customer-facing/cloud_connections.md": "cloud-connections",
  "docs/executive_sponsor_brief.md": "executive-summary",
  "docs/go-to-market/executive_sponsor_brief.md": "executive-summary",
  "docs/library/agent_output_evaluation.md": "admin-diagnostics",
  "docs/library/saml_sp_certificate_rotation_runbook.md": "enterprise-onboarding",
  "docs/go-to-market/default_policy_packs_v1.md": "governance-approval",
  "docs/go-to-market/quote_to_proof_packet.md": "choose-your-next-step",
  "docs/go-to-market/pricing_philosophy.md": "procurement",
  "docs/go-to-market/custom_policy_pack_authoring_sow_template.md": "procurement",
  "docs/go-to-market/order_form_template.md": "procurement",
  "docs/security/multi_tenant_rls.md": "audit-trail",
  "docs/security/compliance_matrix.md": "audit-trail",
  "docs/go-to-market/security_reviewer_one_pager.md": "security-policies",
  "docs/go-to-market/security_control_evidence_map.md": "security-policies",
  "docs/library/security.md": "security-policies",
  "docs/go-to-market/dpa_template.md": "dpa-template",
  "docs/go-to-market/subprocessors.md": "subprocessors",
  "docs/security/soc2_self_assessment_2026.md": "soc2-self-assessment",
  "docs/security/caiq_lite_2026.md": "caiq-sig-response",
  "docs/security/sig_core_2026.md": "caiq-sig-response",
  "docs/security/pen-test-summaries/2026-q2-owner-conducted.md": "procurement",
  "docs/go-to-market/trust_center.md": "security-trust",
  "docs/go-to-market/assurance_status_canonical.md": "soc2-self-assessment",
  "docs/go-to-market/procurement_pack_index.md": "procurement",
  "docs/go-to-market/pen_test_summary_procurement_interim.md": "procurement",
  "docs/security/pen-test-summaries/2026-q2-sow.md": "procurement",
  "docs/security/pen-test-summaries/remediation_tracker.md": "security-trust",
  "docs/security/rls_risk_acceptance.md": "data-handling",
  "docs/security/system_threat_model.md": "security-trust",
  "docs/security/ask_rag_threat_model.md": "security-trust",
  "docs/security/zap_baseline_rules.md": "security-trust",
  "docs/security/managed_identity_sql_blob.md": "security-trust",
  "docs/security/gitleaks_pre_receive.md": "security-trust",
  "docs/library/second_run.md": "repeat-review-loop",
  "docs/library/operator_atlas.md": "pilot-guide",
  "docs/library/operator_decision_guide.md": "pilot-guide",
  "docs/library/concept_vocabulary.md": "scope",
  "docs/go-to-market/ui_glossary_v1.md": "scope",
  "docs/library/core_pilot.md": "first-architecture-review",
  "docs/library/pilot_guide.md": "pilot-guide",
  "docs/go-to-market/pilot_success_scorecard.md": "pilot-guide",
  "docs/pre_commit_governance_gate.md": "governance-approval",
  "docs/alerts.md": "alerts",
  "archlucid-ui/docs/testing_and_troubleshooting.md": "troubleshooting",
  "archlucid-ui/docs/architecture.md": "pilot-guide",
  "archlucid-ui/docs/operator_shell_tutorial.md": "pilot-guide",
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

function normalizeDocFragment(fragment: string): string {
  if (fragment === "v1-scalability-and-load-evidence") {
    return "scalability-and-load-evidence";
  }

  return fragment;
}

function resolveAbsoluteDocHref(absoluteHref: string, fragment: string): string {
  const hashIndex = absoluteHref.indexOf("#");
  const base = hashIndex >= 0 ? absoluteHref.slice(0, hashIndex) : absoluteHref;
  const defaultFragment = hashIndex >= 0 ? absoluteHref.slice(hashIndex + 1) : "";
  const useFragment = normalizeDocFragment(fragment.length > 0 ? fragment : defaultFragment);

  if (useFragment.length === 0) {
    return base;
  }

  return `${base}#${useFragment}`;
}

/**
 * Resolves a repo-relative docs path to an in-app operator help route when mapped.
 * Returns `null` for contributor-only docs that should not become help links.
 */
export function tryResolveInAppDocHref(docPath: string): string | null {
  const hashIndex = docPath.indexOf("#");
  const pathPart = hashIndex >= 0 ? docPath.slice(0, hashIndex) : docPath;
  const fragment = hashIndex >= 0 ? docPath.slice(hashIndex + 1) : "";
  const normalized = normalizeDocPath(pathPart);

  if (normalized.length === 0) {
    return null;
  }

  const absoluteHref = DOC_PATH_TO_ABSOLUTE_HREF[normalized];

  if (absoluteHref !== undefined && absoluteHref.length > 0) {
    return resolveAbsoluteDocHref(absoluteHref, fragment);
  }

  const aliasSlug = DOC_PATH_TO_SLUG[normalized];
  const slug = aliasSlug ?? slugFromRegistry(normalized);

  if (slug === undefined || slug === null || slug.length === 0) {
    return null;
  }

  const normalizedFragment = normalizeDocFragment(fragment);

  return inAppHelpHref(slug, normalizedFragment.length > 0 ? normalizedFragment : undefined);
}

/**
 * Resolves a repo-relative docs path to an in-app operator help route (`/help` or `/help/{slug}`).
 * Product UI must not link to GitHub blob URLs by default.
 */
export function resolveInAppDocHref(docPath: string): string {
  const resolved = tryResolveInAppDocHref(docPath);

  if (resolved !== null) {
    return resolved;
  }

  return "/help";
}
