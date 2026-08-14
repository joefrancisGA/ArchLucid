"""Unit tests for UI route catalog discovery."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from archlucid_ui_route_catalog import (  # noqa: E402
    PREFERRED_NEW_ROW_IDS,
    build_catalog,
    discover_app_router_paths,
    discover_help_paths,
    discover_tab_paths,
    migrate_workbook_path,
    suggest_row_id,
)


def test_discover_app_router_paths_includes_architectures_hub() -> None:
    paths = discover_app_router_paths()
    assert "/architecture/architectures" in paths
    assert "/governance/alerts" in paths
    assert "/integrations/cloud-connections" in paths


def test_discover_tab_paths_includes_architecture_workspace_tabs() -> None:
    tab_paths = discover_tab_paths()
    assert "/architecture/reviews/[runId]?archTab=evidence" in tab_paths
    assert "/architecture/digests?tab=get-started" in tab_paths
    assert "/architecture/digests?tab=browse" not in tab_paths
    assert "/administration/users?tab=roles" in tab_paths
    assert "/administration/users?tab=keys" not in tab_paths
    assert "/architecture/reviews/new?path=guided-intake" in tab_paths
    assert "/governance/advisory-scans?tab=scans" in tab_paths
    assert "/governance/advisory-scans?tab=schedules" in tab_paths
    assert "/advisory?tab=scans" not in tab_paths


def test_build_catalog_classifies_demo_explain_as_internal() -> None:
    catalog = build_catalog()
    assert catalog["/demo/explain"].section == "Internal"


def test_build_catalog_classifies_architecture_intelligence_as_core_review() -> None:
    catalog = build_catalog()
    assert catalog["/architecture/architecture-intelligence"].section == "Core review"


def test_discover_help_paths_includes_cloud_connections_slash_canonicals() -> None:
    help_paths, alias_paths = discover_help_paths()

    assert "/help/cloud-connections/azure" in help_paths
    assert "/help/cloud-connections/aws" in help_paths
    assert "/help/cloud-connections/gcp" in help_paths
    assert "/help/cloud-connections-azure" not in help_paths
    assert "/help/cloud-connections/aws" in alias_paths


RETIRED_HELP_BOOKMARK_PATHS = (
    "/help/cloud-connections-azure",
    "/help/cloud-connections-aws",
    "/help/cloud-connections-gcp",
    "/help/core-pilot",
    "/help/governance-api-contracts",
    "/help/creating-runs",
    "/help/data-handling-tenant-isolation",
    "/help/evidence-only-review",
    "/help/how-it-works",
    "/help/integrations/azure-boards",
    "/help/product-overview",
    "/help/starting-reviews",
    "/help/evaluator-workbook",
    "/help/path-chooser",
    "/help/first-hour-operator-path",
    "/help/first-pilot-path",
    "/help/operator-auth-roles",
    "/help/pilot-nav-profile",
    "/help/first-review",
    "/help/first-value-20-minutes",
    "/help/pilot-roi-model",
    "/help/developer-troubleshooting",
)


def test_migrate_workbook_path_no_longer_maps_retired_help_bookmarks() -> None:
    for legacy_path in RETIRED_HELP_BOOKMARK_PATHS:
        assert migrate_workbook_path(legacy_path) == legacy_path

    assert migrate_workbook_path("/help/policy-pack-delta-demo") == "/help/policy-packs#policy-pack-delta-demo"


def test_build_catalog_keeps_tb2050_retired_aliases_out() -> None:
    catalog = build_catalog()
    assert "/help/governance-api-contracts" not in catalog
    assert "/help/evaluator-workbook" not in catalog
    assert "/help/first-hour-operator-path" not in catalog
    assert "/help/first-pilot-path" not in catalog
    assert "/help/pilot-nav-profile" not in catalog
    assert "/help/operator-auth-roles" not in catalog
    assert "/help/core-pilot" not in catalog
    assert "/help/first-architecture-review" in catalog
    assert "/help/api-contracts" in catalog
    assert "/help/choose-your-next-step" in catalog
    assert "/help/users-and-roles" in catalog
    assert "/help/data-handling-tenant-isolation" not in catalog
    assert "/help/integrations/azure-boards" not in catalog
    assert "/help/starting-reviews" not in catalog
    assert "/help/evidence-only-review" not in catalog
    assert "/help/product-overview" not in catalog
    assert "/help/how-it-works" not in catalog
    assert "/help/data-handling" in catalog
    assert "/help/azure-boards" in catalog
    assert "/help/review-guide" in catalog
    assert "/help/sponsor-report" in catalog
    assert "/help/getting-started" in catalog


def test_build_catalog_excludes_redirect_only_legacy_paths() -> None:
    catalog = build_catalog()
    assert "/alerts" not in catalog
    assert "/governance/alerts" in catalog
    assert "/admin/cloud-connections/aws" not in catalog
    assert "/help/cloud-connections-azure" not in catalog
    assert "/help/cloud-connections/aws" in catalog
    assert "/help/cloud-connections-aws" not in catalog
    assert "/advisory" not in catalog
    assert "/advisory-scheduling" not in catalog
    assert "/governance/advisory-scans" not in catalog
    assert "/governance/advisory-scans?tab=scans" in catalog
    assert "/alert-routing" not in catalog
    assert "/governance/alert-rules?tab=notifications" in catalog
    assert "/governance/alert-rules?tab=routing" not in catalog


def test_migrate_workbook_path_maps_legacy_advisory_bookmarks() -> None:
    assert migrate_workbook_path("/advisory") == "/governance/advisory-scans?tab=scans"
    assert migrate_workbook_path("/governance/advisory-scans") == "/governance/advisory-scans?tab=scans"
    assert migrate_workbook_path("/advisory?tab=scans") == "/governance/advisory-scans?tab=scans"
    assert migrate_workbook_path("/advisory?tab=schedules") == "/governance/advisory-scans?tab=schedules"
    assert migrate_workbook_path("/advisory-scheduling") == "/governance/advisory-scans?tab=schedules"


def test_build_catalog_does_not_track_retired_advisory_scans_hub() -> None:
    catalog = build_catalog()
    assert "/governance/advisory-scans" not in catalog


def test_migrate_workbook_path_maps_legacy_tenant_settings_bookmarks() -> None:
    assert migrate_workbook_path("/administration/tenant") == "/administration/workspace-settings"
    assert (
        migrate_workbook_path("/administration/tenant/recycle-bin")
        == "/administration/workspace-settings/recycle-bin"
    )


def test_build_catalog_does_not_track_legacy_tenant_settings_redirects() -> None:
    catalog = build_catalog()
    assert "/administration/tenant" not in catalog
    assert "/administration/tenant/recycle-bin" not in catalog
    assert "/administration/workspace-settings" in catalog



def test_migrate_workbook_path_maps_legacy_alerts() -> None:
    assert migrate_workbook_path("/alerts") == "/governance/alerts"


def test_migrate_workbook_path_maps_retired_insights_operator_paths() -> None:
    assert migrate_workbook_path("/ask") == "/insights/ask-review-questions"
    assert migrate_workbook_path("/graph") == "/insights/evidence-graph"
    assert migrate_workbook_path("/search") == "/insights/search-review-evidence"
    assert migrate_workbook_path("/compare") == "/insights/compare-two-reviews"
    assert migrate_workbook_path("/scorecard") == "/insights/architecture-scorecard"


def test_migrate_workbook_path_maps_legacy_settings_hub() -> None:
    assert migrate_workbook_path("/settings") == "/administration"
    assert migrate_workbook_path("/settings/support") == "/administration/support"
    assert migrate_workbook_path("/admin/support") == "/administration/support"
    assert migrate_workbook_path("/settings/users") == "/administration/users"
    assert migrate_workbook_path("/admin/users") == "/administration/users"
    assert migrate_workbook_path("/settings/roles") == "/administration/users?tab=roles"


def test_migrate_workbook_path_maps_legacy_governance_resolution() -> None:
    assert migrate_workbook_path("/governance-resolution") == "/governance/standards-and-rules"
    assert migrate_workbook_path("/governance/resolution") == "/governance/standards-and-rules"


def test_migrate_workbook_path_maps_legacy_alert_routing() -> None:
    assert migrate_workbook_path("/alert-routing") == "/governance/alert-rules?tab=notifications"
    assert (
        migrate_workbook_path("/governance/alert-rules?tab=routing")
        == "/governance/alert-rules?tab=notifications"
    )
    assert migrate_workbook_path("/governance/alerts?tab=inbox") == "/governance/alerts"


def test_migrate_workbook_path_maps_legacy_onboarding_and_quick_start() -> None:
    assert migrate_workbook_path("/onboarding/start") == "/architecture/first-review-guide"
    assert migrate_workbook_path("/onboard") == "/architecture/first-review-guide"
    assert migrate_workbook_path("/quick-start") == "/get-started"


def test_migrate_workbook_path_maps_legacy_login_and_architecture_graph() -> None:
    assert migrate_workbook_path("/login") == "/auth/signin"
    assert migrate_workbook_path("/operate/architecture-graph") == "/insights/evidence-graph"


def test_migrate_workbook_path_maps_legacy_settings_alerts() -> None:
    assert migrate_workbook_path("/settings/alerts") == "/governance/alert-rules"


def test_build_catalog_does_not_track_retired_settings_alerts_bookmark() -> None:
    catalog = build_catalog()
    assert "/settings/alerts" not in catalog


def test_build_catalog_skips_rer_run_artifact_preview_redirect_page() -> None:
    catalog = build_catalog()
    assert "/architecture/reviews/[runId]/artifacts/[artifactId]" not in catalog


def test_build_catalog_skips_demo_entry_redirect_page() -> None:
    catalog = build_catalog()
    assert "/demo" not in catalog
    assert "/demo/explain" in catalog
    assert "/demo/preview" in catalog


def test_build_catalog_does_not_invent_alerts_inbox_tab_query() -> None:
    catalog = build_catalog()
    assert "/governance/alerts?tab=inbox" not in catalog


def test_build_catalog_does_not_track_retired_settings_exec_digest_bookmark() -> None:
    catalog = build_catalog()
    assert "/settings/exec-digest" not in catalog


def test_migrate_workbook_path_maps_legacy_settings_exec_digest() -> None:
    assert migrate_workbook_path("/settings/exec-digest") == "/architecture/digests?tab=schedule"


def test_migrate_workbook_path_maps_legacy_digests_browse_tab() -> None:
    assert migrate_workbook_path("/architecture/digests?tab=browse") == "/architecture/digests?tab=get-started"
    assert migrate_workbook_path("/digests?tab=browse") == "/architecture/digests?tab=get-started"


def test_migrate_workbook_path_maps_legacy_operator_system_health() -> None:
    assert migrate_workbook_path("/health") == "/administration/system-health"


def test_migrate_workbook_path_maps_legacy_executive_dashboard_bookmarks() -> None:
    assert migrate_workbook_path("/dashboard") == "/architecture/sponsor-dashboard"
    assert migrate_workbook_path("/sponsor/dashboard") == "/architecture/sponsor-dashboard"
    assert migrate_workbook_path("/portfolio") == "/architecture/sponsor-dashboard"


def test_migrate_workbook_path_maps_legacy_admin_internal_ops() -> None:
    assert migrate_workbook_path("/admin/health") == "/internal/health"
    assert migrate_workbook_path("/admin/tenant-health") == "/internal/tenant-health"
    assert migrate_workbook_path("/admin/fleet-llm-cogs") == "/internal/fleet-llm-cogs"
    assert migrate_workbook_path("/admin/demo-readiness") == "/internal/demo-readiness"
    assert migrate_workbook_path("/admin/integrations/itsm") == "/internal/integrations/itsm"


def test_migrate_workbook_path_maps_legacy_sponsor_report_to_insights() -> None:
    assert migrate_workbook_path("/sponsor-report/sponsor-report") == "/insights/sponsor-report"
    assert migrate_workbook_path("/sponsor-report/roi-summary") == "/insights/roi-summary"
    assert migrate_workbook_path("/sponsor-report/pilot-outcomes") == "/insights/pilot-outcomes"
    assert migrate_workbook_path("/value-report") == "/insights/sponsor-report"


def test_migrate_workbook_path_maps_legacy_replay_and_signed_records() -> None:
    assert migrate_workbook_path("/replay") == "/internal/validate-route"
    assert migrate_workbook_path("/internal/replay") == "/internal/validate-route"
    assert migrate_workbook_path("/signed-records") == "/governance/signed-records"
    assert (
        migrate_workbook_path("/signed-records/[manifestId]")
        == "/governance/signed-records/[manifestId]"
    )
    assert (
        migrate_workbook_path("/manifests/[manifestId]")
        == "/governance/signed-records/[manifestId]"
    )


def test_infer_section_maps_internal_and_insights_sponsor_paths() -> None:
    catalog = build_catalog()
    assert catalog["/internal/health"].section == "Admin"
    assert catalog["/internal/validate-route"].section == "Marketing"
    assert catalog["/internal/product-learning"].section == "Onboarding"
    assert catalog["/internal/failed-integration-messages"].section == "Advisory"
    assert catalog["/insights/roi-summary"].section == "Sponsor report"
    assert catalog["/insights/pilot-outcomes"].section == "Sponsor report"
    assert catalog["/help/configuration-reference"].section == "Internal"


def test_build_catalog_tracks_evidence_graph_as_planning() -> None:
    catalog = build_catalog()
    assert "/insights/evidence-graph" in catalog
    assert catalog["/insights/evidence-graph"].section == "Planning"


def test_build_catalog_tracks_first_review_guide_as_onboarding() -> None:
    catalog = build_catalog()
    assert "/architecture/first-review-guide" in catalog
    assert catalog["/architecture/first-review-guide"].section == "Onboarding"


def test_build_catalog_includes_contextual_help_drawer_shell_overlay() -> None:
    catalog = build_catalog()
    assert "/shell/contextual-help-drawer" in catalog
    assert catalog["/shell/contextual-help-drawer"].section == "Shell overlay"


def test_preferred_new_row_ids_assign_hcd_to_contextual_help_drawer() -> None:
    assert PREFERRED_NEW_ROW_IDS["/shell/contextual-help-drawer"] == "HCD"


    used = {"HOM", "RE"}
    row_id = suggest_row_id("/architectures/new", used)
    assert row_id not in used
    assert len(row_id) <= 3


def test_preferred_new_row_ids_are_well_formed_and_unique() -> None:
    """Guards the ID override map the workbook sync imports (empty is valid)."""
    assert isinstance(PREFERRED_NEW_ROW_IDS, dict)

    for path, row_id in PREFERRED_NEW_ROW_IDS.items():
        assert path.startswith("/"), path
        assert 1 <= len(row_id) <= 3, row_id
        assert row_id.isupper(), row_id

    row_ids = list(PREFERRED_NEW_ROW_IDS.values())
    assert len(row_ids) == len(set(row_ids))


def test_preferred_new_row_ids_only_pins_catalog_paths() -> None:
    """A pinned ID for a path the catalog no longer serves would never be applied."""
    catalog_paths = set(build_catalog())

    for path in PREFERRED_NEW_ROW_IDS:
        assert path in catalog_paths, path
