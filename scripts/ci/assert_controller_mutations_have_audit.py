#!/usr/bin/env python3
"""CI guard: mutating controller actions should emit audit (IAuditService.LogAsync or IBaselineMutationAuditService).

Scans ``ArchLucid.Api/Controllers/**/*.cs`` for ``[HttpPost|Put|Patch|Delete]`` action methods and asserts each
method body contains ``LogAsync(`` (covers ``_auditService.LogAsync``, ``auditService.LogAsync``, ``_audit.LogAsync``)
or is listed in ``scripts/ci/controller_action_audit_allowlist.txt`` (one ``FullyQualifiedClassName.MethodName`` per line).

Rationale: duplicate audit channels are discouraged, but *missing* audit on state-changing API surfaces is worse for
enterprise readiness — this guard makes omissions visible at PR time.

Exit codes:
  0 — no new violations outside allowlist
  1 — violations found
  2 — I/O or parse error
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


MUTATING_ATTR = re.compile(
    r"\[\s*Http(Post|Put|Patch|Delete)\s*(?:\([^\]]*\))?\s*\]",
    re.IGNORECASE,
)

METHOD_START = re.compile(
    r"^\s*public\s+(?:async\s+)?(?:Task\s*<[^>]+>|IActionResult|ActionResult[^<{]*)\s+(\w+)\s*\(",
)


def _strip_block_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)


def _strip_line_comments(text: str) -> str:
    out_lines: list[str] = []
    for line in text.splitlines():
        if "//" in line:
            in_string = False
            quote = ""
            i = 0
            cut = len(line)
            while i < len(line) - 1:
                ch = line[i]
                if not in_string and ch == "/" and line[i + 1] == "/":
                    cut = i
                    break
                if ch in ('"', "'"):
                    if not in_string:
                        in_string = True
                        quote = ch
                    elif ch == quote and line[i - 1] != "\\":
                        in_string = False
                i += 1
            line = line[:cut].rstrip()
        out_lines.append(line)
    return "\n".join(out_lines)


def _extract_namespace(text: str) -> str | None:
    m = re.search(r"^\s*namespace\s+([\w.]+)\s*;", text, re.MULTILINE)
    return m.group(1) if m else None


def _extract_class_name(text: str) -> str | None:
    m = re.search(
        r"^\s*(?:public\s+|internal\s+|sealed\s+|partial\s+)*class\s+(\w+)\s*(?:\(|:|\{|where)",
        text,
        re.MULTILINE,
    )
    return m.group(1) if m else None


def _method_body_after_signature(lines: list[str], start_idx: int) -> tuple[str, int] | None:
    """From a line index at method signature, return (body text including braces) and end line index."""
    brace_depth = 0
    started = False
    body_chunks: list[str] = []

    for i in range(start_idx, len(lines)):
        line = lines[i]

        if not started:
            if "{" in line:
                started = True
                brace_depth += line.count("{") - line.count("}")
                body_chunks.append(line)
            continue

        body_chunks.append(line)
        brace_depth += line.count("{") - line.count("}")
        if brace_depth <= 0:
            return "\n".join(body_chunks), i

    return None


def _scan_file(path: Path) -> list[tuple[str, str, int]]:
    """Return list of (fq_method, body, line_number) for mutating actions missing LogAsync."""
    raw = path.read_text(encoding="utf-8")
    text = _strip_line_comments(_strip_block_comments(raw))
    ns = _extract_namespace(text)
    cls = _extract_class_name(text)
    if ns is None or cls is None:
        return []

    fq_prefix = f"{ns}.{cls}"
    lines = text.splitlines()
    violations: list[tuple[str, str, int]] = []

    i = 0
    while i < len(lines):
        if not MUTATING_ATTR.search(lines[i]):
            i += 1
            continue

        j = i + 1
        while j < len(lines):
            stripped = lines[j].strip()
            if stripped.startswith("[") and not METHOD_START.match(lines[j]):
                j += 1
                continue
            m = METHOD_START.match(lines[j])
            if m:
                method_name = m.group(1)
                body_tuple = _method_body_after_signature(lines, j)
                if body_tuple is None:
                    break
                body, end_line = body_tuple
                fq = f"{fq_prefix}.{method_name}"
                if "LogAsync(" not in body:
                    violations.append((fq, body.strip()[:200], j + 1))
                i = end_line
                break
            if stripped and not stripped.startswith("//"):
                break
            j += 1
        i += 1

    return violations


def _load_allowlist(path: Path) -> set[str]:
    if not path.is_file():
        return set()

    entries: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        entries.add(line)
    return entries


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[2],
        help="Repository root (contains ArchLucid.Api/)",
    )
    parser.add_argument(
        "--print-violations",
        action="store_true",
        help="Print machine-readable FQ method names (for allowlist bootstrap).",
    )
    args = parser.parse_args()
    root: Path = args.repo_root
    controllers = sorted((root / "ArchLucid.Api" / "Controllers").rglob("*.cs"))
    allow_path = root / "scripts" / "ci" / "controller_action_audit_allowlist.txt"
    allow = _load_allowlist(allow_path)

    missing: list[str] = []
    for cs in controllers:
        for fq, _snippet, line_no in _scan_file(cs):
            if fq in allow:
                continue
            missing.append(f"{fq}  ({cs.relative_to(root)}:{line_no})")

    if args.print_violations:
        for m in sorted(missing):
            print(m)
        return 0

    if missing:
        print(
            "ERROR: mutating controller actions without LogAsync (and not allowlisted):\n"
            + "\n".join(missing),
            file=sys.stderr,
        )
        print(
            f"\nAllowlist: {allow_path} (one FullyQualifiedClassName.MethodName per line; "
            "prefer adding LogAsync in the action instead).",
            file=sys.stderr,
        )
        return 1

    print("OK: all mutating controller actions call LogAsync or are allowlisted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
