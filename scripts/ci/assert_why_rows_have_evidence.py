"""CI guard: every /why differentiation row must carry non-empty evidence fields.

Fails if ``claim``, ``archlucidEvidence``, ``competitorBaseline``, ``citation``, or
``narrativeParagraph`` is empty after trim in ``WHY_ARCHLUCID_COMPARISON_ROWS``.

Uses the same row extraction as ``check_why_archlucid_comparison_sync.py`` so field
parsing stays single-sourced.

Usage:
    python scripts/ci/assert_why_rows_have_evidence.py
"""

from __future__ import annotations

import importlib.util
import pathlib
import re
import sys

_CI_DIR = pathlib.Path(__file__).resolve().parent

_FIRST_PARTY_CITATION = "first-party assertion (no external citation yet)"
_ILLUSTRATIVE_MARKER = "illustrative, not benchmarked"
_QUANTIFIED_COMPETITOR_RE = re.compile(
    r"\d|hour|hours|day|days|week|weeks|%|percent",
    re.IGNORECASE,
)


def _competitor_baseline_needs_external_citation(baseline: str) -> bool:
    return bool(_QUANTIFIED_COMPETITOR_RE.search(baseline))


def _citation_is_acceptable_for_quantified_baseline(citation: str, baseline: str) -> bool:
    if _ILLUSTRATIVE_MARKER in baseline.lower():
        return True

    normalized = citation.strip().lower()

    if normalized.startswith("https://") and _FIRST_PARTY_CITATION not in normalized:
        return True

    return False


def _load_sync_module():
    spec = importlib.util.spec_from_file_location(
        "check_why_archlucid_comparison_sync",
        _CI_DIR / "check_why_archlucid_comparison_sync.py",
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load check_why_archlucid_comparison_sync module spec.")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module


def main() -> int:
    sync = _load_sync_module()
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    ts_path = repo_root / sync.TS_RELATIVE

    try:
        rows = sync._extract_ts_rows(sync._read_text(ts_path))
    except (FileNotFoundError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)

        return 2

    if len(rows) != 5:
        print(
            f"error: expected exactly 5 differentiation rows, found {len(rows)} in {sync.TS_RELATIVE}.",
            file=sys.stderr,
        )

        return 1

    for index, row in enumerate(rows):
        for field, value in zip(sync.ROW_FIELDS, row):
            if not value.strip():
                print(
                    f"error: row {index} field '{field}' is empty in {sync.TS_RELATIVE}.",
                    file=sys.stderr,
                )

                return 1

        claim, _, competitor_baseline, citation, narrative = row

        if _competitor_baseline_needs_external_citation(competitor_baseline):
            if not _citation_is_acceptable_for_quantified_baseline(citation, competitor_baseline):
                print(
                    f"error: row {index} competitorBaseline is quantified but citation is not HTTPS "
                    f"and baseline is not marked illustrative in {sync.TS_RELATIVE}.",
                    file=sys.stderr,
                )

                return 1

        if "deterministic drift" in f"{claim} {narrative}".lower():
            if _ILLUSTRATIVE_MARKER not in narrative.lower() and "(baseline lock pending)" not in narrative.lower():
                print(
                    f"error: row {index} asserts deterministic drift without baseline-lock disclosure "
                    f"in narrative in {sync.TS_RELATIVE}.",
                    file=sys.stderr,
                )

                return 1

    print(f"OK: {len(rows)} /why rows have non-empty evidence fields in {sync.TS_RELATIVE}.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
