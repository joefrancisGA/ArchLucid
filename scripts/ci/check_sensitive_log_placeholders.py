#!/usr/bin/env python3
"""Fail when structured logs interpolate values that look like secrets or credentials."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

_LOG_CALL = re.compile(r"\bLog(?:Trace|Debug|Information|Warning|Error|Critical)\s*\(")
_SENSITIVE_PLACEHOLDER = re.compile(
    r"\{[^}\r\n]*(?:password|secret|token|api.?key|connection.?string|private.?key)[^}\r\n]*\}",
    re.IGNORECASE,
)
_SKIP_PARTS = {"bin", "obj", ".git"}


def find_sensitive_log_placeholders(root: Path) -> list[tuple[str, int, str]]:
    hits: list[tuple[str, int, str]] = []
    for path in root.rglob("*.cs"):
        if any(part in _SKIP_PARTS for part in path.parts):
            continue
        if any(part.endswith(".Tests") or part == "tests" for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for call in _LOG_CALL.finditer(text):
            end = text.find(");", call.end())
            if end == -1:
                continue
            if _SENSITIVE_PLACEHOLDER.search(text[call.start():end]):
                line_number = text.count("\n", 0, call.start()) + 1
                line = text.splitlines()[line_number - 1]
                hits.append((path.relative_to(root).as_posix(), line_number, line.strip()))
    return hits


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("."))
    args = parser.parse_args(argv)
    hits = find_sensitive_log_placeholders(args.root.resolve())
    if hits:
        for path, line_number, line in hits:
            print(f"{path}:{line_number}: {line}", file=sys.stderr)
        print("::error::Do not interpolate secrets or credentials into structured logs", file=sys.stderr)
        return 1

    print("check_sensitive_log_placeholders: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
