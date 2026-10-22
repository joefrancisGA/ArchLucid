"""Tests for mutating route audit matrix proof rendering."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_check_module():
    path = REPO_ROOT / "scripts" / "ci" / "check_audit_matrix.py"
    spec = importlib.util.spec_from_file_location("check_audit_matrix", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _load_governance_module():
    path = REPO_ROOT / "scripts" / "ci" / "report_governance_policy_pack_proof.py"
    spec = importlib.util.spec_from_file_location("report_governance_policy_pack_proof", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_evaluate_mutating_route_audit_matrix_passes_on_repo() -> None:
    module = _load_check_module()
    discovered, undocumented, _, _ = module.evaluate_mutating_route_audit_matrix(REPO_ROOT)

    assert discovered > 0
    assert undocumented == []


def test_render_audit_matrix_proof_markdown_includes_disposition() -> None:
    module = _load_check_module()
    discovered, undocumented, matrix_path, allow_path = module.evaluate_mutating_route_audit_matrix(REPO_ROOT)
    markdown = module.render_audit_matrix_proof_markdown(
        discovered_count=discovered,
        undocumented=undocumented,
        matrix_path=matrix_path,
        allowlist_path=allow_path,
        repo_root_path=REPO_ROOT,
    )

    assert "**PASS**" in markdown
    assert "AUDIT_COVERAGE_MATRIX.md" in markdown


def test_governance_policy_pack_proof_passes_on_repo() -> None:
    module = _load_governance_module()
    fixture = REPO_ROOT / "scripts" / "ci" / "fixtures" / "governance-policy-pack-dry-run-proof.json"
    violations = module.run_checks(REPO_ROOT, fixture)

    assert violations == []


def test_governance_fixture_has_evidence_reference() -> None:
    fixture = REPO_ROOT / "scripts" / "ci" / "fixtures" / "governance-policy-pack-dry-run-proof.json"
    payload = json.loads(fixture.read_text(encoding="utf-8"))
    evidence = payload["sampleDryRun"]["evidenceReferences"]

    assert len(evidence) >= 1
    assert evidence[0]["findingId"]
