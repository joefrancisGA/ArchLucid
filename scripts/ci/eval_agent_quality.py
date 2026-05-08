#!/usr/bin/env python3
"""Validate offline agent eval datasets and prompt-injection regression fixtures.

Shape-only checks (no live LLM or simulator runs). CI uses selective flags to keep
failures localized to the dataset family under test.

Optional ``--enforce-prompt-injection-block-layer`` runs
``PromptInjectionExecutableRegressionTests`` in ``ArchLucid.AgentRuntime.Tests``
after shape validation (requires a prior ``dotnet build -c Release``).

See also: ``scripts/ci/eval_agent_corpus.py`` for the synthetic **tests/eval-corpus**
slice (recall + optional committed simulator AgentResult JSON).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_manifest(*, strict: bool = False) -> int:
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

    schema_version = manifest.get("schemaVersion")
    if schema_version not in (1, 2):
        print("::error::manifest.schemaVersion must be 1 or 2")
        return 1

    if strict and schema_version != 2:
        print("::error::--strict requires manifest.schemaVersion == 2")
        return 1

    min_required_categories = manifest.get("minRequiredCategories")
    if schema_version == 2:
        if not isinstance(min_required_categories, int) or min_required_categories < 1:
            print("::error::manifest.minRequiredCategories must be a positive int for schemaVersion 2")
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

            ctx = case.get("architecturalContext")
            if strict:
                if not isinstance(ctx, dict) or not ctx:
                    print(f"::error::{rel}[{i}].architecturalContext must be a non-empty object (--strict)")
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

            if strict:
                req = expect.get("requiredCategories")
                forb = expect.get("forbiddenCategories")
                if not isinstance(req, list) or not req or not all(isinstance(x, str) and x.strip() for x in req):
                    print(f"::error::{rel}[{i}].expect.requiredCategories must be a non-empty string array (--strict)")
                    return 1

                if not isinstance(forb, list) or not all(isinstance(x, str) for x in forb):
                    print(
                        f"::error::{rel}[{i}].expect.forbiddenCategories must be a string array (--strict)"
                    )
                    return 1

                if len(req) < min_required_categories:
                    print(
                        f"::error::{rel}[{i}] must list at least manifest.minRequiredCategories requiredCategories"
                    )
                    return 1

    print(f"Eval dataset manifest OK: {len(datasets)} dataset(s).")
    return 0


def validate_prompt_injection_datasets(*, strict: bool = False) -> int:
    root = _repo_root()
    base = root / "tests" / "eval-datasets"
    folder = base / "prompt-injection"

    if not folder.is_dir():
        print(f"::error::Missing directory {folder}")
        return 1

    allowed_categories = {
        "direct_override",
        "exfiltration",
        "tool_abuse",
        # OWASP LLM Top 10–aligned labels (offline deterministic gates; original fixture phrasing).
        "indirect_injection",
        "obfuscated_encoding",
        "sensitive_information_disclosure",
    }
    allowed_blocked = {"precheck", "redactor", "evaluator", "judge"}
    paths = sorted(folder.glob("*.json"))

    if not paths:
        print(f"::error::No JSON files under {folder}")
        return 1

    manifest_paths: list[str] | None = None
    min_total_cases: int | None = None

    if strict:
        manifest_path = base / "manifest.json"

        if not manifest_path.is_file():
            print(f"::error::Missing {manifest_path} (required for --strict prompt-injection)")
            return 1

        manifest = _load_json(manifest_path)

        if not isinstance(manifest, dict):
            print("::error::manifest.json must be an object for prompt-injection registry checks")
            return 1

        pir = manifest.get("promptInjectionRegression")

        if not isinstance(pir, dict):
            print(
                "::error::manifest.promptInjectionRegression object required (--strict prompt-injection)"
            )
            return 1

        raw_paths = pir.get("relativePaths")

        if not isinstance(raw_paths, list) or not raw_paths or not all(
            isinstance(p, str) and p.strip() for p in raw_paths
        ):
            print(
                "::error::manifest.promptInjectionRegression.relativePaths must be a non-empty string array"
            )
            return 1

        manifest_paths = sorted(str(Path(p).as_posix()) for p in raw_paths)
        actual_paths = sorted(str(p.relative_to(base)).replace("\\", "/") for p in paths)

        if manifest_paths != actual_paths:
            print(
                "::error::prompt-injection JSON set must match manifest.promptInjectionRegression.relativePaths exactly.\n"
                f"  manifest: {manifest_paths}\n"
                f"  on disk: {actual_paths}"
            )
            return 1

        mtc = pir.get("minTotalCases")

        if isinstance(mtc, int) and mtc >= 1:
            min_total_cases = mtc

    total_cases = 0

    for path in paths:
        data = _load_json(path)

        if not isinstance(data, list) or not data:
            print(f"::error::{path.name} must be a non-empty JSON array")
            return 1

        total_cases += len(data)

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

            if strict:
                blocked_at = case.get("expectedBlockedAt")
                if not isinstance(blocked_at, str) or blocked_at.strip() not in allowed_blocked:
                    print(
                        f"::error::{path.name}[{i}].expectedBlockedAt must be one of "
                        f"{sorted(allowed_blocked)} (--strict)"
                    )
                    return 1

            prompt = case.get("userPrompt")
            if not isinstance(prompt, str) or len(prompt.strip()) < 8:
                print(f"::error::{path.name}[{i}].userPrompt must be a substantive string")
                return 1

    if strict and min_total_cases is not None and total_cases < min_total_cases:
        print(
            f"::error::prompt-injection regression has {total_cases} cases; "
            f"manifest.promptInjectionRegression.minTotalCases={min_total_cases}"
        )
        return 1

    print(f"Prompt injection eval datasets OK: {len(paths)} file(s).")
    return 0


def enforce_prompt_injection_executable_regression(*, root: Path) -> int:
    """Runs PromptInjectionExecutableRegressionTests (requires a prior Release build)."""
    test_proj = root / "ArchLucid.AgentRuntime.Tests" / "ArchLucid.AgentRuntime.Tests.csproj"

    if not test_proj.is_file():
        print(f"::error::Missing test project {test_proj}")
        return 1

    cmd = [
        "dotnet",
        "test",
        str(test_proj),
        "--no-build",
        "-c",
        "Release",
        "--filter",
        "FullyQualifiedName~PromptInjectionExecutableRegressionTests",
    ]

    print(f"Running {' '.join(cmd)}")

    proc = subprocess.run(cmd, cwd=str(root), check=False)

    if proc.returncode != 0:
        print(
            "::error::Prompt injection executable regression failed "
            "(run `dotnet build ArchLucid.sln -c Release` then retry)."
        )
        return proc.returncode or 1

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
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Require manifest schema v2 architecturalContext / category gates and prompt-injection expectedBlockedAt.",
    )
    parser.add_argument(
        "--enforce-prompt-injection-block-layer",
        action="store_true",
        help=(
            "After validating prompt-injection fixtures, run dotnet test on "
            "PromptInjectionExecutableRegressionTests (needs Release build + --no-build)."
        ),
    )
    args = parser.parse_args()

    if args.manifest_only and args.prompt_injection_only:
        print("::error::Choose at most one of --manifest-only and --prompt-injection-only")
        return 1

    if args.enforce_prompt_injection_block_layer and not args.strict:
        print("::error::--enforce-prompt-injection-block-layer requires --strict")
        return 1

    if args.enforce_prompt_injection_block_layer and args.manifest_only:
        print("::error::--enforce-prompt-injection-block-layer is only valid with prompt-injection validation")
        return 1

    root = _repo_root()

    if args.prompt_injection_only:
        p = validate_prompt_injection_datasets(strict=args.strict)

        if p != 0:
            return p

        if args.enforce_prompt_injection_block_layer:
            return enforce_prompt_injection_executable_regression(root=root)

        return 0

    if args.manifest_only:
        return validate_manifest(strict=args.strict)

    m = validate_manifest(strict=args.strict)
    if m != 0:
        return m

    p = validate_prompt_injection_datasets(strict=args.strict)
    if p != 0:
        return p

    if args.enforce_prompt_injection_block_layer:
        return enforce_prompt_injection_executable_regression(root=root)

    return 0


if __name__ == "__main__":
    sys.exit(main())
