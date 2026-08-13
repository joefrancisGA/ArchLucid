from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard():
    script = _CI / "check_first_15_package_spine_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_first_15_package_spine_honesty", script)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["_check_first_15_package_spine_honesty"] = module
    spec.loader.exec_module(module)
    return module.first_15_package_spine_honesty_violations


GUARD = _load_guard()

HONEST_STUB = (
    "Finalize + sponsor export on /reviews/{runId}; minute-12 checkpoint; M-44 not proof (TB-1030).\n"
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
    "docs/library/CANONICAL_FIRST_RUN_PATH.md",
    "docs/library/FIRST_15_MINUTES_FOR_PRINCIPAL_ARCHITECTS.md",
    "archlucid-ui/src/components/marketing/welcome-marketing-copy.ts",
    "archlucid-ui/src/lib/cloud-neutral-primary-copy.ts",
)


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def _write_contract(root: Path) -> None:
    contract = root / "docs/library/PA_FIRST_15_PACKAGE_SPINE_IA_CONTRACT.md"
    contract.parent.mkdir(parents=True, exist_ok=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1030**",
                "**TB-1031**",
                "check_first_15_package_spine_honesty.py",
                "minute-12",
                "/reviews/{runId}",
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
                "#pa-first-15-package-spine-ia-m-181",
                "TB-1031",
                "minute-12 checkpoint",
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
        "Do not promise 15 minutes without founder narration. Package spine + minute-12 on /reviews/{runId}.\n",
        encoding="utf-8",
    )
    assert GUARD(repo_root) == []


def test_fails_on_unguarded_product_led_claim(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    wntp = repo_root / "docs/go-to-market/WHAT_NOT_TO_PROMISE.md"
    wntp.parent.mkdir(parents=True, exist_ok=True)
    wntp.write_text("Product-led first value is guaranteed for every buyer.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("product-led first value" in item for item in violations)


def test_fails_on_first_15_language_without_tb_1030_anchor(repo_root: Path) -> None:
    _write_contract(repo_root)
    _write_procurement(repo_root)
    positioning = repo_root / "docs/go-to-market/POSITIONING.md"
    positioning.parent.mkdir(parents=True, exist_ok=True)
    positioning.write_text("Buyers get decision signal in one sitting on day one always.\n", encoding="utf-8")
    violations = GUARD(repo_root)
    assert any("without TB-1030" in item for item in violations)
