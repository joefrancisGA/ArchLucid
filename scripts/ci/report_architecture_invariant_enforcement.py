#!/usr/bin/env python3
"""Emit P0/P1 architecture invariant RC enforcement summary (assessment Tier 1 #5)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.architecture-invariant-rc-summary.v1"
_REGISTRY_REL = Path("scripts/ci/data/architecture_invariant_enforcement.v1.json")
_P0_P1_STATUSES_NEEDING_ATTENTION = frozenset({"convention-only", "partially-enforced", "deferred", "waived"})


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_registry(root: Path) -> dict[str, Any]:
    path = root / _REGISTRY_REL
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("registry root must be an object")

    return payload


def build_summary(registry: dict[str, Any]) -> dict[str, Any]:
    rows = registry.get("invariants")

    if not isinstance(rows, list):
        raise ValueError("invariants must be a list")

    attention: list[dict[str, Any]] = []

    for row in rows:
        if not isinstance(row, dict):
            continue

        tier = str(row.get("tier") or "")
        status = str(row.get("status") or "unknown")

        if tier in {"P0", "P1"} and status in _P0_P1_STATUSES_NEEDING_ATTENTION:
            attention.append(row)

    disposition = "PASS" if not attention else "WARN"

    p0_open = [row for row in attention if row.get("tier") == "P0"]

    if p0_open:
        disposition = "HOLD"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "sourceDoc": registry.get("sourceDoc"),
        "disposition": disposition,
        "p0P1AttentionCount": len(attention),
        "p0OpenCount": len(p0_open),
        "attentionItems": attention,
        "invariants": rows,
        "interpretation": (
            "P0 convention-only or partially enforced invariants are RC attention items. "
            "This summary does not fail ordinary PR CI."
        ),
    }


def render_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Architecture invariant RC enforcement summary",
        "",
        f"Generated UTC: **{summary['generatedUtc']}**",
        "",
        f"**Disposition:** **{summary['disposition']}**",
        f"**P0/P1 attention items:** {summary['p0P1AttentionCount']} (P0 open: {summary['p0OpenCount']})",
        "",
        "| ID | Tier | Status | Label |",
        "| --- | --- | --- | --- |",
    ]

    for row in summary.get("attentionItems") or []:
        lines.append(
            f"| {row.get('id')} | {row.get('tier')} | **{row.get('status')}** | {row.get('label')} |"
        )

    if not summary.get("attentionItems"):
        lines.append("| — | — | — | No P0/P1 attention items |")

    lines.extend(["", str(summary["interpretation"]), ""])
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--strict-rc",
        action="store_true",
        help="Exit non-zero when disposition is HOLD (also enabled by ARCHLUCID_STRICT_RC=1).",
    )
    args = parser.parse_args(argv)

    registry = load_registry(args.repo_root.resolve())
    summary = build_summary(registry)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")

    print(f"Architecture invariant RC summary: {summary['disposition']}")

    strict_rc = args.strict_rc or os.environ.get("ARCHLUCID_STRICT_RC", "").strip() in {
        "1",
        "true",
        "TRUE",
        "yes",
        "YES",
    }

    if strict_rc and summary["disposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
