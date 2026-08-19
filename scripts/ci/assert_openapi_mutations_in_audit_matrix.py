#!/usr/bin/env python3
"""CI guard: OpenAPI POST/PUT/DELETE paths appear in AUDIT_COVERAGE_MATRIX.md.

Reads the checked-in Microsoft OpenAPI snapshot (GET /openapi/v1.json contract) and asserts each
mutating path/method pair is referenced in ``docs/library/AUDIT_COVERAGE_MATRIX.md`` via:

- A **full** route mention like ``POST /v1/foo/{id}``, or
- An **ellipsis suffix** mention like ``POST …/foo/bar`` / ``POST .../foo/bar`` (matches any OpenAPI path
  whose absolute path ends with that suffix).

Rationale: complements ``assert_controller_mutations_have_audit.py`` (code-level ``LogAsync``) with a
doc-level signal that operators updated the audit narrative when the HTTP surface changes.

Exit codes:
  0 — all mutation paths documented or allowlisted
  1 — undocumented paths found
  2 — I/O or JSON parse error
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

_MUTATING_OPS = frozenset({"post", "put", "delete"})

# METHOD /path… stop before markdown/table punctuation.
_FULL_PATH_RE = re.compile(r"\b(POST|PUT|DELETE)\s+(/[^\s`\]\)\|,]+)", re.IGNORECASE)

# POST …/suffix or POST .../suffix (ASCII or Unicode ellipsis).
_SUFFIX_PATH_RE = re.compile(
    r"\b(POST|PUT|DELETE)\s+(?:…|\.\.\.)(/[^\s`\]\)\|,]+)",
    re.IGNORECASE,
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def parse_matrix(matrix_text: str) -> tuple[set[tuple[str, str]], set[tuple[str, str]]]:
    """Return (exact {(VERB, path)}, suffix {(VERB, suffix)})."""

    exact: set[tuple[str, str]] = set()
    suffix: set[tuple[str, str]] = set()

    for match in _FULL_PATH_RE.finditer(matrix_text):
        verb = match.group(1).upper()
        path = match.group(2).rstrip(".,;")
        if "…" in path or path.startswith("."):
            continue

        exact.add((verb, path))

    for match in _SUFFIX_PATH_RE.finditer(matrix_text):
        verb = match.group(1).upper()
        suf = match.group(2).rstrip(".,;")

        suffix.add((verb, suf))

    return exact, suffix


def load_openapi_mutations(openapi_path: Path) -> list[tuple[str, str]]:
    raw = openapi_path.read_text(encoding="utf-8", errors="strict")
    doc = json.loads(raw)
    paths = doc.get("paths")
    if not isinstance(paths, dict):
        raise ValueError("assert_openapi_mutations_in_audit_matrix: OpenAPI 'paths' missing or not an object")

    out: list[tuple[str, str]] = []
    for path_item, path_obj in sorted(paths.items()):
        if not isinstance(path_obj, dict):
            continue

        for op_name, op_body in path_obj.items():
            if op_name.lower() not in _MUTATING_OPS:
                continue

            if not isinstance(op_body, dict):
                continue

            out.append((op_name.upper(), path_item))

    return out


def load_allowlist(path: Path) -> set[tuple[str, str]]:
    allowed: set[tuple[str, str]] = set()
    if not path.is_file():
        return allowed

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split(None, 1)
        if len(parts) != 2:
            continue

        verb, pth = parts[0].upper(), parts[1].strip()
        allowed.add((verb, pth))

    return allowed


def is_documented(method: str, path: str, exact: set[tuple[str, str]], suffix: set[tuple[str, str]]) -> bool:
    m = method.upper()
    if (m, path) in exact:
        return True

    for mv, suf in suffix:
        if mv != m:
            continue

        if path == suf or path.endswith(suf):
            return True

    return False


def emit_github_errors(messages: list[str]) -> None:
    # Avoid PowerShell treating "::error" as a native error record when developing on Windows.
    if os.environ.get("GITHUB_ACTIONS", "").lower() == "true":
        for msg in messages:
            safe = msg.replace("\n", "%0A")
            print(f"::error title=openapi-audit-matrix::{safe}", file=sys.stderr)
        return

    for msg in messages:
        print(msg, file=sys.stderr)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument(
        "--openapi",
        type=Path,
        default=None,
        help="OpenAPI JSON path (default: ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json).",
    )
    parser.add_argument(
        "--matrix",
        type=Path,
        default=None,
        help="AUDIT_COVERAGE_MATRIX.md path (default: docs/library/AUDIT_COVERAGE_MATRIX.md).",
    )
    parser.add_argument(
        "--print-violations",
        action="store_true",
        help="Print undocumented METHOD + path lines (exit 0). For bootstrapping allowlist.",
    )
    args = parser.parse_args(argv)
    root: Path = args.repo_root.resolve()
    openapi_path = (
        args.openapi
        if args.openapi is not None
        else root / "ArchLucid.Api.Tests" / "Contracts" / "openapi-v1.contract.snapshot.json"
    ).resolve()
    matrix_path = (
        args.matrix if args.matrix is not None else root / "docs" / "library" / "AUDIT_COVERAGE_MATRIX.md"
    ).resolve()
    allow_path = root / "scripts" / "ci" / "openapi_audit_matrix_allowlist.txt"

    if not openapi_path.is_file():
        print(f"assert_openapi_mutations_in_audit_matrix: missing {openapi_path}", file=sys.stderr)
        return 2

    if not matrix_path.is_file():
        print(f"assert_openapi_mutations_in_audit_matrix: missing {matrix_path}", file=sys.stderr)
        return 2

    try:
        mutations = load_openapi_mutations(openapi_path)
    except (json.JSONDecodeError, OSError, ValueError) as ex:
        print(f"assert_openapi_mutations_in_audit_matrix: {ex}", file=sys.stderr)
        return 2

    matrix_text = matrix_path.read_text(encoding="utf-8", errors="strict")
    exact, suffix = parse_matrix(matrix_text)
    allow = load_allowlist(allow_path)

    undocumented: list[str] = []
    for method, path in mutations:
        if (method, path) in allow:
            continue

        if is_documented(method, path, exact, suffix):
            continue

        undocumented.append(f"{method} {path}")

    if args.print_violations:
        for line in sorted(undocumented):
            print(line)
        return 0

    if undocumented:
        msg = (
            "Undocumented mutating OpenAPI paths (add a route mention to "
            f"{matrix_path.relative_to(root)} or allowlist with justification - "
            f"{allow_path.relative_to(root)}):\n  "
            + "\n  ".join(sorted(undocumented))
        )
        emit_github_errors([msg])
        print(f"assert_openapi_mutations_in_audit_matrix: FAILED -\n{msg}", file=sys.stderr)
        return 1

    print(
        f"assert_openapi_mutations_in_audit_matrix: OK ({len(mutations)} POST/PUT/DELETE path(s); "
        f"{matrix_path.relative_to(root)})."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
