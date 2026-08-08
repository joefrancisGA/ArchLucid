"""Unit tests for UI route catalog discovery."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from archlucid_ui_route_catalog import (  # noqa: E402
    build_catalog,
    discover_app_router_paths,
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
    assert "/administration/users?tab=roles" in tab_paths
    assert "/architecture/reviews/new?path=guided-intake" in tab_paths
    assert "/governance/advisory-scans?tab=scans" in tab_paths
    assert "/governance/advisory-scans?tab=schedules" in tab_paths
    assert "/advisory?tab=scans" not in tab_paths


def test_build_catalog_classifies_architecture_intelligence_as_core_review() -> None:
    catalog = build_catalog()
    assert catalog["/architecture/architecture-intelligence"].section == "Core review"


def test_migrate_workbook_path_maps_legacy_core_pilot_help_slug() -> None:
    assert migrate_workbook_path("/help/core-pilot") == "/help/first-architecture-review"


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
    assert "/governance/advisory-scans" in catalog
    assert "/alert-routing" not in catalog
    assert "/governance/alert-rules?tab=routing" in catalog


def test_migrate_workbook_path_maps_retired_cloud_connection_help_slugs() -> None:
    assert migrate_workbook_path("/help/cloud-connections-azure") == "/help/cloud-connections/azure"
    assert migrate_workbook_path("/help/cloud-connections-aws") == "/help/cloud-connections/aws"
    assert migrate_workbook_path("/help/cloud-connections-gcp") == "/help/cloud-connections/gcp"


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


def test_migrate_workbook_path_maps_legacy_advisory_routes() -> None:
    assert migrate_workbook_path("/advisory") == "/governance/advisory-scans"
    assert migrate_workbook_path("/advisory?tab=scans") == "/governance/advisory-scans?tab=scans"
    assert migrate_workbook_path("/advisory?tab=schedules") == "/governance/advisory-scans?tab=schedules"
    assert migrate_workbook_path("/advisory-scheduling") == "/governance/advisory-scans?tab=schedules"


def test_migrate_workbook_path_maps_legacy_alert_routing() -> None:
    assert migrate_workbook_path("/alert-routing") == "/governance/alert-rules?tab=routing"


def test_migrate_workbook_path_maps_legacy_settings_alerts() -> None:
    assert migrate_workbook_path("/settings/alerts") == "/governance/alert-rules"


def test_build_catalog_does_not_track_retired_settings_alerts_bookmark() -> None:
    catalog = build_catalog()
    assert "/settings/alerts" not in catalog


def test_build_catalog_skips_rer_run_artifact_preview_redirect_page() -> None:
    catalog = build_catalog()
    assert "/architecture/reviews/[runId]/artifacts/[artifactId]" not in catalog


def test_build_catalog_does_not_invent_alerts_inbox_tab_query() -> None:
    catalog = build_catalog()
    assert "/governance/alerts?tab=inbox" not in catalog


def test_build_catalog_does_not_track_retired_settings_exec_digest_bookmark() -> None:
    catalog = build_catalog()
    assert "/settings/exec-digest" not in catalog


def test_migrate_workbook_path_maps_legacy_settings_exec_digest() -> None:
    assert migrate_workbook_path("/settings/exec-digest") == "/architecture/digests?tab=schedule"


def test_migrate_workbook_path_maps_legacy_operator_system_health() -> None:
    assert migrate_workbook_path("/health") == "/administration/system-health"


def test_migrate_workbook_path_maps_legacy_executive_dashboard_bookmarks() -> None:
    assert migrate_workbook_path("/dashboard") == "/architecture/executive-dashboard"
    assert migrate_workbook_path("/executive/dashboard") == "/architecture/executive-dashboard"
    assert migrate_workbook_path("/portfolio") == "/architecture/executive-dashboard"


def test_migrate_workbook_path_maps_legacy_admin_internal_ops() -> None:
    assert migrate_workbook_path("/admin/health") == "/internal/health"
    assert migrate_workbook_path("/admin/tenant-health") == "/internal/tenant-health"
    assert migrate_workbook_path("/admin/fleet-llm-cogs") == "/internal/fleet-llm-cogs"
    assert migrate_workbook_path("/admin/demo-readiness") == "/internal/demo-readiness"
    assert migrate_workbook_path("/admin/integrations/itsm") == "/internal/integrations/itsm"


def test_migrate_workbook_path_maps_legacy_sponsor_report_to_insights() -> None:
    assert migrate_workbook_path("/sponsor-report/executive-summary") == "/insights/executive-summary"
    assert migrate_workbook_path("/sponsor-report/roi-summary") == "/insights/roi-summary"
    assert migrate_workbook_path("/sponsor-report/pilot-outcomes") == "/insights/pilot-outcomes"
    assert migrate_workbook_path("/value-report") == "/insights/executive-summary"


def test_migrate_workbook_path_maps_legacy_replay_and_signed_records() -> None:
    assert migrate_workbook_path("/replay") == "/internal/replay"
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
    assert catalog["/internal/replay"].section == "Marketing"
    assert catalog["/internal/product-learning"].section == "Onboarding"
    assert catalog["/internal/integration-events/dlq"].section == "Advisory"
    assert catalog["/insights/roi-summary"].section == "Sponsor report"
    assert catalog["/insights/pilot-outcomes"].section == "Sponsor report"


def test_build_catalog_tracks_evidence_graph_as_planning() -> None:
    catalog = build_catalog()
    assert "/insights/evidence-graph" in catalog
    assert catalog["/insights/evidence-graph"].section == "Planning"


def test_build_catalog_tracks_first_review_guide_as_onboarding() -> None:
    catalog = build_catalog()
    assert "/architecture/first-review-guide" in catalog
    assert catalog["/architecture/first-review-guide"].section == "Onboarding"


def test_suggest_row_id_is_unique_and_three_chars() -> None:
    used = {"HOM", "RE"}
    row_id = suggest_row_id("/architectures/new", used)
    assert row_id not in used
    assert len(row_id) <= 3
