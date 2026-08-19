#!/usr/bin/env python3
"""Classify ArchLucid.Api mutating routes by idempotency posture (INV-009)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
if str(_SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPT_DIR))

from check_audit_matrix import _iter_mutating_actions, repo_root  # noqa: E402


_POSTURE_COMMENT = re.compile(r"idempotency-posture:\s*(\w[\w-]*)", re.IGNORECASE)
_ALLOWLIST_LINE = re.compile(r"^(POST|PUT|PATCH|DELETE)\s+(/\S+)")


def load_allowlist(path: Path) -> set[tuple[str, str]]:
    if not path.is_file():
        return set()

    pairs: set[tuple[str, str]] = set()

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        m = _ALLOWLIST_LINE.match(line)

        if m:
            pairs.add((m.group(1).upper(), m.group(2)))

    return pairs


def classify_route(
    *,
    verb: str,
    path: str,
    controller: Path,
    line_no: int,
    allowlist: set[tuple[str, str]],
) -> str:
    key = (verb.upper(), path)

    if key in allowlist:
        return "non-idempotent-allowlisted"

    text = controller.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    window_start = max(0, line_no - 25)
    window_end = min(len(lines), line_no + 80)
    window = "\n".join(lines[window_start:window_end])

    if m := _POSTURE_COMMENT.search(window):
        return m.group(1).lower()

    # Action-scoped filter only (class-level filter mis-classifies sibling routes on the same controller).
    if "[IdempotencyFilter]" in window:
        return "explicit-idempotency-key"

    if "Idempotency-Key" in window:
        return "explicit-idempotency-key"

    if "[AuditExempt]" in window or "audit-matrix-exempt" in window.lower():
        return "audit-exempt"

    if verb.upper() in {"PUT", "DELETE", "PATCH"}:
        return "naturally-idempotent"

    if verb.upper() == "POST":
        path_lower = path.lower()

        if "/webhook" in path_lower or path_lower.endswith("/hooks"):
            return "inbound-webhook-pipeline"

        if "/admin/" in path_lower:
            return "operator-documented-safe-retry"

        if re.search(r"\bdryRun\b", window) or re.search(r"\bDryRun\b", window):
            return "dry-run-no-persist"

        if "batch" in path_lower and ("acknowledge" in path_lower or "archive" in path_lower):
            return "explicit-idempotency-key"

    return "unclassified"


def evaluate(root: Path) -> dict[str, object]:
    root = root.resolve()
    allow_path = root / "scripts" / "ci" / "data" / "mutating_route_idempotency_allowlist.txt"
    allowlist = load_allowlist(allow_path)
    controllers_dir = root / "ArchLucid.Api" / "Controllers"
    routes: list[dict[str, object]] = []

    for cs in sorted(controllers_dir.rglob("*.cs")):
        for verb, pth, line_no, fq in _iter_mutating_actions(cs, api_version_token="1"):
            posture = classify_route(
                verb=verb,
                path=pth,
                controller=cs,
                line_no=line_no,
                allowlist=allowlist,
            )
            routes.append(
                {
                    "verb": verb,
                    "path": pth,
                    "posture": posture,
                    "controller": cs.relative_to(root).as_posix(),
                    "line": line_no,
                    "action": fq,
                }
            )

    unclassified = [r for r in routes if r["posture"] == "unclassified"]
    # Baseline backlog: report unclassified routes as WARN in proof; use --strict for CI BLOCK.
    disposition = "PASS" if not unclassified else "WARN"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "discoveredRouteCount": len(routes),
        "unclassifiedRouteCount": len(unclassified),
        "unclassifiedRoutes": unclassified,
        "routes": routes,
        "allowlistPath": allow_path.relative_to(root).as_posix(),
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Mutating route idempotency posture",
        "",
        "> POST mutations require explicit idempotency handling unless allowlisted (INV-009).",
        "",
        f"**Disposition:** {summary.get('disposition')}",
        f"**Discovered routes:** {summary.get('discoveredRouteCount')}",
        f"**Unclassified:** {summary.get('unclassifiedRouteCount')}",
        "",
    ]

    if summary.get("unclassifiedRoutes"):
        lines.append("## Unclassified routes")
        lines.append("")

        for row in summary["unclassifiedRoutes"]:
            lines.append(
                f"- `{row['verb']} {row['path']}` ({row['controller']}:{row['line']}) — add Idempotency-Key handling, "
                "`// idempotency-posture:` comment, or allowlist entry."
            )

        lines.append("")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 when any POST route lacks idempotency posture (CI enforcement).",
    )
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    summary = evaluate(root)

    if args.strict and summary.get("unclassifiedRouteCount", 0) > 0:
        summary["disposition"] = "BLOCK"

    if args.markdown_out is not None:
        args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    if args.json_out is not None:
        args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if summary.get("disposition") == "BLOCK":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
