#!/usr/bin/env python3
"""Verify technology-consistency golden corpus manifest and required scenario files."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CORPUS_ROOT = REPO_ROOT / "tests" / "technology-consistency-corpus"

REQUIRED_FINDING_ENGINE = (
    "finding-engine/azure-coherent-baseline",
    "finding-engine/aws-coherent-baseline",
    "finding-engine/cloud-neutral-coherent-baseline",
    "finding-engine/cross-family-drift-azure-rds",
    "finding-engine/duplicate-chosen-primary-datastore",
    "finding-engine/missing-chosen-cloud-platform",
    "finding-engine/cloud-neutral-hyperscaler-leak",
    "finding-engine/locked-chosen-overridden-by-assumed",
    "finding-engine/revision-coherent-to-drift",
)

REQUIRED_ARTIFACT_LINT = (
    "artifact-lint/azure-prose-aligned",
    "artifact-lint/prose-hyperscaler-mismatch",
    "artifact-lint/cloud-neutral-prose-leak",
    "artifact-lint/unledgered-hyperscaler-token",
)


def _load_manifest(corpus_root: Path) -> list[dict[str, str]]:
    manifest_path = corpus_root / "manifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"missing manifest: {manifest_path}")

    document = json.loads(manifest_path.read_text(encoding="utf-8"))
    scenarios = document.get("scenarios")
    if not isinstance(scenarios, list) or not scenarios:
        raise ValueError("manifest.json must contain a non-empty scenarios array")

    return scenarios


def _verify_scenario_files(corpus_root: Path, relative_path: str, kind: str) -> list[str]:
    failures: list[str] = []
    scenario_dir = corpus_root / relative_path

    if not scenario_dir.is_dir():
        return [f"{relative_path}: scenario directory missing"]

    if kind == "finding-engine":
        if relative_path.endswith("revision-coherent-to-drift"):
            required = ("ledger-v1.json", "ledger-v2.json", "expected-v1.json", "expected-v2.json")
        else:
            required = ("ledger.json", "expected.json")
    elif kind == "artifact-lint":
        required = ("ledger.json", "artifact.md", "expected.json")
    else:
        return [f"{relative_path}: unknown scenario kind {kind!r}"]

    for name in required:
        if not (scenario_dir / name).is_file():
            failures.append(f"{relative_path}: missing required file {name}")

    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--corpus-root",
        type=Path,
        default=CORPUS_ROOT,
        help="Corpus root (default: tests/technology-consistency-corpus)",
    )
    args = parser.parse_args()
    corpus_root: Path = args.corpus_root.resolve()
    failures: list[str] = []

    try:
        scenarios = _load_manifest(corpus_root)
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        return 1

    manifest_paths = {str(entry.get("path") or "") for entry in scenarios if isinstance(entry, dict)}
    manifest_paths.discard("")

    for required in (*REQUIRED_FINDING_ENGINE, *REQUIRED_ARTIFACT_LINT):
        if required not in manifest_paths:
            failures.append(f"manifest missing required scenario path: {required}")

    for entry in scenarios:
        if not isinstance(entry, dict):
            failures.append("manifest contains a non-object scenario entry")
            continue

        kind = str(entry.get("kind") or "")
        relative_path = str(entry.get("path") or "")
        if not kind or not relative_path:
            failures.append("manifest scenario entry must include kind and path")
            continue

        failures.extend(_verify_scenario_files(corpus_root, relative_path, kind))

    if failures:
        for line in failures:
            print(f"::error::{line}", file=sys.stderr)
        return 1

    print(f"technology consistency corpus OK ({len(scenarios)} scenarios)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
