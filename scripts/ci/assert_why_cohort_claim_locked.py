"""TB-266: /why golden-cohort claim must disclose baseline lock when fingerprints are placeholders."""

from __future__ import annotations

import importlib.util
import json
import pathlib
import re
import sys

_CI_DIR = pathlib.Path(__file__).resolve().parent
_PLACEHOLDER_SHA = "0" * 64
_PENDING_PHRASE = "(baseline lock pending)"


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


def _baseline_still_placeholder(repo_root: pathlib.Path) -> bool:
    constants_path = repo_root / "ArchLucid.Core/GoldenCorpus/GoldenCohortBaselineConstants.cs"
    cohort_path = repo_root / "tests/golden-cohort/cohort.json"

    if constants_path.is_file():
        text = constants_path.read_text(encoding="utf-8")

        if _PLACEHOLDER_SHA in text:
            return True

    if cohort_path.is_file():
        payload = json.loads(cohort_path.read_text(encoding="utf-8"))
        manifest_sha = payload.get("expectedManifestSha256")

        if isinstance(manifest_sha, str) and manifest_sha.strip() == _PLACEHOLDER_SHA:
            return True

    return False


def _row_asserts_deterministic_drift(claim: str, narrative: str) -> bool:
    combined = f"{claim} {narrative}".lower()

    return "deterministic drift" in combined or "golden-cohort" in claim.lower()


def main() -> int:
    sync = _load_sync_module()
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    ts_path = repo_root / sync.TS_RELATIVE

    if not _baseline_still_placeholder(repo_root):
        print("OK: golden-cohort baseline is locked; cohort-claim guard skipped.")

        return 0

    try:
        rows = sync._extract_ts_rows(sync._read_text(ts_path))
    except (FileNotFoundError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)

        return 2

    if len(rows) < 4:
        print(f"error: expected at least 4 rows in {sync.TS_RELATIVE}.", file=sys.stderr)

        return 1

    claim, _, _, _, narrative = rows[3]

    if not _row_asserts_deterministic_drift(claim, narrative):
        print("OK: row 4 does not assert a locked cohort while baseline is placeholder.")

        return 0

    if _PENDING_PHRASE not in narrative:
        print(
            "error: row 4 asserts deterministic drift detection but narrative omits "
            f"'{_PENDING_PHRASE}' while GoldenCohortBaselineConstants is still placeholder.",
            file=sys.stderr,
        )

        return 1

    print("OK: row 4 discloses baseline lock pending while cohort fingerprints are placeholders.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
