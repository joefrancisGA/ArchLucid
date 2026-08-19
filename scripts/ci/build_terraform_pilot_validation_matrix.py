#!/usr/bin/env python3
"""Terraform pilot plan validation matrix (validate-only, no apply)."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


# CI validates these roots; terraform-pilot orchestrates nested order (see REFERENCE_SAAS_STACK_ORDER.md).
_TERRAFORM_CI_ROOTS: tuple[str, ...] = (
    "infra/terraform",
    "infra/terraform-edge",
    "infra/terraform-entra",
    "infra/terraform-container-apps",
    "infra/terraform-storage",
    "infra/terraform-monitoring",
    "infra/terraform-sql-failover",
    "infra/terraform-openai",
    "infra/terraform-keyvault",
    "infra/terraform-orchestrator",
    "infra/terraform-logicapps",
    "infra/terraform-servicebus",
    "infra/terraform-pilot",
)

_PILOT_ESSENTIAL_ROOTS: frozenset[str] = frozenset(
    {
        "infra/terraform",
        "infra/terraform-container-apps",
        "infra/terraform-storage",
        "infra/terraform-keyvault",
        "infra/terraform-openai",
        "infra/terraform-monitoring",
        "infra/terraform-pilot",
    }
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _root_row(root: Path, rel: str) -> dict[str, object]:
    path = root / rel
    exists = path.is_dir()
    has_main = (path / "main.tf").is_file() if exists else False
    return {
        "path": rel,
        "exists": exists,
        "hasMainTf": has_main,
        "pilotEssential": rel in _PILOT_ESSENTIAL_ROOTS,
        "pilotOptional": exists and rel not in _PILOT_ESSENTIAL_ROOTS,
        "validation": "terraform validate (CI)" if exists and has_main else "missing or incomplete",
    }


def build_summary(root: Path) -> dict[str, object]:
    rows = [_root_row(root, rel) for rel in _TERRAFORM_CI_ROOTS]
    essential = [r for r in rows if r.get("pilotEssential")]
    missing_essential = [r["path"] for r in essential if not r.get("exists") or not r.get("hasMainTf")]

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "PASS" if not missing_essential else "WARN",
        "applyPerformed": False,
        "pilotProfileRoot": "infra/terraform-pilot",
        "minimalRunbook": "docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md",
        "missingEssentialRoots": missing_essential,
        "roots": rows,
        "notes": [
            "This matrix is validate-only — it does not run terraform plan or apply.",
            "Private endpoints, WAF, and Redis are optional for first pilot (see minimal runbook).",
        ],
    }


def render_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Terraform pilot validation matrix",
        "",
        "> Validate-only checklist for minimal Azure pilot IaC roots. No secrets, no apply.",
        "",
        f"**Disposition:** {summary.get('disposition')}",
        "",
        "| Root | Pilot essential | Exists | main.tf | Validation |",
        "| --- | --- | --- | --- | --- |",
    ]

    for row in summary.get("roots", []):
        if not isinstance(row, dict):
            continue

        essential = "yes" if row.get("pilotEssential") else "optional"
        lines.append(
            f"| `{row.get('path')}` | {essential} | {row.get('exists')} | {row.get('hasMainTf')} | {row.get('validation')} |"
        )

    lines.extend(["", "## Notes", ""])

    for note in summary.get("notes", []):
        lines.append(f"- {note}")

    if summary.get("missingEssentialRoots"):
        lines.extend(["", "## Missing essential roots", ""])

        for path in summary["missingEssentialRoots"]:
            lines.append(f"- `{path}`")

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
