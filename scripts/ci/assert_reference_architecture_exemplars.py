#!/usr/bin/env python3
"""Guard reference-architecture exemplar JSON against README drift and duplicate fingerprints."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
EXEMPLAR_DIR = REPO_ROOT / "templates" / "reference-architectures"
README = EXEMPLAR_DIR / "README.md"

README_LINK_PATTERN = re.compile(r"\[`([^`]+\.json)`\]\(([^)]+\.json)\)")
REQUIRED_FIELDS = ("requestId", "systemName", "description", "cloudProvider", "constraints")
PII_PATTERNS = (
    re.compile(r"@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}"),
    re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE),
)


def _indexed_json_files(exemplar_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in exemplar_dir.glob("*.json")
        if path.is_file() and not path.name.endswith(".request.json")
    )


def _parse_readme_indexed_files(readme_path: Path) -> set[str]:
    if not readme_path.is_file():
        raise FileNotFoundError(f"missing README: {readme_path}")

    text = readme_path.read_text(encoding="utf-8")
    linked = {match.group(1) for match in README_LINK_PATTERN.finditer(text)}
    hrefs = {match.group(2) for match in README_LINK_PATTERN.finditer(text)}
    if linked != hrefs:
        mismatched = sorted(linked.symmetric_difference(hrefs))
        raise ValueError(f"README link text/href mismatch for: {', '.join(mismatched)}")

    return linked


def _load_exemplar(path: Path) -> dict[str, object]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict):
        raise ValueError(f"{path.name}: root must be a JSON object")
    return document


def _fingerprint(document: dict[str, object]) -> tuple[str, str]:
    system_name = str(document.get("systemName") or "").strip().casefold()
    cloud = str(document.get("cloudProvider") or "").strip().casefold()
    return system_name, cloud


def _scan_pii(path: Path, document: dict[str, object]) -> list[str]:
    failures: list[str] = []
    serialized = json.dumps(document, ensure_ascii=False)
    for pattern in PII_PATTERNS:
        if pattern.search(serialized):
            failures.append(f"{path.name}: possible email/PII pattern in JSON")
            break
    return failures


def verify(exemplar_dir: Path = EXEMPLAR_DIR, readme_path: Path = README) -> list[str]:
    failures: list[str] = []
    readme_files = _parse_readme_indexed_files(readme_path)
    disk_files = {path.name for path in _indexed_json_files(exemplar_dir)}

    missing_readme = sorted(disk_files - readme_files)
    missing_disk = sorted(readme_files - disk_files)
    for name in missing_readme:
        failures.append(f"{name}: indexed JSON on disk but missing from README matrix")
    for name in missing_disk:
        failures.append(f"{name}: listed in README but file missing")

    fingerprints: dict[tuple[str, str], str] = {}
    for path in _indexed_json_files(exemplar_dir):
        try:
            document = _load_exemplar(path)
        except (json.JSONDecodeError, ValueError) as exc:
            failures.append(f"{path.name}: {exc}")
            continue

        for field in REQUIRED_FIELDS:
            if field not in document:
                failures.append(f"{path.name}: missing required field {field!r}")
            elif field == "constraints":
                constraints = document.get("constraints")
                if not isinstance(constraints, list) or len(constraints) < 2:
                    failures.append(f"{path.name}: constraints must be a list with at least 2 entries")
            elif not str(document.get(field) or "").strip():
                failures.append(f"{path.name}: required field {field!r} is empty")

        failures.extend(_scan_pii(path, document))

        fingerprint = _fingerprint(document)
        if not fingerprint[0] or not fingerprint[1]:
            failures.append(f"{path.name}: systemName and cloudProvider required for fingerprint")
            continue

        prior = fingerprints.get(fingerprint)
        if prior is not None:
            failures.append(
                f"{path.name}: duplicate systemName+cloudProvider fingerprint with {prior} "
                f"({fingerprint[0]!r}, {fingerprint[1]!r})",
            )
        else:
            fingerprints[fingerprint] = path.name

    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exemplar-dir", type=Path, default=EXEMPLAR_DIR)
    parser.add_argument("--readme", type=Path, default=README)
    args = parser.parse_args()

    failures = verify(args.exemplar_dir.resolve(), args.readme.resolve())
    if failures:
        for failure in failures:
            print(f"::error::{failure}", file=sys.stderr)
        return 1

    print(
        f"assert_reference_architecture_exemplars: OK "
        f"({len(_indexed_json_files(args.exemplar_dir.resolve()))} exemplar file(s))",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
