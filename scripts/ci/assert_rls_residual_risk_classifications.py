#!/usr/bin/env python3
r"""
Ensure every current or newly changed dbo table has an RLS residual-risk classification.

The guard intentionally uses lightweight SQL extraction instead of a full parser because
the invariant is limited to table declarations and reviewable security classifications.

Local:
  python scripts/ci/assert_rls_residual_risk_classifications.py

CI with changed migrations:
  ARCHLUCID_GIT_DIFF_RANGE="${BASE_SHA}...${HEAD_SHA}" \
    python scripts/ci/assert_rls_residual_risk_classifications.py
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


ARCHLUCID_SQL_PATH = Path("ArchLucid.Persistence/Scripts/ArchLucid.sql")
MATRIX_PATH = Path("docs/security/MULTI_TENANT_RLS_RESIDUAL_RISK_MATRIX.md")
FORWARD_MIGRATION_PATTERN = re.compile(
    r"^ArchLucid\.Persistence/Migrations/\d{3}_[A-Za-z0-9_]+\.sql$"
)
VALID_CLASSIFICATIONS = {
    "rls-covered-scope-triple",
    "tenant-only-covered",
    "database-per-tenant/system-plane-only",
    "child-table-with-compensating-control",
    "operational-table",
    "explicit-accepted-residual-risk",
}
CREATE_TABLE_PATTERN = re.compile(
    r"\bCREATE\s+TABLE\s+"
    r"(?:(?:\[?dbo\]?)\s*\.\s*)?"
    r"(?:\[([A-Za-z_][A-Za-z0-9_]*)\]|([A-Za-z_][A-Za-z0-9_]*))"
    r"(?=\s*(?:\(|\r?\n))",
    re.IGNORECASE,
)
BACKTICK_TABLE_PATTERN = re.compile(r"`(?:dbo\.)?([A-Za-z_][A-Za-z0-9_]*)`")


@dataclass(frozen=True)
class DriftEvaluation:
    exit_code: int
    message: str


def _repo_root() -> Path:
    env_root = os.environ.get("ARCHLUCID_GIT_REPO_ROOT", "").strip()

    if env_root:
        return Path(env_root).resolve()

    return Path(__file__).resolve().parents[2]


def normalize_git_path(path: str) -> str:
    return path.strip().replace("\\", "/")


def is_forward_dbup_migration_path(path: str) -> bool:
    return bool(FORWARD_MIGRATION_PATTERN.match(normalize_git_path(path)))


def _strip_sql_comments(sql_text: str) -> str:
    without_block_comments = re.sub(r"/\*.*?\*/", "", sql_text, flags=re.DOTALL)

    return re.sub(r"--.*?$", "", without_block_comments, flags=re.MULTILINE)


def extract_dbo_create_tables(sql_text: str) -> set[str]:
    clean_sql = _strip_sql_comments(sql_text)
    tables: set[str] = set()

    for match in CREATE_TABLE_PATTERN.finditer(clean_sql):
        table_name = match.group(1) or match.group(2)

        if table_name is not None:
            tables.add(table_name)

    return tables


def parse_matrix_classifications(matrix_text: str) -> tuple[dict[str, str], list[str]]:
    classifications: dict[str, str] = {}
    errors: list[str] = []

    for line_number, line in enumerate(matrix_text.splitlines(), start=1):
        stripped = line.strip()

        if not stripped.startswith("|"):
            continue

        cells = [cell.strip() for cell in stripped.strip("|").split("|")]

        if len(cells) < 2:
            continue

        classification = cells[0].strip("`")

        if classification not in VALID_CLASSIFICATIONS:
            continue

        tables = BACKTICK_TABLE_PATTERN.findall(cells[1])

        if not tables:
            errors.append(
                f"Matrix line {line_number}: classification `{classification}` has no backticked tables."
            )
            continue

        for table in tables:
            previous = classifications.get(table)

            if previous is not None and previous != classification:
                errors.append(
                    f"Matrix line {line_number}: dbo.{table} is classified as both "
                    f"`{previous}` and `{classification}`."
                )
                continue

            classifications[table] = classification

    return classifications, errors


def evaluate_tables(
    current_tables: set[str],
    changed_migration_tables: dict[str, set[str]],
    classifications: dict[str, str],
    classification_errors: list[str] | None = None,
) -> DriftEvaluation:
    errors = list(classification_errors or [])
    required_tables = set(current_tables)

    for tables in changed_migration_tables.values():
        required_tables.update(tables)

    missing = sorted(table for table in required_tables if table not in classifications)

    if missing:
        sources_by_table = _sources_by_table(current_tables, changed_migration_tables)
        details = "\n".join(
            f"  - dbo.{table} ({', '.join(sources_by_table.get(table, ['unknown source']))})"
            for table in missing
        )
        errors.append(
            "Unclassified dbo table(s) would bypass the RLS residual-risk matrix:\n"
            f"{details}\n"
            f"Add each table to {MATRIX_PATH.as_posix()} under one of: "
            + ", ".join(f"`{name}`" for name in sorted(VALID_CLASSIFICATIONS))
            + "."
        )

    if errors:
        return DriftEvaluation(1, "\n".join(errors))

    return DriftEvaluation(
        0,
        "OK: "
        f"{len(required_tables)} dbo table(s) have RLS residual-risk classifications "
        f"across {len(set(classifications.values()))} classification bucket(s).",
    )


def _sources_by_table(
    current_tables: set[str],
    changed_migration_tables: dict[str, set[str]],
) -> dict[str, list[str]]:
    sources: dict[str, list[str]] = {}

    for table in current_tables:
        sources.setdefault(table, []).append(ARCHLUCID_SQL_PATH.as_posix())

    for path, tables in changed_migration_tables.items():

        for table in tables:
            sources.setdefault(table, []).append(path)

    return sources


def _git_diff_name_only(repo: Path, diff_range: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(repo), "diff", "--name-only", diff_range],
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        print(
            f"git diff failed (rc={result.returncode}): {result.stderr.strip() or result.stdout.strip()}",
            file=sys.stderr,
        )
        raise RuntimeError("git diff failed")

    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _changed_forward_migration_paths(repo: Path, diff_range: str | None) -> list[Path]:
    if diff_range is None:
        return []

    changed_paths = _git_diff_name_only(repo, diff_range)

    return [
        repo / normalize_git_path(path)
        for path in changed_paths
        if is_forward_dbup_migration_path(path)
    ]


def _resolve_diff_range(args: argparse.Namespace) -> str | None:
    literal = (os.environ.get("ARCHLUCID_GIT_DIFF_RANGE") or "").strip()

    if literal:
        return literal

    if args.diff_range:
        return args.diff_range.strip()

    return None


def _load_changed_migration_tables(paths: list[Path], repo: Path) -> dict[str, set[str]]:
    changed_tables: dict[str, set[str]] = {}

    for path in paths:

        if not path.is_file():
            continue

        relative_path = normalize_git_path(str(path.relative_to(repo)))
        changed_tables[relative_path] = extract_dbo_create_tables(path.read_text(encoding="utf-8"))

    return changed_tables


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--diff-range", help="Passed to git diff --name-only, e.g. origin/main...HEAD")
    parser.add_argument("--archlucid-sql", default=str(ARCHLUCID_SQL_PATH))
    parser.add_argument("--matrix", default=str(MATRIX_PATH))
    parser.add_argument(
        "--migration-file",
        action="append",
        default=[],
        help="Additional migration SQL file to evaluate; repeatable and useful for local fixtures.",
    )
    args = parser.parse_args(argv)
    repo = _repo_root()

    archlucid_sql_path = repo / args.archlucid_sql
    matrix_path = repo / args.matrix

    if not archlucid_sql_path.is_file():
        print(f"Missing consolidated SQL file: {archlucid_sql_path}", file=sys.stderr)
        return 2

    if not matrix_path.is_file():
        print(f"Missing RLS residual-risk matrix: {matrix_path}", file=sys.stderr)
        return 2

    try:
        changed_paths = _changed_forward_migration_paths(repo, _resolve_diff_range(args))
    except RuntimeError:
        return 2

    changed_paths.extend(repo / path for path in args.migration_file)
    current_tables = extract_dbo_create_tables(archlucid_sql_path.read_text(encoding="utf-8"))
    migration_tables = _load_changed_migration_tables(changed_paths, repo)
    classifications, classification_errors = parse_matrix_classifications(
        matrix_path.read_text(encoding="utf-8")
    )
    result = evaluate_tables(
        current_tables,
        migration_tables,
        classifications,
        classification_errors,
    )
    stream = sys.stderr if result.exit_code != 0 else sys.stdout
    print(result.message, file=stream)

    return result.exit_code


if __name__ == "__main__":
    raise SystemExit(main())
