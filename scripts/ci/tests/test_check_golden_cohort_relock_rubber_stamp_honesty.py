from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_golden_cohort_relock_rubber_stamp_honesty.py"
    spec = importlib.util.spec_from_file_location(
        "_check_golden_cohort_relock_rubber_stamp_honesty",
        script,
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_golden_cohort_relock_rubber_stamp_honesty"] = module
    spec.loader.exec_module(module)
    return module.golden_cohort_relock_rubber_stamp_honesty_violations


GUARD = _load_guard()

HONEST_STUB = (
    "Intentional re-lock with rationale per TB-1172; cohort re-lock does not heal production.\n"
)

SCAN_REL_PATHS: tuple[str, ...] = (
    "docs/go-to-market/WHAT_NOT_TO_PROMISE.md",
    "docs/go-to-market/POSITIONING.md",
    "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
    "docs/go-to-market/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_PA_ONE_PAGER.md",
    "docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md",
    "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md",
    "docs/library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md",
    "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = root / "docs/library/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT.md"
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1172**",
                "**TB-1173**",
                "check_golden_cohort_relock_rubber_stamp_honesty.py",
                "Never re-lockable",
                "rubber stamp",
                "M-201",
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
                "golden-cohort-relock-vs-rubber-stamp-m-202",
                "TB-1173",
                "GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT",
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
        "Do not claim cohort re-lock heals production ManifestHash (TB-1172).\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_cohort_relock_heals_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text(
        "Cohort re-lock heals production ManifestHash after nightly drift.\n",
        encoding="utf-8",
    )
    violations = GUARD(repo_root)
    assert any("cohort re-lock heals production" in item for item in violations)


def test_fails_on_golden_cohort_language_without_tb_1172_anchor(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text(
        "Our golden cohort baseline proves production stability after every release.\n",
        encoding="utf-8",
    )
    violations = GUARD(repo_root)
    assert any("without TB-1172" in item for item in violations)
