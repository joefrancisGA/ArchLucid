"""CI guard: ui_unit_vitest_shards.json partitions archlucid-ui Vitest unit tests."""

from __future__ import annotations

import json
from fnmatch import fnmatch
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
UI_ROOT = REPO_ROOT / "archlucid-ui"
MANIFEST = REPO_ROOT / "scripts" / "ci" / "ui_unit_vitest_shards.json"
TEST_SUFFIXES = (".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx")


def _load_shard_paths() -> dict[str, list[str]]:
    payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    return {shard["id"]: list(shard["paths"]) for shard in payload["shards"]}


def _discover_unit_test_files() -> list[Path]:
    files: list[Path] = []
    for root in (UI_ROOT / "src", UI_ROOT / "scripts"):
        if not root.is_dir():
            continue

        for path in root.rglob("*"):
            if not path.is_file():
                continue

            if path.name.endswith(TEST_SUFFIXES):
                files.append(path.relative_to(UI_ROOT).as_posix())

    return sorted(set(files))


def _path_matches_glob(relative_path: str, glob_pattern: str) -> bool:
    if "*" not in glob_pattern:
        if relative_path == glob_pattern:
            return True

        prefix = glob_pattern.rstrip("/") + "/"
        return relative_path.startswith(prefix)

    # Patterns like src/next.config.*.test.ts must not match nested directories (src/components/...).
    if glob_pattern.count("*") == 1 and "/" in glob_pattern:
        prefix, suffix = glob_pattern.split("*", 1)
        if "/" not in suffix and relative_path.startswith(prefix):
            rest = relative_path[len(prefix) :]
            if "/" not in rest:
                return fnmatch(rest, f"*{suffix}")

    return fnmatch(relative_path, glob_pattern)


def test_ui_unit_vitest_shards_manifest_has_expected_ids() -> None:
    shard_paths = _load_shard_paths()
    assert set(shard_paths) == {
        "lib",
        "components",
        "app-operator-a",
        "app-operator-b",
        "app-operator-c",
        "app-operator-d",
        "app-operator-e",
        "app-marketing",
        "surface",
    }


def test_ui_unit_vitest_shards_partition_all_unit_tests() -> None:
    shard_paths = _load_shard_paths()
    tests = _discover_unit_test_files()
    assert tests, "expected at least one archlucid-ui unit test file"

    unassigned: list[str] = []
    ambiguous: list[str] = []
    for relative_path in tests:
        matches = [
            shard_id
            for shard_id, patterns in shard_paths.items()
            if any(_path_matches_glob(relative_path, pattern) for pattern in patterns)
        ]

        if len(matches) == 0:
            unassigned.append(relative_path)
        elif len(matches) > 1:
            ambiguous.append(f"{relative_path} -> {matches}")

    assert not unassigned, f"unit tests not covered by any shard: {unassigned[:10]}"
    assert not ambiguous, f"unit tests matched multiple shards: {ambiguous[:10]}"
