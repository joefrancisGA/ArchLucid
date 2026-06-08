#!/usr/bin/env python3
"""Guard cross-surface ROI scope labels and anti-false-equality wording (T2-3)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]

_REQUIRED_SCOPE_SNIPPETS: tuple[str, ...] = (
    "disposition-aware",
    "do not sum",
    "Not comparable",
    "Distinct from executive-summary",
    "counts only",
    "not usd savings",
)

_FORBIDDEN_EQUALITY_PHRASES: tuple[str, ...] = (
    "executive-summary totals equal value-report",
    "portfolio headline equals per-system rows",
    "cross-tenant headline is directly comparable to single-tenant headline",
)

_DOC_TARGETS: tuple[str, ...] = (
    "docs/library/PILOT_SCORECARD_API.md",
    "docs/go-to-market/ROI_MODEL.md",
    "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
    "docs/runbooks/SPONSOR_PACKET.md",
)

_OPENAPI_FIELD_RE = re.compile(
    r"headlineSavingsScope(Description|Code)|systemRowSavingsScopeDescription|portfolioScopeDescription",
    re.IGNORECASE,
)


def repo_root() -> Path:
    return _REPO


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

    for path in (labeler, descriptions):
        if not path.is_file():
            errors.append(f"{path.relative_to(root)}: missing ROI scope label source")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")

        if "ApplyExecutiveRoiSummary" not in text and path.name.endswith("ScopeLabeler.cs"):
            errors.append("RoiSponsorFacingScopeLabeler.cs: missing ApplyExecutiveRoiSummary")

        if "CrossTenantPortfolioHeadline" not in text and path.name.endswith("ScopeDescriptions.cs"):
            errors.append("RoiSponsorFacingScopeDescriptions.cs: missing cross-tenant scope text")

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    args = parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []
    errors.extend(check_docs(root))
    errors.extend(check_openapi_snapshot(root))
    errors.extend(check_scope_labeler_source(root))

    if errors:
        for error in sorted(set(errors)):
            print(error, file=sys.stderr)

        return 1

    print("check_roi_surface_consistency: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
