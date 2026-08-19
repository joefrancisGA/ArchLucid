from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_comparison_replay_drift_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_comparison_replay_drift_honesty", script)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_comparison_replay_drift_honesty"] = module
    spec.loader.exec_module(module)
    return module.comparison_replay_drift_honesty_violations


GUARD = _load_guard()

HONEST_STUB = "Use verify mode (422 on mismatch) per TB-1024 comparison replay immutable snapshot contract.\n"

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
    "archlucid-ui/src/lib/comparison-replay-help-guide-content.ts",
    "archlucid-ui/src/lib/why-comparison.ts",
    "archlucid-ui/src/lib/contextual-help/help-topic-rows.ts",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = root / "docs/library/COMPARISON_REPLAY_IMMUTABLE_SNAPSHOT_CONTRACT.md"
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1024**",
                "**TB-1025**",
                "check_comparison_replay_drift_honesty.py",
                "artifact",
                "verify",
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
                "#comparison-replay-immutable-snapshot-m-175",
                "TB-1025",
                "verify mode (422 on mismatch)",
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
        "Do not promise artifact replay proves architecture unchanged. Use verify mode (422 on mismatch).\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_artifact_stable_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text("Artifact replay proves architecture unchanged on every compare.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("artifact replay proves architecture unchanged" in item for item in violations)


def test_fails_on_drift_language_without_tb_1024_anchor(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text("We guarantee architecture drift is impossible after compare.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("without TB-1024" in item for item in violations)
