from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

_CI = Path(__file__).resolve().parents[1]


def _load_guard(module_name: str, fn_name: str):
    script = _CI / f"{module_name}"
    spec = importlib.util.spec_from_file_location(module_name.replace(".py", ""), script)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return getattr(module, fn_name)


SEE_IT_HONESTY = _load_guard("check_see_it_universe_honesty.py", "see_it_universe_honesty_violations")


@pytest.fixture()
def repo_root(tmp_path: Path) -> Path:
    return tmp_path


def test_passes_when_contract_and_see_it_are_honest(repo_root: Path) -> None:
    contract = repo_root / "docs/library/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md"
    contract.parent.mkdir(parents=True)
    contract.write_text(
        "\n".join(
            [
                "**TB-1028**",
                "**TB-1029**",
                "Enterprise customer intake",
                "check_see_it_universe_honesty.py",
                "see-it-universe-honesty.test.ts",
            ]
        ),
        encoding="utf-8",
    )
    universe = repo_root / "archlucid-ui/src/app/(marketing)/see-it/see-it-demo-universe.ts"
    universe.parent.mkdir(parents=True)
    universe.write_text(
        'if (scenario?.slug === "claims-intake") {\n'
        '  return "Healthcare claims sample — public evaluation preview";\n'
        '}\n'
        'return "Enterprise customer intake sample — public evaluation preview";\n',
        encoding="utf-8",
    )
    hero = repo_root / "archlucid-ui/src/app/(marketing)/see-it/SeeItHeroSection.tsx"
    hero.write_text(
        '<Link href="/showcase/customer-intake-modernization">Open sample</Link>\n',
        encoding="utf-8",
    )
    assert SEE_IT_HONESTY(repo_root) == []


def test_fails_on_healthcare_claims_hero_without_guard(repo_root: Path) -> None:
    contract = repo_root / "docs/library/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md"
    contract.parent.mkdir(parents=True)
    contract.write_text("**TB-1028** **TB-1029** Enterprise customer intake check_see_it_universe_honesty.py see-it-universe-honesty.test.ts", encoding="utf-8")
    universe = repo_root / "archlucid-ui/src/app/(marketing)/see-it/see-it-demo-universe.ts"
    universe.parent.mkdir(parents=True)
    universe.write_text('return "Enterprise customer intake sample";\n', encoding="utf-8")
    preview = repo_root / "archlucid-ui/src/app/(marketing)/see-it/SeeItDeliverablePreview.tsx"
    preview.write_text("Healthcare Claims intake modernization\n", encoding="utf-8")
    violations = SEE_IT_HONESTY(repo_root)
    assert any("Healthcare Claims hero chrome" in item for item in violations)


def test_fails_on_demo_preview_deep_link(repo_root: Path) -> None:
    contract = repo_root / "docs/library/MARKETING_STATIC_VS_LIVE_DEMO_BOUNDARY_CONTRACT.md"
    contract.parent.mkdir(parents=True)
    contract.write_text("**TB-1028** **TB-1029** Enterprise customer intake check_see_it_universe_honesty.py see-it-universe-honesty.test.ts", encoding="utf-8")
    universe = repo_root / "archlucid-ui/src/app/(marketing)/see-it/see-it-demo-universe.ts"
    universe.parent.mkdir(parents=True)
    universe.write_text('return "Enterprise customer intake sample";\n', encoding="utf-8")
    body = repo_root / "archlucid-ui/src/app/(marketing)/see-it/SeeItMarketingBody.tsx"
    body.write_text('<a href="/demo/preview">Preview</a>\n', encoding="utf-8")
    violations = SEE_IT_HONESTY(repo_root)
    assert any("/demo/preview" in item for item in violations)
