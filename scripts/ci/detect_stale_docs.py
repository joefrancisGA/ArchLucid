#!/usr/bin/env python3
"""
Advisory scan: markdown under docs/ that (a) were last touched in git 90+ days ago and
(b) contain likely code-path references (.cs / .tsx / .ts paths, IFoo, *Service identifiers).

Exits 0 always (warn-only; suitable for CI continue-on-error). Excludes docs/archive/.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ISO_DATE_LINE = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{4}$")

# Paths that look like source files, plus common C# interface / *Service type spellings.
CODE_REF_RE = re.compile(
    r"(?:"
    r"[A-Za-z0-9_.\\/\-]+\.(?:cs|tsx|ts)\b"
    r"|"
    r"\bI[A-Z][a-zA-Z0-9]*\b"
    r"|"
    r"\b[A-Z][a-zA-Z0-9]*Service\b"
    r")",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def stale_days_threshold() -> int:
    raw = os.environ.get("ARCHLUCID_STALE_DOC_DAYS", "90")

    try:
        value = int(raw)
    except ValueError:
        return 90

    return value if value > 0 else 90


def run_git(repo: Path, args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def load_last_commit_date_by_path(repo: Path, under: str) -> dict[str, datetime]:
    """
    One git log traversal (newest-first). First time a path appears is its latest commit date.
    """

    proc = run_git(
        repo,
        ["log", "--name-only", "--format=%ai", "--", under],
    )

    last: dict[str, datetime] = {}
    current: datetime | None = None

    for raw in proc.stdout.splitlines():
        line = raw.strip()

        if not line:
            continue

        if ISO_DATE_LINE.match(line):
            current = datetime.strptime(line, "%Y-%m-%d %H:%M:%S %z")

            continue

        if current is None:
            continue

        if not line.endswith(".md"):
            continue

        norm = line.replace("\\", "/")

        if norm not in last:
            last[norm] = current

    return last


def git_last_touch_fallback(repo: Path, path: str) -> datetime | None:
    proc = run_git(repo, ["log", "-1", "--format=%ai", "--", path])
    out = proc.stdout.strip()

    if not out:
        return None

    return datetime.strptime(out, "%Y-%m-%d %H:%M:%S %z")


def iter_tracked_docs_md(repo: Path) -> list[str]:
    proc = run_git(repo, ["ls-files", "-z", "--", "docs/"])
    paths: list[str] = []

    for raw in proc.stdout.split("\0"):

        if not raw:
            continue

        norm = raw.replace("\\", "/")

        if not norm.endswith(".md"):
            continue

        if norm.startswith("docs/archive/"):
            continue

        paths.append(norm)

    return sorted(paths)


def count_code_refs(text: str) -> int:
    return len(CODE_REF_RE.findall(text))


def age_days_utc(since: datetime, now: datetime) -> int:
    since_utc = since.astimezone(timezone.utc)
    now_utc = now.astimezone(timezone.utc)

    return (now_utc.date() - since_utc.date()).days


def main() -> int:
    root = repo_root()
    threshold = stale_days_threshold()
    log_index = load_last_commit_date_by_path(root, "docs/")
    now = datetime.now(timezone.utc)
    flagged: list[tuple[str, datetime, int]] = []

    for rel in iter_tracked_docs_md(root):
        touched = log_index.get(rel)

        if touched is None:
            touched = git_last_touch_fallback(root, rel)

        if touched is None:
            continue

        if age_days_utc(touched, now) < threshold:
            continue

        body = (root / rel).read_text(encoding="utf-8", errors="replace")
        ref_count = count_code_refs(body)

        if ref_count <= 0:
            continue

        flagged.append((rel, touched, ref_count))

    print("detect_stale_docs: advisory scan (warn-only; does not fail CI)")
    print(f"  threshold: {threshold}+ days since last git touch")
    print(f"  scope: tracked *.md under docs/ (excludes docs/archive/)")
    print("")

    if not flagged:
        print("No stale docs with code-path references matched the threshold.")
        return 0

    print(
        "WARN: consider refreshing these docs (stale git age + code references):",
        file=sys.stderr,
    )
    print(f"{'path':<72} | {'last_touch_utc':<20} | refs", file=sys.stderr)
    print("-" * 110, file=sys.stderr)

    for rel, touched, ref_count in sorted(flagged, key=lambda row: (-age_days_utc(row[1], now), row[0])):
        utc_stamp = touched.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M")
        print(f"{rel:<72} | {utc_stamp:<20} | {ref_count}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
