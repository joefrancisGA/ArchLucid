from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_launch_load_failure_order_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_launch_load_failure_order_honesty", script)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_launch_load_failure_order_honesty"] = module
    spec.loader.exec_module(module)
    return module.launch_load_failure_order_honesty_violations


GUARD = _load_guard()

HONEST_STUB = (
    "HTTP-first launch vs AOAI TPM ceiling; G-SCALE-02 drill pending (TB-1032).\n"
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
    "docs/library/CAPACITY_AND_COST_PLAYBOOK.md",
    "docs/library/DEGRADED_MODE.md",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = root / "docs/library/LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_CONTRACT.md"
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1032**",
                "**TB-1033**",
                "check_launch_load_failure_order_honesty.py",
                "AOAI",
                "HTTP",
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
                "#launch-load-failure-order-m-183",
                "TB-1033",
                "g-scale-02",
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
        "Do not claim scale-out removes AOAI 429. HTTP-first launch; G-SCALE-02 drill pending.\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_scale_out_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text("Scale-out removes 429 for every buyer launch.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("scale-out removes 429" in item for item in violations)


def test_fails_on_launch_load_language_without_tb_1032_anchor(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text("Our LinkedIn burst always succeeds without limits.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("without TB-1032" in item for item in violations)
