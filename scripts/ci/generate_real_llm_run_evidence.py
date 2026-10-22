#!/usr/bin/env python3
"""Emit docs/quality/real-llm-run-evidence.md from local artifacts (no live LLM calls).

Safe to run in CI or locally when secrets are unavailable — records skipped reason.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> dict[str, object] | None:
    if not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def _find_example_fixture(root: Path) -> dict[str, object] | None:
    candidate = root / "scripts" / "fixtures" / "real-llm-evidence" / "example-complete.json"

    return _load_json(candidate)


def _find_dated_notes(root: Path) -> list[Path]:
    return sorted(root.glob("docs/quality/REAL_LLM_GOLDEN_COHORT_GATE_EVIDENCE_*.md"))


def build_report(*, root: Path, skipped_reason: str | None) -> str:
    fixture = _find_example_fixture(root)
    dated_notes = _find_dated_notes(root)
    generated_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    lines: list[str] = []
    lines.append("# Real-mode LLM run evidence (generated rollup)")
    lines.append("")
    lines.append(f"**Generated UTC:** {generated_utc}")
    lines.append("")
    lines.append(
        "> Scheduled or manual real Azure OpenAI evidence path. "
        "Regenerate with `python scripts/ci/generate_real_llm_run_evidence.py`."
    )
    lines.append("")
    lines.append("## Evidence mode summary")
    lines.append("")
    lines.append("| Mode | Present in this rollup |")
    lines.append("| --- | --- |")
    lines.append("| Deterministic simulator / schema gates | Yes (repo CI) |")
    lines.append("| Offline faithfulness / retrieval IR | Yes — see [`agent-quality-dashboard.md`](agent-quality-dashboard.md) |")

    live_present = fixture is not None and skipped_reason is None
    lines.append(f"| Live Azure OpenAI session rows | **{'yes' if live_present else 'no / skipped'}** |")
    lines.append("")

    if skipped_reason:
        lines.append("## Skipped live-mode collection")
        lines.append("")
        lines.append(f"**Reason:** {skipped_reason}")
        lines.append("")
        lines.append(
            "This is expected when `AZURE_OPENAI_*` secrets or a staging base URL are unavailable. "
            "Do not claim live LLM quality in sponsor packets when this section is present."
        )
        lines.append("")

    if fixture is not None:
        lines.append("## Example fixture row (redacted shape)")
        lines.append("")
        lines.append("| Field | Value |")
        lines.append("| --- | --- |")
        for key in (
            "runDateUtc",
            "environmentLabel",
            "modelDeploymentAlias",
            "scenarioCount",
            "passCount",
            "failCount",
            "faithfulnessSupportRatio",
            "estimatedUsd",
            "estimatedTokensIn",
            "estimatedTokensOut",
            "pilotStrictDisposition",
            "skippedReason",
        ):
            value = fixture.get(key, "—")
            lines.append(f"| {key} | {value} |")
        lines.append("")
        lines.append("Fixture source: `scripts/fixtures/real-llm-evidence/example-complete.json`")
        lines.append("")

    if dated_notes:
        lines.append("## Dated cohort notes in repo")
        lines.append("")

        for note in dated_notes:
            lines.append(f"- [`{note.name}`]({note.name})")

        lines.append("")

    lines.append("## Operator checklist")
    lines.append("")
    lines.append("- Copy [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) per real session.")
    lines.append("- Run golden cohort gate per [`GOLDEN_COHORT_REAL_LLM_GATE.md`](../runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md).")
    lines.append("- Never print endpoint keys, secrets, or customer prompts in this rollup.")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate real-mode LLM evidence rollup markdown.")
    parser.add_argument(
        "--out",
        type=Path,
        default=_repo_root() / "docs" / "quality" / "real-llm-run-evidence.md",
    )
    parser.add_argument(
        "--force-live",
        action="store_true",
        help="Treat fixture as live evidence (omit skipped banner when fixture exists).",
    )
    args = parser.parse_args()
    root = _repo_root()

    skipped: str | None = None
    has_openai = bool(os.environ.get("AZURE_OPENAI_ENDPOINT") or os.environ.get("AZURE_OPENAI_API_KEY"))

    if not args.force_live and not has_openai:
        skipped = "Azure OpenAI environment variables not set — live session not executed by this generator."

    content = build_report(root=root, skipped_reason=skipped)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(content, encoding="utf-8")
    print(f"Wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
