#!/usr/bin/env python3
"""TB-166: Validate release can claim full quad-agent real-mode evidence."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_REQUIRED_AGENT_TYPES = frozenset({"Topology", "Cost", "Compliance", "Critic"})
_AGENT_TYPE_INT_NAMES = {1: "Topology", 2: "Cost", 3: "Compliance", 4: "Critic"}
_GATE_SCHEMA = "archlucid.real-llm-evidence-gate.v2"
_DEFAULT_MAX_AGE_DAYS = 30


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _normalize_agent_type(raw: object) -> str | None:
    if isinstance(raw, str) and raw.strip():
        return raw.strip()

    if isinstance(raw, int):
        return _AGENT_TYPE_INT_NAMES.get(raw)

    return None


def _agent_types_in_fixtures(agent_results_dir: Path) -> set[str]:
    found: set[str] = set()

    for path in sorted(agent_results_dir.glob("*.real.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        name = _normalize_agent_type(payload.get("agentType"))

        if name is not None:
            found.add(name)

    return found


def _parse_gate_json(gate_path: Path) -> dict[str, object]:
    payload = json.loads(gate_path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("gate json root must be an object")

    return payload


def _gate_is_fresh(payload: dict[str, object], max_age_days: int) -> tuple[bool, str]:
    generated = payload.get("generatedUtc")

    if not isinstance(generated, str) or not generated.strip():
        return False, "generatedUtc missing"

    try:
        stamp = datetime.fromisoformat(generated.replace("Z", "+00:00"))
    except ValueError:
        return False, f"generatedUtc not ISO-8601: {generated}"

    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=timezone.utc)

    age = datetime.now(timezone.utc) - stamp.astimezone(timezone.utc)

    if age > timedelta(days=max_age_days):
        return False, f"gate older than {max_age_days} days"

    return True, "fresh"


def evaluate_release_real_mode_claim(
    *,
    agent_results_dir: Path,
    gate_json: Path | None,
    require_gate: bool,
    max_gate_age_days: int,
    allow_simulator_only: bool,
) -> tuple[str, list[dict[str, str]]]:
    rows: list[dict[str, str]] = []

    if allow_simulator_only:
        rows.append(
            {
                "check": "Simulator-only override",
                "result": "PASS",
                "detail": "ARCHLUCID_RELEASE_SIMULATOR_ONLY=1 — full real-mode claim not required",
            }
        )
        return "PASS", rows

    fixture_types = _agent_types_in_fixtures(agent_results_dir)
    missing_fixture_types = sorted(_REQUIRED_AGENT_TYPES - fixture_types)

    if missing_fixture_types:
        rows.append(
            {
                "check": "Committed real-mode fixtures (quad agent)",
                "result": "FAIL",
                "detail": f"Missing agentType coverage: {', '.join(missing_fixture_types)}",
            }
        )
    else:
        rows.append(
            {
                "check": "Committed real-mode fixtures (quad agent)",
                "result": "PASS",
                "detail": f"All four agent types present under {agent_results_dir.name}",
            }
        )

    if gate_json is None or not gate_json.is_file():
        if require_gate:
            rows.append(
                {
                    "check": "real-llm-evidence-gate.json",
                    "result": "FAIL",
                    "detail": "Missing — run scripts/Invoke-RealLlmEvidenceGate.ps1 with AOAI credentials",
                }
            )
        else:
            rows.append(
                {
                    "check": "real-llm-evidence-gate.json",
                    "result": "WARN",
                    "detail": "Optional gate json absent — use simulator-only or partial-real-mode release copy",
                }
            )

        disposition = "HOLD" if missing_fixture_types or require_gate else "WARN"
        return disposition, rows

    try:
        gate = _parse_gate_json(gate_json)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        rows.append(
            {
                "check": "real-llm-evidence-gate.json",
                "result": "FAIL",
                "detail": str(exc),
            }
        )
        return "HOLD", rows

    schema = gate.get("schema")
    disposition = str(gate.get("disposition", "")).upper()
    fresh, fresh_detail = _gate_is_fresh(gate, max_gate_age_days)
    pipeline = gate.get("fullPipelineProfile")
    pipeline_ok = isinstance(pipeline, dict) and bool(pipeline.get("mergeSuccess"))

    if schema != _GATE_SCHEMA:
        rows.append(
            {
                "check": "Gate schema",
                "result": "FAIL",
                "detail": f"Expected {_GATE_SCHEMA}, got {schema!r}",
            }
        )
    else:
        rows.append({"check": "Gate schema", "result": "PASS", "detail": _GATE_SCHEMA})

    if disposition == "PASS":
        gate_result = "PASS"
        gate_detail = "Disposition PASS"
    elif disposition in {"HOLD", "SKIPPED_NO_CREDENTIALS"}:
        gate_result = "FAIL"
        gate_detail = f"Disposition {disposition} — downgrade release copy to simulator-only"
    else:
        gate_result = "WARN"
        gate_detail = f"Disposition {disposition}"

    rows.append(
        {
            "check": "Gate disposition",
            "result": gate_result,
            "detail": gate_detail,
        }
    )

    rows.append(
        {
            "check": "Gate freshness",
            "result": "PASS" if fresh else "FAIL",
            "detail": fresh_detail,
        }
    )

    rows.append(
        {
            "check": "Full pipeline profile",
            "result": "PASS" if pipeline_ok else "FAIL",
            "detail": "fullPipelineProfile.mergeSuccess required for full real-mode claim"
            if not pipeline_ok
            else "Topology+Compliance+Cost+Critic merge evidenced",
        }
    )

    blocking = (
        bool(missing_fixture_types)
        or gate_result == "FAIL"
        or not fresh
        or not pipeline_ok
        or schema != _GATE_SCHEMA
    )

    if blocking:
        return "HOLD", rows

    if gate_result == "WARN":
        return "WARN", rows

    return "PASS", rows


def render_markdown(disposition: str, rows: list[dict[str, str]]) -> str:
    utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "# Release real-mode claim gate (TB-166)",
        "",
        f"Generated (UTC): **{utc}**",
        "",
        f"**Disposition:** **{disposition}**",
        "",
        "Full real-mode AI release claims require committed quad-agent fixtures plus a fresh PASS gate json with full pipeline profile.",
        "",
        "| Check | Result | Detail |",
        "| --- | --- | --- |",
    ]

    for row in rows:
        detail = row["detail"].replace("|", "/")
        lines.append(f"| {row['check']} | {row['result']} | {detail} |")

    lines.append("")
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--agent-results-dir",
        type=Path,
        default=_repo_root() / "tests" / "eval-corpus" / "agent-results",
    )
    parser.add_argument(
        "--gate-json",
        type=Path,
        default=_repo_root() / "artifacts" / "release" / "real-llm-evidence-gate.json",
    )
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument(
        "--require-gate",
        action="store_true",
        help="Fail when gate json is missing (use with ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1).",
    )
    parser.add_argument("--max-gate-age-days", type=int, default=_DEFAULT_MAX_AGE_DAYS)
    parser.add_argument(
        "--allow-simulator-only",
        action="store_true",
        help="Honest simulator-only release — skips quad-agent and gate requirements.",
    )
    args = parser.parse_args(argv)

    disposition, rows = evaluate_release_real_mode_claim(
        agent_results_dir=args.agent_results_dir,
        gate_json=args.gate_json if args.gate_json else None,
        require_gate=args.require_gate,
        max_gate_age_days=args.max_gate_age_days,
        allow_simulator_only=args.allow_simulator_only,
    )

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(disposition, rows), encoding="utf-8")

    print(f"Release real-mode claim disposition: {disposition}")

    if disposition == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
