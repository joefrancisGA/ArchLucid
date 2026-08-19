#!/usr/bin/env python3
"""Reconcile P0/P1/P2 in TECH_BACKLOG_OPEN.md with TECH_BACKLOG.md demotion policy."""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKLOG = ROOT / "docs/library/TECH_BACKLOG.md"
OPEN_FILE = ROOT / "docs/library/TECH_BACKLOG_OPEN.md"

# Owner 2026-07-27 demotion policy (see TECH_BACKLOG.md Updated header).
P0_CATEGORIES = frozenset(
    {
        "Correctness",
        "Reliability",
        "Cost safety",
        "Release gate",
    }
)

P1_DEFAULT_CATEGORIES = frozenset(
    {
        "Adoption friction",
        "Commercial",
        "Architectural integrity",
        "AI/Agent readiness",
        "Data consistency",
        "Deployability",
        "Performance",
        "Scalability",
        "Traceability",
        "Interoperability",
        "Compliance readiness",
        "Supportability",
        "Proof-of-ROI / sponsor value",
        "Stickiness",
    }
)

P2_DEFAULT_CATEGORIES = frozenset(
    {
        "Testability",
        "Maintainability",
        "Explainability",
        "Cutting-edge AI",
        "Code hygiene",
    }
)

# Pass3 re-promote: buyer-facing eng leak / broken route / ghost 404 / admin gate.
TRUSTWORTHINESS_P0_PATTERNS = re.compile(
    r"(?i)"
    r"ghost|404|broken route|eng[- ]leak|contributor leak|internal-runbook|admin gate|"
    r"de-index|database query failed|tenant-scoped lie|fail-closed|quick scan|release gate|"
    r"cost safety|release-blocking|not-configured lie|preview 404|isolate promise\.all|"
    r"purge preview|ghost preview|sql catalog"
)


def parse_category(cluster: str) -> str | None:
    match = re.match(r"^([A-Za-z0-9 /\-]+?)\s+P[0-3]", cluster)

    if match is None:
        return None

    return match.group(1).strip()


def parse_priority(cluster: str) -> str | None:
    match = re.search(r"\bP([0-3])\b", cluster)

    if match is None:
        return None

    return f"P{match.group(1)}"


def target_priority(category: str | None, cluster: str, title: str) -> str:
    text = f"{cluster} {title}"

    if TRUSTWORTHINESS_P0_PATTERNS.search(text):
        return "P0"

    if category in P0_CATEGORIES:
        return "P0"

    if category == "Trustworthiness":
        return "P1"

    if category in ("Cost-effectiveness", "Cost safety", "Release gate", "Marketability"):
        if re.search(r"(?i)quick scan|release gate|budget|kill switch|public exposure|showcase", text):
            return "P0"

        return "P1"

    if category in P2_DEFAULT_CATEGORIES:
        return "P2"

    if category in P1_DEFAULT_CATEGORIES:
        return "P1"

    return "P1"


def replace_priority_in_cluster(cluster: str, new_priority: str) -> str:
    if re.search(r"\bP[0-3]\b", cluster):
        return re.sub(r"\bP[0-3]\b", new_priority, cluster, count=1)

    return f"{cluster} {new_priority}"


def parse_backlog_table(text: str) -> tuple[dict[int, str], set[int]]:
    priorities: dict[int, str] = {}
    done_ids: set[int] = set()

    for line in text.splitlines():
        if not line.startswith("| TB-"):
            continue

        if "~~" in line.split("|", 2)[1]:
            continue

        match = re.match(r"^\|\s*TB-(\d+)\s*\|", line)

        if match is None:
            continue

        tb_id = int(match.group(1))
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]

        if len(cells) < 3:
            continue

        row_text = " ".join(cells)
        cluster = cells[2]

        if "**Done**" in row_text or re.search(r"\bDone\b", cells[1]):
            done_ids.add(tb_id)
            continue

        priority = parse_priority(cluster)

        if priority is not None:
            priorities[tb_id] = priority

    return priorities, done_ids


def demote_cluster_summary_priority(line: str) -> str:
    if "(open P0/P1" in line:
        return line.replace("(open P0/P1", "(open P1")

    if "(open P0/P2" in line:
        return line.replace("(open P0/P2", "(open P1/P2")

    if "(open P0 **V1**)" in line:
        return line.replace("(open P0 **V1**)", "(open P1 **V1**)")

    if "(open P0 " in line:
        return line.replace("(open P0 ", "(open P1 ")

    return line


def update_open_file(
    text: str,
    canonical: dict[int, str],
    done_ids: set[int],
) -> tuple[str, Counter[str], Counter[str]]:
    stats: Counter[str] = Counter()
    removed: Counter[str] = Counter()
    lines: list[str] = []
    in_open_items = False

    for line in text.splitlines():
        if line.startswith("## Open items (V1 / V1.1"):
            in_open_items = True

        if line.startswith("## Hold for reassessment"):
            in_open_items = False

        if not line.startswith("| TB-"):
            if not line.startswith("| ") or "TB-" not in line:
                lines.append(line)
                continue

            lines.append(demote_cluster_summary_priority(line))
            continue

        if "~~" in line.split("|", 2)[1] or "**Done**" in line:
            lines.append(line)
            continue

        match = re.match(r"^\|\s*TB-(\d+)\s*\|", line)

        if match is None:
            lines.append(line)
            continue

        tb_id = int(match.group(1))

        if in_open_items and tb_id in done_ids:
            removed["done-removed"] += 1
            continue

        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]

        if len(cells) < 3:
            lines.append(line)
            continue

        title = cells[1]
        cluster = cells[2]
        old_priority = parse_priority(cluster) or "?"
        category = parse_category(cluster)

        if tb_id in canonical:
            new_priority = canonical[tb_id]
        else:
            new_priority = target_priority(category, cluster, title)

        if old_priority != new_priority:
            stats[f"{old_priority}->{new_priority}"] += 1
            cells[2] = replace_priority_in_cluster(cluster, new_priority)
            line = "| " + " | ".join(cells) + " |"

        lines.append(line)

    return "\n".join(lines) + "\n", stats, removed


def main() -> None:
    backlog_text = BACKLOG.read_text(encoding="utf-8")
    open_text = OPEN_FILE.read_text(encoding="utf-8")
    canonical, done_ids = parse_backlog_table(backlog_text)
    updated_open, change_stats, removed_stats = update_open_file(open_text, canonical, done_ids)
    OPEN_FILE.write_text(updated_open, encoding="utf-8", newline="\n")

    shippable = updated_open.split("## Open items (V1 / V1.1")[1].split("## Hold")[0]
    counts = Counter()

    for line in shippable.splitlines():
        if not line.startswith("| TB-"):
            continue

        if "~~" in line.split("|", 2)[1] or "**Done**" in line:
            continue

        match = re.match(r"^\|\s*TB-(\d+)\s*\|", line)

        if match is None:
            continue

        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]

        if len(cells) < 3:
            continue

        priority = parse_priority(cells[2]) or "none"
        counts[priority] += 1

    print(f"Canonical open priorities from TECH_BACKLOG table: {len(canonical)}")
    print(f"Done IDs skipped in OPEN shippable section: {len(done_ids)}")
    print(f"OPEN rows removed (done): {dict(removed_stats)}")
    print(f"OPEN priority changes: {dict(change_stats)}")
    print(f"OPEN shippable counts: {dict(counts)} total={sum(counts.values())}")


if __name__ == "__main__":
    main()
