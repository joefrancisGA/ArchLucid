#!/usr/bin/env python3
"""Validate offline agent eval datasets and prompt-injection regression fixtures.

Shape-only checks (no live LLM or simulator runs). CI uses selective flags to keep
failures localized to the dataset family under test.

See also: ``scripts/ci/eval_agent_corpus.py`` for the synthetic **tests/eval-corpus**
slice (recall + optional committed simulator AgentResult JSON).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_manifest() -> int:
    root = _repo_root()
    base = root / "tests" / "eval-datasets"
    manifest_path = base / "manifest.json"

    if not manifest_path.is_file():
        print(f"::error::Missing {manifest_path}")
        return 1

    manifest = _load_json(manifest_path)
    if not isinstance(manifest, dict):
        print("::error::manifest.json must be an object")
        return 1

    if manifest.get("schemaVersion") != 1:
        print("::error::manifest.schemaVersion must be 1")
        return 1

    datasets = manifest.get("datasets")
    if not isinstance(datasets, list) or not datasets:
        print("::error::manifest.datasets must be a non-empty array")
        return 1

    for entry in datasets:
        if not isinstance(entry, dict):
            print("::error::each manifest.datasets entry must be an object")
            return 1

        kind = entry.get("agentKind")
        rel = entry.get("relativePath")
        minimum = entry.get("minCases")

        if not isinstance(kind, str) or not kind.strip():
            print("::error::dataset.agentKind required")
            return 1

        if not isinstance(rel, str) or not rel.strip():
            print("::error::dataset.relativePath required")
            return 1

        if not isinstance(minimum, int) or minimum < 1:
            print("::error::dataset.minCases must be a positive int")
            return 1

        data_path = base / rel
        if not data_path.is_file():
            print(f"::error::Missing dataset file {data_path}")
            return 1

        cases = _load_json(data_path)
        if not isinstance(cases, list):
            print(f"::error::{rel} must be a JSON array")
            return 1

        if len(cases) < minimum:
            print(f"::error::{rel} has {len(cases)} cases; minCases={minimum}")
            return 1

        for i, case in enumerate(cases):
            if not isinstance(case, dict):
                print(f"::error::{rel}[{i}] must be an object")
                return 1

            if "id" not in case or not isinstance(case["id"], str):
                print(f"::error::{rel}[{i}].id must be a string")
                return 1

            expect = case.get("expect")
            if not isinstance(expect, dict):
                print(f"::error::{rel}[{i}].expect must be an object")
                return 1

            for key in ("minFindings", "maxFindings"):
                if key not in expect or not isinstance(expect[key], int):
                    print(f"::error::{rel}[{i}].expect.{key} must be int")
                    return 1

            if expect["minFindings"] > expect["maxFindings"]:
                print(f"::error::{rel}[{i}].expect minFindings > maxFindings")
                return 1

    print(f"Eval dataset manifest OK: {len(datasets)} dataset(s).")
    return 0


def validate_prompt_injection_datasets() -> int:
    root = _repo_root()
    folder = root / "tests" / "eval-datasets" / "prompt-injection"

    if not folder.is_dir():
        print(f"::error::Missing directory {folder}")
        return 1

    allowed_categories = {"direct_override", "exfiltration", "tool_abuse"}
    paths = sorted(folder.glob("*.json"))

    if not paths:
        print(f"::error::No JSON files under {folder}")
        return 1

    for path in paths:
        data = _load_json(path)

        if not isinstance(data, list) or not data:
            print(f"::error::{path.name} must be a non-empty JSON array")
            return 1

        for i, case in enumerate(data):
            if not isinstance(case, dict):
                print(f"::error::{path.name}[{i}] must be an object")
                return 1

            cid = case.get("id")
            if not isinstance(cid, str) or not cid.strip():
                print(f"::error::{path.name}[{i}].id must be a non-empty string")
                return 1

            cat = case.get("category")
            if not isinstance(cat, str) or cat.strip() not in allowed_categories:
                print(
                    f"::error::{path.name}[{i}].category must be one of "
                    f"{sorted(allowed_categories)}"
                )
                return 1

            prompt = case.get("userPrompt")
            if not isinstance(prompt, str) or len(prompt.strip()) < 8:
                print(f"::error::{path.name}[{i}].userPrompt must be a substantive string")
                return 1

    print(f"Prompt injection eval datasets OK: {len(paths)} file(s).")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Offline eval dataset validation.")
    parser.add_argument(
        "--manifest-only",
        action="store_true",
        help="Validate only tests/eval-datasets/manifest.json agent datasets.",
    )
    parser.add_argument(
        "--prompt-injection-only",
        action="store_true",
        help="Validate only tests/eval-datasets/prompt-injection/*.json fixtures.",
    )
    args = parser.parse_args()

    if args.manifest_only and args.prompt_injection_only:
        print("::error::Choose at most one of --manifest-only and --prompt-injection-only")
        return 1

    if args.prompt_injection_only:
        return validate_prompt_injection_datasets()

    if args.manifest_only:
        return validate_manifest()

    m = validate_manifest()
    if m != 0:
        return m

    p = validate_prompt_injection_datasets()
    if p != 0:
        return p

    return 0


if __name__ == "__main__":
    sys.exit(main())
