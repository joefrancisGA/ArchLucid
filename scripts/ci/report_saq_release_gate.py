#!/usr/bin/env python3
"""Emit open strong-model architecture question (SAQ) RC gate status."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.saq-release-gate.v1"
_DEFAULT_SAQ_PATH = Path("docs/library/SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md")
_TABLE_ROW_RE = re.compile(
    r"^\|\s*\*\*(SAQ-\d+)\*\*\s*\|\s*([^|]+?)\s*\|\s*\*\*([^*]+)\*\*\s*\|(?P<rest>.*)\|$"
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _clean_cell(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("`", "").strip())


def parse_saq_rows(markdown: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for line in markdown.splitlines():
        match = _TABLE_ROW_RE.match(line.strip())

        if match is None:
            continue

        saq_id = match.group(1)
        priority = _clean_cell(match.group(2))
        status = _clean_cell(match.group(3))
        rest = match.group("rest")
        cells = [_clean_cell(cell) for cell in rest.split("|")]
        question = cells[0] if cells else ""
        resolution = cells[-1] if cells else ""

        rows.append(
            {
                "id": saq_id,
                "priority": priority,
                "status": status,
                "question": question,
                "resolution": resolution,
            }
        )

    return rows


def build_saq_release_gate(
    rows: list[dict[str, Any]],
    *,
    waiver: dict[str, Any] | None = None,
) -> dict[str, Any]:
    waiver = waiver or {}
    waived_ids = {
        str(row.get("saqId") or row.get("id") or "").strip()
        for row in waiver.get("waivers", [])
        if isinstance(row, dict)
    }
    open_rows = [
        row
        for row in rows
        if str(row.get("status") or "").lower() == "open"
        and str(row.get("priority") or "") in {"P0", "P1"}
    ]
    p0_open = [row for row in open_rows if row.get("priority") == "P0"]
    p1_open = [row for row in open_rows if row.get("priority") == "P1"]
    unwaived_p0 = [row for row in p0_open if row["id"] not in waived_ids]
    unwaived_p1 = [row for row in p1_open if row["id"] not in waived_ids]

    if unwaived_p0:
        disposition = "HOLD"
    elif unwaived_p1:
        disposition = "WARN"
    else:
        disposition = "PASS"

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "openP0Count": len(p0_open),
        "openP1Count": len(p1_open),
        "waivedOpenP0Count": len(p0_open) - len(unwaived_p0),
        "waivedOpenP1Count": len(p1_open) - len(unwaived_p1),
        "openItems": open_rows,
        "blockingReasons": [
            f"{row['id']} is open P0 and has no release waiver" for row in unwaived_p0
        ],
        "warningReasons": [
            f"{row['id']} is open P1 and has no release waiver" for row in unwaived_p1
        ],
        "waiverArtifactPresent": bool(waiver),
        "policy": (
            "Open P0 SAQs are RC HOLD unless a structured waiver artifact is attached. "
            "Open P1 SAQs are WARN unless release policy elevates them."
        ),
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# SAQ release gate",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"**Disposition:** **{payload['disposition']}**",
        "",
        "| Signal | Count |",
        "| --- | ---: |",
        f"| Open P0 | {payload['openP0Count']} |",
        f"| Open P1 | {payload['openP1Count']} |",
        f"| Waived open P0 | {payload['waivedOpenP0Count']} |",
        f"| Waived open P1 | {payload['waivedOpenP1Count']} |",
        "",
        "## Open P0/P1 SAQs",
        "",
        "| SAQ | Priority | Status | Resolution |",
        "| --- | --- | --- | --- |",
    ]

    for row in payload.get("openItems") or []:
        resolution = str(row.get("resolution") or "").replace("|", "/")[:140]
        lines.append(
            f"| {row.get('id')} | {row.get('priority')} | {row.get('status')} | {resolution} |"
        )

    if not payload.get("openItems"):
        lines.append("| - | - | - | No open P0/P1 SAQs |")

    lines.extend(["", payload["policy"], ""])
    return "\n".join(lines)


def _load_json(path: Path | None) -> dict[str, Any] | None:
    if path is None or not path.is_file():
        return None

    return json.loads(path.read_text(encoding="utf-8"))


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--saq-path", type=Path, default=_DEFAULT_SAQ_PATH)
    parser.add_argument("--waiver-json", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--strict-rc", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = args.repo_root.resolve()
    saq_path = args.saq_path if args.saq_path.is_absolute() else root / args.saq_path
    waiver_path = (
        args.waiver_json
        if args.waiver_json is None or args.waiver_json.is_absolute()
        else root / args.waiver_json
    )
    rows = parse_saq_rows(saq_path.read_text(encoding="utf-8"))
    payload = build_saq_release_gate(rows, waiver=_load_json(waiver_path))

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(f"SAQ release gate: {payload['disposition']}")

    if args.strict_rc and payload["disposition"] == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
