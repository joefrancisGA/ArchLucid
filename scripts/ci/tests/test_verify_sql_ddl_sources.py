"""Tests for verify_sql_ddl_sources.py."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "ci" / "verify_sql_ddl_sources.py"
    spec = importlib.util.spec_from_file_location("verify_sql_ddl_sources", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_repo_canonical_ddl_passes() -> None:
    module = _load_module()
    errors = module.verify_sql_ddl_sources(REPO_ROOT)

    assert errors == [], errors


def test_create_table_outside_canonical_paths_fails(tmp_path: Path) -> None:
    module = _load_module()
    scripts = tmp_path / "ArchLucid.Persistence" / "Scripts"
    scripts.mkdir(parents=True)
    (scripts / "ArchLucid.sql").write_text("CREATE TABLE dbo.Runs (RunId UNIQUEIDENTIFIER NOT NULL);", encoding="utf-8")
    migrations = tmp_path / "ArchLucid.Persistence" / "Migrations"
    migrations.mkdir(parents=True)
    (migrations / "001_init.sql").write_text("-- ok", encoding="utf-8")
    rogue = tmp_path / "rogue.sql"
    rogue.write_text("CREATE TABLE dbo.Evil (Id INT);", encoding="utf-8")

    errors = module.verify_sql_ddl_sources(tmp_path)

    assert any("rogue.sql" in error for error in errors)
