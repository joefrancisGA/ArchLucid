#!/usr/bin/env python3
"""Report transactional vs informational audit path semantics for high-value flows."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def build_summary(root: Path) -> dict[str, object]:
    fixture_path = root / "scripts" / "ci" / "fixtures" / "audit_path_semantics.json"
    matrix_path = root / "docs" / "library" / "AUDIT_COVERAGE_MATRIX.md"
    flows = json.loads(fixture_path.read_text(encoding="utf-8")).get("flows", [])
    matrix_text = matrix_path.read_text(encoding="utf-8").lower() if matrix_path.is_file() else ""
    rows: list[dict[str, object]] = []

    for flow in flows:
        hints = [str(h).lower() for h in flow.get("matrixHints", [])]
        documented = any(h in matrix_text for h in hints)
        rows.append(
            {
                "name": flow.get("name"),
                "auditClass": flow.get("auditClass"),
                "documentedInMatrix": documented,
                "notes": flow.get("notes"),
            }
        )

    undocumented = [r for r in rows if not r.get("documentedInMatrix")]
    disposition = "PASS" if not undocumented else "WARN"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "matrixPath": matrix_path.relative_to(root).as_posix(),
        "fixturePath": fixture_path.relative_to(root).as_posix(),
        "undocumentedFlowCount": len(undocumented),
        "flows": rows,
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Audit path semantics (high-value flows)",
        "",
        f"**Disposition:** {summary.get('disposition')}",
        "",
        "| Flow | Class | Documented in matrix |",
        "| --- | --- | --- |",
    ]

    for row in summary.get("flows", []):
        if not isinstance(row, dict):
            continue

        lines.append(
            f"| {row.get('name')} | {row.get('auditClass')} | {row.get('documentedInMatrix')} |"
        )

    lines.append("")
    lines.append(
        "Transactional paths must fail the user-visible operation when audit persistence fails. "
        "Informational async paths remain best-effort with retry and metrics (TB-001)."
    )
    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    summary = build_summary(root)
    args.markdown_out.write_text(render_markdown(summary), encoding="utf-8")
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return 0 if summary.get("disposition") == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
