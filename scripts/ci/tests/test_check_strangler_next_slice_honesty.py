from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_strangler_next_slice_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_strangler_next_slice_honesty", script)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_strangler_next_slice_honesty"] = module
    spec.loader.exec_module(module)
    return module.strangler_next_slice_honesty_violations


GUARD = _load_guard()

HONEST_STUB = (
    "Authority product-default; AgentTask extension loop; /result does not commit (TB-1034).\n"
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
    "docs/library/ARCHITECTURE_FLOWS.md",
    "docs/library/AUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT.md",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = root / "docs/library/STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md"
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1034**",
                "**TB-1035**",
                "check_strangler_next_slice_honesty.py",
                "Authority",
                "/result",
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
                "#strangler-next-slice-result-sunset-m-185",
                "TB-1035",
                "authority product-default",
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
        "Do not teach create→execute→commit is the default peer lifecycle. Authority product-default.\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_dual_storage_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text("Dual coordinator storage still ships in production.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("dual coordinator storage still ships" in item for item in violations)


def test_fails_on_strangler_language_without_tb_1034_anchor(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text("Our default peer lifecycle is always execute after create.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("without TB-1034" in item for item in violations)
