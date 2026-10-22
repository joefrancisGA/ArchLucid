#!/usr/bin/env python3
"""Guard cross-surface ROI scope labels and anti-false-equality wording (T2-3)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]

_REQUIRED_SCOPE_SNIPPETS: tuple[str, ...] = (
    "disposition-aware",
    "do not sum",
    "Not comparable",
    "Distinct from sponsor-report",
    "counts only",
    "not usd savings",
)

_FORBIDDEN_EQUALITY_PHRASES: tuple[str, ...] = (
    "sponsor-report totals equal value-report",
    "portfolio headline equals per-system rows",
    "cross-tenant headline is directly comparable to single-tenant headline",
)

_DOC_TARGETS: tuple[str, ...] = (
    "docs/library/PILOT_SCORECARD_API.md",
    "docs/go-to-market/ROI_MODEL.md",
    "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
    "docs/runbooks/SPONSOR_PACKET.md",
)

_MANIFEST_RELATIVE = Path("fixtures/roi/roi-sponsor-facing-scope-labels.v1.json")
_UI_MANIFEST_RELATIVE = Path("archlucid-ui/src/lib/data/roi-sponsor-facing-scope-labels.v1.json")

_OPENAPI_FIELD_RE = re.compile(
    r"headlineSavingsScope(Description|Code)|systemRowSavingsScopeDescription|portfolioScopeDescription",
    re.IGNORECASE,
)

_DESCRIPTION_FIELD_MAP: tuple[tuple[str, str], ...] = (
    ("HeadlineDispositionAware", "headlineDispositionAware"),
    ("SystemRowSnapshotPotential", "systemRowSnapshotPotential"),
    ("CrossTenantPortfolioHeadline", "crossTenantPortfolioHeadline"),
    ("Trailing30DayFindingEvents", "trailing30DayFindingEvents"),
    ("ValueReportActivityWindowGeneric", "valueReportActivityWindowGeneric"),
    ("PilotScorecardUtcWindowGeneric", "pilotScorecardUtcWindowGeneric"),
)


def repo_root() -> Path:
    return _REPO


def load_manifest(root: Path) -> dict:
    path = root / _MANIFEST_RELATIVE

    if not path.is_file():
        raise FileNotFoundError(str(path))

    return json.loads(path.read_text(encoding="utf-8"))


def check_docs(root: Path) -> list[str]:
    errors: list[str] = []

    for relative in _DOC_TARGETS:
        path = root / relative

        if not path.is_file():
            errors.append(f"{relative}: missing ROI consistency doc target")
            continue

        text = path.read_text(encoding="utf-8", errors="replace").lower()

        for phrase in _FORBIDDEN_EQUALITY_PHRASES:
            if phrase.lower() in text:
                errors.append(f"{relative}: forbidden false-equality phrase: {phrase}")

        if relative.endswith("ROI_MODEL.md"):
            continue

        if "scope" not in text and "disposition" not in text:
            errors.append(f"{relative}: missing scope/disposition labeling guidance")

    roi_model = (root / "docs/go-to-market/ROI_MODEL.md").read_text(encoding="utf-8", errors="replace").lower()

    for snippet in _REQUIRED_SCOPE_SNIPPETS:
        if snippet.lower() not in roi_model:
            errors.append(f"docs/go-to-market/ROI_MODEL.md: missing required scope snippet: {snippet}")

    return errors


def check_openapi_snapshot(root: Path) -> list[str]:
    errors: list[str] = []
    snapshot = root / "ArchLucid.Api.Tests" / "Contracts" / "openapi-v1.contract.snapshot.json"

    if not snapshot.is_file():
        return ["openapi/v1/openapi.v1.json: missing contract snapshot"]

    text = snapshot.read_text(encoding="utf-8", errors="replace")

    if not _OPENAPI_FIELD_RE.search(text):
        errors.append("openapi snapshot: missing headlineSavingsScope* fields on ROI surfaces")

    return errors


def check_scope_labeler_source(root: Path) -> list[str]:
    errors: list[str] = []
    labeler = root / "ArchLucid.Application" / "Roi" / "RoiSponsorFacingScopeLabeler.cs"
    descriptions = root / "ArchLucid.Contracts" / "Roi" / "RoiSponsorFacingScopeDescriptions.cs"
    ui_labels = root / "archlucid-ui" / "src" / "lib" / "roi-sponsor-scope-labels.ts"

    for path in (labeler, descriptions):
        if not path.is_file():
            errors.append(f"{path.relative_to(root)}: missing ROI scope label source")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if "ApplySponsorRoiSummary" not in text and path.name.endswith("ScopeLabeler.cs"):
            errors.append("RoiSponsorFacingScopeLabeler.cs: missing ApplySponsorRoiSummary")

        if "CrossTenantPortfolioHeadline" not in text and path.name.endswith("ScopeDescriptions.cs"):
            errors.append("RoiSponsorFacingScopeDescriptions.cs: missing cross-tenant scope text")

    if not ui_labels.is_file():
        errors.append(f"{ui_labels.relative_to(root)}: missing ROI scope label helper")
    else:
        ui_text = ui_labels.read_text(encoding="utf-8", errors="replace")

        if "roi-sponsor-facing-scope-labels.v1.json" not in ui_text:
            errors.append("roi-sponsor-scope-labels.ts: must import canonical ROI scope manifest JSON")

        if "Portfolio headline:" in ui_text or "Per-system rows are pre-disposition" in ui_text:
            errors.append("roi-sponsor-scope-labels.ts: inline fallback copy detected; use manifest JSON")

    return errors


def check_manifest_parity(root: Path) -> list[str]:
    errors: list[str] = []

    try:
        manifest = load_manifest(root)
    except FileNotFoundError as exc:
        return [f"{_MANIFEST_RELATIVE.as_posix()}: missing canonical ROI scope manifest ({exc})"]

    fixture_path = root / _MANIFEST_RELATIVE
    ui_path = root / _UI_MANIFEST_RELATIVE

    if not ui_path.is_file():
        errors.append(f"{_UI_MANIFEST_RELATIVE.as_posix()}: missing UI ROI scope manifest copy")
    elif fixture_path.read_text(encoding="utf-8").replace("\r\n", "\n").strip() != ui_path.read_text(
        encoding="utf-8"
    ).replace("\r\n", "\n").strip():
        errors.append("ROI scope manifest drift: fixtures/roi and archlucid-ui/src/lib/data copies differ")

    descriptions_cs = root / "ArchLucid.Contracts" / "Roi" / "RoiSponsorFacingScopeDescriptions.cs"

    if not descriptions_cs.is_file():
        return errors + [f"{descriptions_cs.relative_to(root)}: missing contract descriptions"]

    cs_text = descriptions_cs.read_text(encoding="utf-8", errors="replace")
    manifest_descriptions = manifest.get("descriptions", {})

    for csharp_field, manifest_key in _DESCRIPTION_FIELD_MAP:
        expected = manifest_descriptions.get(manifest_key)

        if not expected:
            errors.append(f"manifest descriptions.{manifest_key}: missing entry")
            continue

        if expected not in cs_text:
            errors.append(
                f"RoiSponsorFacingScopeDescriptions.{csharp_field} drifted from manifest descriptions.{manifest_key}"
            )

    non_additivity = manifest.get("nonAdditivityCaveat")

    if not non_additivity:
        errors.append("manifest nonAdditivityCaveat: missing entry")
    elif non_additivity not in cs_text:
        errors.append("RoiSponsorFacingScopeDescriptions.NonAdditivityCaveat drifted from manifest")

    export_markdown = root / "archlucid-ui" / "src" / "lib" / "sponsor-report-markdown.ts"

    if export_markdown.is_file():
        export_text = export_markdown.read_text(encoding="utf-8", errors="replace")

        if "ROI_NON_ADDITIVITY_CAVEAT" not in export_text:
            errors.append("sponsor-report-markdown.ts: missing non-additivity caveat export")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    args = parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []
    errors.extend(check_docs(root))
    errors.extend(check_openapi_snapshot(root))
    errors.extend(check_scope_labeler_source(root))
    errors.extend(check_manifest_parity(root))

    if errors:
        for error in sorted(set(errors)):
            print(error, file=sys.stderr)

        return 1

    print("check_roi_surface_consistency: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
