from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_operator_primary_object_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_operator_primary_object_honesty", script)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_operator_primary_object_honesty"] = module
    spec.loader.exec_module(module)
    return module.operator_primary_object_honesty_violations


GUARD = _load_guard()

HONEST_STUB = (
    "Architecture package is primary; review is lifecycle on /reviews spine (TB-1026).\n"
)

SCAN_REL_PATHS: tuple[str, ...] = (
    "docs/go-to-market/WHAT_NOT_TO_PROMISE.md",
    "docs/go-to-market/PRODUCT_DATASHEET.md",
    "docs/go-to-market/POSITIONING.md",
    "docs/go-to-market/COMPETITIVE_POSITIONING.md",
    "docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md",
    "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
    "docs/go-to-market/COMPETITIVE_LANDSCAPE.md",
    "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md",
    "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md",
    "archlucid-ui/src/lib/operator/operator-home-page-copy.ts",
    "archlucid-ui/src/lib/why-archlucid-page-copy.ts",
    "archlucid-ui/src/lib/vocabulary/signed-records-review-detail-vocabulary.ts",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = root / "docs/library/OPERATOR_PRIMARY_OBJECT_NAV_COLLAPSE_CONTRACT.md"
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1026**",
                "**TB-1027**",
                "check_operator_primary_object_honesty.py",
                "architecture package",
                "/reviews",
            ]
        ),
        encoding="utf-8",
    )


def _write_procurement(root: Path) -> None:
    packet = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    packet.parent.mkdir(parents=True, exist_ok=True)
    packet.write_text(
        "\n".join(
            [
                "#operator-primary-object-nav-collapse-m-177",
                "TB-1027",
                "hireable unit is the **architecture package**",
            ]
        ),
        encoding="utf-8",
    )


def _write_honest_scan_stubs(root: Path) -> None:
    for rel in SCAN_REL_PATHS:
        path = root / rel
        if path.name == "BUYER_SECURITY_PROCUREMENT_PACKET.md":
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(HONEST_STUB, encoding="utf-8")


def test_passes_when_docs_are_honest(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    _write_honest_scan_stubs(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.write_text(
        "Do not promise findings are the hireable unit of truth. Architecture package is primary on /reviews.\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_finding_primary_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text("Findings are the hireable unit of truth for every buyer.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("findings are the hireable unit of truth" in item for item in violations)


def test_fails_on_primary_workflow_without_tb_1026_anchor(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text("Our primary workflow is findings triage only.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("without TB-1026" in item for item in violations)
