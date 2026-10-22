#!/usr/bin/env python3
"""Flag unsupported superlatives in buyer-facing proof packets and demo scripts.

Implements the regression guard for the proof-language claim audit
(assessment LATEST_GPT55 §17 #7). A superlative term is reported only when the
line carries no caveat/backing marker, so honest "do not promise" rows and
source-labeled estimates pass. See docs/go-to-market/CLAIM_READINESS_STATUS.md#proof-language-claim-audit-static-buyer-docs.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parent / "data" / "proof_language_audit_scope.v1.json"


@dataclass(frozen=True)
class Violation:
    path: str
    line_no: int
    term: str

    def render(self) -> str:
        return f"{self.path}:{self.line_no}: unsupported superlative '{self.term}'"


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_scope() -> dict:
    return json.loads(_DATA_PATH.read_text(encoding="utf-8"))


def _normalize_line(line: str) -> str:
    # Strip markdown emphasis/code markers so bolded caveats like "do **not** claim"
    # still register as caveats and are not mistaken for unsupported superlatives.
    normalized = line
    for marker in ("*", "_", "`"):
        normalized = normalized.replace(marker, "")

    return normalized.lower()


def _line_has_caveat(line_lower: str, caveat_markers: list[str]) -> bool:
    return any(marker in line_lower for marker in caveat_markers)


def scan_text(text: str, *, source_label: str, superlative_terms: list[str], caveat_markers: list[str]) -> list[Violation]:
    violations: list[Violation] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        line_lower = _normalize_line(line)

        if _line_has_caveat(line_lower, caveat_markers):
            continue

        for term in superlative_terms:

            if term in line_lower:
                violations.append(Violation(source_label, line_no, term))

    return violations


def scan_paths(paths: list[Path], *, root: Path, superlative_terms: list[str], caveat_markers: list[str]) -> tuple[list[Violation], list[str]]:
    violations: list[Violation] = []
    missing: list[str] = []

    for path in paths:

        if not path.is_file():
            missing.append(str(path.relative_to(root)) if path.is_absolute() else str(path))
            continue

        content = path.read_text(encoding="utf-8", errors="replace")
        rel_label = str(path.relative_to(root)) if path.is_absolute() else str(path)
        violations.extend(scan_text(content, source_label=rel_label, superlative_terms=superlative_terms, caveat_markers=caveat_markers))

    return violations, missing


def _resolve_targets(args_paths: list[Path], *, root: Path, scope: dict) -> list[Path]:

    if args_paths:
        return [p if p.is_absolute() else (root / p) for p in args_paths]

    return [root / rel for rel in scope["scanScope"]]


def _write_json_report(out_path: Path, violations: list[Violation], missing: list[str]) -> None:
    payload = {
        "violations": [{"path": v.path, "line": v.line_no, "term": v.term} for v in violations],
        "missingFiles": missing,
        "violationCount": len(violations),
    }
    out_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _write_markdown_report(out_path: Path, violations: list[Violation], missing: list[str]) -> None:
    lines = ["# Proof-language superlative scan", "", f"- Violations: {len(violations)}", f"- Missing files: {len(missing)}", ""]

    for v in violations:
        lines.append(f"- `{v.path}:{v.line_no}` — unsupported superlative `{v.term}`")

    for m in missing:
        lines.append(f"- MISSING scope file: `{m}`")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", type=Path, help="Files to scan (default: scope from data JSON).")
    parser.add_argument("--advisory", action="store_true", help="Never fail (exit 0) even when violations are found.")
    parser.add_argument("--json-out", type=Path, default=None, help="Write a JSON report to this path.")
    parser.add_argument("--markdown-out", type=Path, default=None, help="Write a Markdown report to this path.")
    args = parser.parse_args(argv)

    root = _repo_root()
    scope = _load_scope()
    superlative_terms = [t.lower() for t in scope["superlativeTerms"]]
    caveat_markers = [m.lower() for m in scope["caveatMarkers"]]

    targets = _resolve_targets(args.paths, root=root, scope=scope)
    violations, missing = scan_paths(targets, root=root, superlative_terms=superlative_terms, caveat_markers=caveat_markers)

    if args.json_out is not None:
        _write_json_report(args.json_out, violations, missing)

    if args.markdown_out is not None:
        _write_markdown_report(args.markdown_out, violations, missing)

    for message in missing:
        print(f"::error::missing proof-language scope file {message}", file=sys.stderr)

    for violation in violations:
        print(f"::error::{violation.render()}", file=sys.stderr)

    failed = bool(violations or missing)

    if failed and not args.advisory:
        print(f"check_proof_language_superlatives: {len(violations)} violation(s), {len(missing)} missing file(s)", file=sys.stderr)
        return 1

    if failed:
        print(f"check_proof_language_superlatives: {len(violations)} advisory violation(s), {len(missing)} missing — not blocking", file=sys.stderr)
        return 0

    print("check_proof_language_superlatives: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
