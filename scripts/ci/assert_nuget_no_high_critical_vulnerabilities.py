#!/usr/bin/env python3
"""Run ``dotnet list package --vulnerable --include-transitive --format json`` and fail on High/Critical (Low ignored)."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from collections.abc import Iterator
from pathlib import Path

# Severities that block the pipeline (NuGet advisory strings; comparison is case-insensitive).
# Low (and other non-listed levels) are non-blocking; assessment gates High/Critical only.
_BLOCKING_SEVERITIES = frozenset({"critical", "high"})


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def parse_dotnet_json_report(text: str) -> dict[str, object]:
    raw = text.lstrip("\ufeff").strip()
    idx = raw.find("{")

    if idx < 0:
        raise ValueError("dotnet output did not contain a JSON object (expected '{').")

    decoder = json.JSONDecoder()
    data, _end = decoder.raw_decode(raw[idx:])

    if not isinstance(data, dict):
        raise TypeError("dotnet list package JSON root must be an object.")

    return data


def iter_package_vulnerability_rows(node: object) -> Iterator[tuple[str | None, dict[str, object]]]:
    """Yield (package id or None, vulnerability dict) for every entry under a ``vulnerabilities`` array."""

    if isinstance(node, dict):
        pkg_id = node.get("id")
        pkg_id_str = str(pkg_id) if pkg_id is not None else None

        vulns = node.get("vulnerabilities")

        if isinstance(vulns, list):
            for item in vulns:
                if isinstance(item, dict):
                    yield pkg_id_str, item

        for child in node.values():
            yield from iter_package_vulnerability_rows(child)

    elif isinstance(node, list):
        for item in node:
            yield from iter_package_vulnerability_rows(item)


def find_blocking_vulnerabilities(report: dict[str, object]) -> list[tuple[str | None, str, dict[str, object]]]:
    """Return rows ``(package_id, severity_normalized, vuln_dict)`` for severities in ``_BLOCKING_SEVERITIES``."""

    blocking: list[tuple[str | None, str, dict[str, object]]] = []

    for pkg_id, vuln in iter_package_vulnerability_rows(report):
        sev_raw = vuln.get("severity")
        sev = str(sev_raw).strip().lower() if sev_raw is not None else ""

        if sev in _BLOCKING_SEVERITIES:
            blocking.append((pkg_id, sev, vuln))

    return blocking


def _summarize_non_blocking(report: dict[str, object]) -> dict[str, int]:
    counts: dict[str, int] = {}

    for _pkg_id, vuln in iter_package_vulnerability_rows(report):
        sev_raw = vuln.get("severity")
        key = str(sev_raw).strip().lower() if sev_raw is not None else "(missing)"

        counts[key] = counts.get(key, 0) + 1

    return counts


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail the build if NuGet vulnerability audit reports High or Critical severities.",
    )
    parser.add_argument(
        "--solution",
        default="ArchLucid.sln",
        help="Solution file relative to repo root (default: ArchLucid.sln).",
    )
    args = parser.parse_args()
    root = repo_root()
    sln = root / args.solution

    if not sln.is_file():
        print(f"error: solution not found: {sln}", file=sys.stderr)
        return 2

    cmd = [
        "dotnet",
        "list",
        str(sln.relative_to(root)),
        "package",
        "--vulnerable",
        "--include-transitive",
        "--format",
        "json",
    ]

    env = os.environ.copy()
    completed = subprocess.run(
        cmd,
        cwd=str(root),
        capture_output=True,
        text=True,
        env=env,
        check=False,
    )

    stdout = completed.stdout or ""
    stderr = completed.stderr or ""

    if not stdout.strip():
        print(
            "error: dotnet list package produced no stdout; cannot parse vulnerability report.",
            file=sys.stderr,
        )

        if stderr.strip():
            print(stderr, file=sys.stderr)

        return completed.returncode if completed.returncode != 0 else 3

    try:
        report = parse_dotnet_json_report(stdout)
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        print(f"error: failed to parse dotnet JSON output: {exc}", file=sys.stderr)
        print(stdout[:4000], file=sys.stderr)
        return 3

    blocking = find_blocking_vulnerabilities(report)

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")

    if blocking:
        lines = [
            "### NuGet vulnerability audit — **blocking** (High / Critical)",
            "",
            "| Package | Severity | Advisory |",
            "|---------|----------|----------|",
        ]

        for pkg_id, sev, vuln in blocking:
            url = vuln.get("advisoryurl") or vuln.get("advisoryUrl") or ""
            lines.append(f"| `{pkg_id or '?'}` | `{sev}` | {url} |")

        msg = "\n".join(lines)
        print(msg)

        if summary_path:
            with open(summary_path, "a", encoding="utf-8") as fh:
                fh.write(msg + "\n")

        return 1

    non_blocking = _summarize_non_blocking(report)
    ignored = {k: v for k, v in non_blocking.items() if k not in _BLOCKING_SEVERITIES and v > 0}

    print(
        "NuGet audit: no High or Critical vulnerabilities "
        f"(dotnet exit {completed.returncode}; lower-severity counts: {ignored or 'none'}).",
    )

    if summary_path and ignored:
        with open(summary_path, "a", encoding="utf-8") as fh:
            fh.write("### NuGet vulnerability audit — non-blocking severities\n\n")
            fh.write(f"Counts by severity (informational): `{ignored}`\n\n")

    # dotnet may exit 1 when *any* vulnerability exists, including Low; do not propagate that exit code.
    return 0


if __name__ == "__main__":
    sys.exit(main())
