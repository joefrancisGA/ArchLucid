from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_unvalidated_proposal_overlay_honesty.py"
    spec = importlib.util.spec_from_file_location(
        "_check_unvalidated_proposal_overlay_honesty",
        script,
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_unvalidated_proposal_overlay_honesty"] = module
    spec.loader.exec_module(module)
    return module.unvalidated_proposal_overlay_honesty_violations


GUARD = _load_guard()

HONEST_STUB = (
    "Typed findings + sealed graph decide; proposals advisory until validate-before-overlay (TB-1196).\n"
)

SCAN_REL_PATHS: tuple[str, ...] = (
    "docs/go-to-market/WHAT_NOT_TO_PROMISE.md",
    "docs/go-to-market/POSITIONING.md",
    "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
    "docs/go-to-market/AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_PA_ONE_PAGER.md",
    "docs/go-to-market/PA_CLAIM_HONESTY_INDEX.md",
    "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = (
        root / "docs/library/AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md"
    )
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1196**",
                "**TB-1197**",
                "check_unvalidated_proposal_overlay_honesty.py",
                "Validate-before-overlay",
                "AgentTopologyProposalGraphMerge",
                "M-203",
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
                "agent-output-decisioning-real-variance-m-204",
                "TB-1197",
                "AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT",
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
        "Do not sell agent free text as the signed package (TB-1196 / validate-before-overlay).\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_agent_free_text_signed_package_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text(
        "Agent free text = signed package after PilotStrict passes.\n",
        encoding="utf-8",
    )
    violations = GUARD(repo_root)
    assert any("agent free text = signed package" in item for item in violations)


def test_fails_on_pilotstrict_overlay_language_without_tb_1196_anchor(
    repo_root: Path,
) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text(
        "PilotStrict green makes Real overlays corruption-proof for every tenant.\n",
        encoding="utf-8",
    )
    violations = GUARD(repo_root)
    assert any("without TB-1196" in item for item in violations)
