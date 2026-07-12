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
    assert "/architectures" in paths
    assert "/governance/alerts" in paths
    assert "/integrations/cloud-connections" in paths


def test_discover_tab_paths_includes_architecture_workspace_tabs() -> None:
    tab_paths = discover_tab_paths()
    assert "/reviews/[runId]?archTab=evidence" in tab_paths
    assert "/settings/users?tab=roles" in tab_paths
    assert "/reviews/new?path=guided-intake" in tab_paths


def test_build_catalog_excludes_redirect_only_legacy_paths() -> None:
    catalog = build_catalog()
    assert "/alerts" not in catalog
    assert "/governance/alerts" in catalog
    assert "/admin/cloud-connections/aws" not in catalog


def test_migrate_workbook_path_maps_legacy_alerts() -> None:
    assert migrate_workbook_path("/alerts") == "/governance/alerts"


def test_suggest_row_id_is_unique_and_three_chars() -> None:
    used = {"HOM", "RE"}
    row_id = suggest_row_id("/architectures/new", used)
    assert row_id not in used
    assert len(row_id) <= 3
