#!/usr/bin/env python3
"""Build a self-closing REAL_LLM_SESSION markdown record from gate artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_TEMPLATE_REQUIRED_FIELDS = (
    "Date (UTC)",
    "Environment",
    "Agent mode",
    "Run id",
    "Outcome",
    "Quality gate outcome",
    "PilotStrict sponsor-evidence disposition",
    "Human verdict",
    "Gate disposition",
)

_CHECKLIST_ITEMS = (
    "Skimmed agent-backed findings for plausible claims vs manifest.",
    "Opened at least one execution trace; model addressed the request shape.",
    "Confirmed the quality gate outcome is passing before treating the run as sponsor evidence.",
    "Confirmed PilotStrict sponsor-evidence disposition is passing when the host is configured for PilotStrict.",
    "Confirmed retrieval faithfulness / IR reports meet configured floors when retrieval-backed claims are part of the sponsor story.",
)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path | None) -> dict[str, object] | None:
    if path is None or not path.is_file():
        return None

    payload = json.loads(path.read_text(encoding="utf-8"))

    return payload if isinstance(payload, dict) else None


def _agent_coverage_summary(gate: dict[str, object] | None) -> str:
    if gate is None:
        return "not available"

    pipeline = gate.get("fullPipelineProfile")

    if isinstance(pipeline, dict) and pipeline.get("mergeSuccess"):
        return "Topology, Cost, Compliance, Critic (full pipeline mergeSuccess=true)"

    topology = gate.get("topologyProfile")

    if isinstance(topology, dict):
        return "Topology smoke only (full pipeline not evidenced)"

    return "not captured in gate json"


def _resolve_execution_mode(gate: dict[str, object] | None, credentials_present: bool) -> str:
    if not credentials_present:
        return "not invoked (SKIPPED_NO_CREDENTIALS)"

    disposition = str(gate.get("disposition", "")).upper() if gate else ""

    if disposition == "PASS":
        return "Real (golden cohort gate PASS)"

    if disposition in {"HOLD", "WARN"}:
        return "Real attempted — gate did not PASS (see disposition)"

    if disposition == "SKIPPED_NO_CREDENTIALS":
        return "not invoked (SKIPPED_NO_CREDENTIALS)"

    return "unknown — inspect gate json"


def _missing_template_fields(gate: dict[str, object] | None, credentials_present: bool) -> list[str]:
    missing: list[str] = []

    if not credentials_present:
        missing.extend(list(_TEMPLATE_REQUIRED_FIELDS))
        return missing

    if gate is None:
        return list(_TEMPLATE_REQUIRED_FIELDS)

    disposition = str(gate.get("disposition", "")).upper()

    if disposition != "PASS":
        missing.append("Human verdict")
        missing.append("PilotStrict sponsor-evidence disposition")
        missing.append("Outcome")

    if not gate.get("gitCommitSha"):
        missing.append("Commit SHA evidence (gate gitCommitSha)")

    return missing


def resolve_session_status(
    *,
    credentials_present: bool,
    gate: dict[str, object] | None,
    dotnet_exit_code: int | None = None,
) -> str:
    if not credentials_present:
        return "SKIPPED_NO_CREDENTIALS"

    if gate is None:
        return "INCOMPLETE"

    disposition = str(gate.get("disposition", "")).upper()

    if dotnet_exit_code is not None and dotnet_exit_code != 0:
        return "HOLD"

    if disposition == "PASS":
        missing = _missing_template_fields(gate, credentials_present=True)

        if missing:
            return "INCOMPLETE"

        return "PASS"

    if disposition == "WARN":
        return "WARN"

    if disposition in {"HOLD", "SKIPPED_NO_CREDENTIALS"}:
        return "HOLD"

    return "INCOMPLETE"


def build_session_record_markdown(
    *,
    gate_json_path: Path | None,
    gate_markdown_rel: str | None,
    session_markdown_rel: str,
    credentials_present: bool,
    dotnet_exit_code: int | None = None,
    generated_utc: datetime | None = None,
) -> tuple[str, str]:
    gate = _load_json(gate_json_path)
    stamp = (generated_utc or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")
    status = resolve_session_status(
        credentials_present=credentials_present,
        gate=gate,
        dotnet_exit_code=dotnet_exit_code,
    )
    missing = _missing_template_fields(gate, credentials_present)
    commit_sha = gate.get("gitCommitSha") if gate else None
    disposition = str(gate.get("disposition", "—")) if gate else "—"
    execution_mode = _resolve_execution_mode(gate, credentials_present)
    agent_coverage = _agent_coverage_summary(gate)

    lines: list[str] = [
        "# Real-LLM session record (generated)",
        "",
        f"Generated (UTC): **{stamp}**",
        "",
        f"**Session status:** `{status}`",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Gate disposition | `{disposition}` |",
        f"| Execution mode | {execution_mode} |",
        f"| Agent coverage | {agent_coverage} |",
        f"| Commit SHA (gate) | `{commit_sha or '—'}` |",
        f"| Evidence gate markdown | `{gate_markdown_rel or '—'}` |",
        f"| Session record | `{session_markdown_rel}` |",
        f"| Gate json | `{gate_json_path.as_posix() if gate_json_path else '—'}` |",
        "",
    ]

    if status == "SKIPPED_NO_CREDENTIALS":
        lines.extend(
            [
                "Live Azure OpenAI was not invoked. Set `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` "
                "(or `ARCHLUCID_REAL_AOAI_TEST_*`), then re-run `scripts/ci/Invoke-RealLlmGoldenCohort.ps1`.",
                "",
                "**Release use:** This record is **not** release-usable evidence.",
                "",
            ]
        )
    elif status in {"INCOMPLETE", "HOLD", "WARN"}:
        lines.extend(
            [
                "**Release use:** This record is **not** release-usable until status is `PASS` and the checklist below is complete.",
                "",
            ]
        )

        if missing:
            lines.append("## Missing or unresolved template fields")
            lines.append("")

            for field in missing:
                lines.append(f"- {field}")

            lines.append("")

    if status == "PASS":
        lines.extend(
            [
                "**Release use:** Gate disposition is PASS; owner must still complete the human checklist before citing this session in RC evidence.",
                "",
            ]
        )

    lines.extend(
        [
            "## Operator checklist",
            "",
        ]
    )

    for item in _CHECKLIST_ITEMS:
        checked = "x" if status == "PASS" and item.startswith("Confirmed the quality gate") else " "
        lines.append(f"- [{checked}] {item}")

    lines.extend(
        [
            "",
            "Template: [REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)",
            "Buyer index: [AI_READINESS_POSTURE.md](../go-to-market/AI_READINESS_POSTURE.md#buyer-safe-evidence-inventory)",
            "",
        ]
    )

    return "\n".join(lines), status


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--gate-json", type=Path, default=_repo_root() / "artifacts" / "release" / "real-llm-evidence-gate.json")
    parser.add_argument("--gate-markdown-rel", type=str, default="artifacts/release/real-llm-evidence-gate.md")
    parser.add_argument("--session-markdown-out", type=Path, required=True)
    parser.add_argument("--credentials-present", action="store_true")
    parser.add_argument("--dotnet-exit-code", type=int, default=None)
    args = parser.parse_args(argv)

    gate_path = args.gate_json if args.gate_json.is_file() else None
    session_rel = args.session_markdown_out.as_posix()
    if not session_rel.startswith("docs/"):
        try:
            session_rel = args.session_markdown_out.resolve().relative_to(_repo_root()).as_posix()
        except ValueError:
            session_rel = args.session_markdown_out.name

    markdown, status = build_session_record_markdown(
        gate_json_path=gate_path,
        gate_markdown_rel=args.gate_markdown_rel,
        session_markdown_rel=session_rel,
        credentials_present=args.credentials_present,
        dotnet_exit_code=args.dotnet_exit_code,
    )

    args.session_markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.session_markdown_out.write_text(markdown, encoding="utf-8")
    print(f"Real-LLM session status: {status}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
