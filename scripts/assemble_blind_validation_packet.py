#!/usr/bin/env python3
"""Assemble anonymized blind-validation review packets from committed-run fixtures.

Produces facilitator and reviewer artifacts for principal-architect insight validation
without altering product runtime behavior.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA_PACKET = "archlucid.blind-validation-packet.v1"
_SCHEMA_SCORING = "archlucid.blind-insight-validation-scoring.v1"
_SCHEMA_SUMMARY = "archlucid.blind-insight-validation-summary.v1"

_RATING_FIELDS: tuple[str, ...] = (
    "novelty",
    "correctnessConfidence",
    "actionability",
    "surpriseFactor",
    "decisionImpact",
)

_RATING_GUIDANCE: dict[str, str] = {
    "novelty": "1 = obvious to any architect · 5 = non-obvious and valuable",
    "correctnessConfidence": "1 = likely wrong vs packet · 5 = high confidence correct",
    "actionability": "1 = vague · 5 = clear sponsor/team next step",
    "surpriseFactor": "1 = expected in first pass · 5 = would not have written unprompted",
    "decisionImpact": "1 = informational only · 5 = would change approval or priority",
}


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_json(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    return payload


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def _finding_body(finding: dict[str, Any]) -> str:
    title = str(finding.get("title") or "").strip()
    detail = str(finding.get("detail") or finding.get("message") or "").strip()

    if title and detail:
        return f"{title} — {detail}"

    return title or detail or "(no finding text)"


def _severity_label(finding: dict[str, Any]) -> str:
    return str(finding.get("severity") or "Unknown").strip()


def _category_label(finding: dict[str, Any]) -> str:
    return str(finding.get("category") or "General").strip()


@dataclass(frozen=True)
class BlindArm:
    arm_code: str
    source_key: str
    source_label: str
    findings: list[dict[str, str]]


def _anonymize_findings(
    raw_findings: list[dict[str, Any]],
    arm_code: str,
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    for index, finding in enumerate(raw_findings, start=1):
        rows.append(
            {
                "findingCode": f"{arm_code}-F{index:02d}",
                "severity": _severity_label(finding),
                "category": _category_label(finding),
                "body": _finding_body(finding),
            }
        )

    return rows


def _resolve_fixture_dir(fixture: Path) -> Path:
    resolved = fixture.resolve()

    if resolved.is_file():
        if resolved.name != "package.json":
            raise ValueError("Fixture file must be package.json")

        return resolved.parent

    package = resolved / "package.json"

    if not package.is_file():
        raise FileNotFoundError(f"Missing fixture package.json under {resolved}")

    return resolved


def _load_fixture_package(fixture_dir: Path) -> dict[str, Any]:
    package = _load_json(fixture_dir / "package.json")
    schema = str(package.get("schema") or "")

    if schema != "archlucid.blind-validation-fixture.v1":
        raise ValueError(f"Unsupported fixture schema: {schema or '(missing)'}")

    return package


def _load_arm_findings(fixture_dir: Path, findings_file: str) -> list[dict[str, Any]]:
    payload = _load_json(fixture_dir / findings_file)
    findings = payload.get("findings")

    if not isinstance(findings, list) or not findings:
        raise ValueError(f"No findings[] in {findings_file}")

    return [row for row in findings if isinstance(row, dict)]


def _assign_arm_codes(seed: int | None) -> tuple[str, str]:
    rng = random.Random(seed)
    first, second = "A", "B"

    if rng.random() < 0.5:
        first, second = second, first

    return first, second


def build_blind_packet(fixture_dir: Path, seed: int | None = None) -> dict[str, Any]:
    package = _load_fixture_package(fixture_dir)
    arms_meta = package.get("arms")

    if not isinstance(arms_meta, dict):
        raise ValueError("Fixture package.json missing arms object")

    arch_meta = arms_meta.get("archlucid")
    manual_meta = arms_meta.get("manualAi")

    if not isinstance(arch_meta, dict) or not isinstance(manual_meta, dict):
        raise ValueError("Fixture arms must include archlucid and manualAi entries")

    arch_findings = _load_arm_findings(fixture_dir, str(arch_meta["findingsFile"]))
    manual_findings = _load_arm_findings(fixture_dir, str(manual_meta["findingsFile"]))

    arm_a_code, arm_b_code = _assign_arm_codes(seed)

    if random.Random(seed).random() < 0.5:
        first_source, second_source = "archlucid", "manualAi"
        first_label, second_label = (
            str(arch_meta.get("sourceLabel") or "ArchLucid"),
            str(manual_meta.get("sourceLabel") or "Manual AI baseline"),
        )
        first_rows, second_rows = arch_findings, manual_findings
    else:
        first_source, second_source = "manualAi", "archlucid"
        first_label, second_label = (
            str(manual_meta.get("sourceLabel") or "Manual AI baseline"),
            str(arch_meta.get("sourceLabel") or "ArchLucid"),
        )
        first_rows, second_rows = manual_findings, arch_findings

    arm_a = BlindArm(
        arm_code=arm_a_code,
        source_key=first_source,
        source_label=first_label,
        findings=_anonymize_findings(first_rows, arm_a_code),
    )
    arm_b = BlindArm(
        arm_code=arm_b_code,
        source_key=second_source,
        source_label=second_label,
        findings=_anonymize_findings(second_rows, arm_b_code),
    )

    deltas_file = str(package.get("pilotRunDeltasFile") or "")
    deltas_summary: dict[str, Any] | None = None

    if deltas_file:
        deltas_path = fixture_dir / deltas_file

        if deltas_path.is_file():
            deltas_summary = {
                "findingsBySeverity": _load_json(deltas_path).get("findingsBySeverity"),
                "auditRowCount": _load_json(deltas_path).get("auditRowCount"),
                "isDemoTenant": _load_json(deltas_path).get("isDemoTenant"),
            }

    return {
        "schema": _SCHEMA_PACKET,
        "generatedUtc": _utc_now(),
        "fixtureId": package.get("fixtureId"),
        "packetLabel": package.get("packetLabel"),
        "executionMode": package.get("executionMode"),
        "evidenceBasis": package.get("evidenceBasis"),
        "isDemoData": bool(package.get("isDemoData")),
        "architecturePacketSummary": package.get("architecturePacketSummary"),
        "blindArms": [
            {
                "armCode": arm_a.arm_code,
                "findingCount": len(arm_a.findings),
                "findings": arm_a.findings,
            },
            {
                "armCode": arm_b.arm_code,
                "findingCount": len(arm_b.findings),
                "findings": arm_b.findings,
            },
        ],
        "reviewerInstructions": [
            "Score each material finding before learning which arm is ArchLucid.",
            "Use the 1–5 scales in scoring-sheet.json; leave ratings null until the session.",
            "Do not treat demo-derived fixtures as customer proof.",
        ],
        "pilotRunDeltasSummary": deltas_summary,
        "sourceKey": {
            arm_a.arm_code: {
                "sourceKey": arm_a.source_key,
                "sourceLabel": arm_a.source_label,
            },
            arm_b.arm_code: {
                "sourceKey": arm_b.source_key,
                "sourceLabel": arm_b.source_label,
            },
        },
    }


def build_scoring_sheet(packet: dict[str, Any], session_id: str | None = None) -> dict[str, Any]:
    ratings: list[dict[str, Any]] = []

    for arm in packet.get("blindArms") or []:
        if not isinstance(arm, dict):
            continue

        arm_code = str(arm.get("armCode") or "")

        for finding in arm.get("findings") or []:
            if not isinstance(finding, dict):
                continue

            ratings.append(
                {
                    "armCode": arm_code,
                    "findingCode": finding.get("findingCode"),
                    "severity": finding.get("severity"),
                    "category": finding.get("category"),
                    "body": finding.get("body"),
                    "novelty": None,
                    "correctnessConfidence": None,
                    "actionability": None,
                    "surpriseFactor": None,
                    "decisionImpact": None,
                    "classification": None,
                    "reviewerNotes": "",
                }
            )

    return {
        "schema": _SCHEMA_SCORING,
        "generatedUtc": _utc_now(),
        "sessionId": session_id or f"blind-session-{packet.get('fixtureId')}",
        "fixtureId": packet.get("fixtureId"),
        "packetLabel": packet.get("packetLabel"),
        "ratingScale": _RATING_GUIDANCE,
        "classificationCodes": {
            "O": "Obvious — competent architect would state without AI",
            "U": "Useful — correct and actionable but not surprising",
            "N": "Non-obvious — correct and not expected in first pass",
            "X": "Wrong / unsupported — incorrect or not grounded in packet",
            "S": "Skipped — not produced when expected",
        },
        "ratings": ratings,
        "sessionMetadata": {
            "participantRole": "",
            "facilitator": "",
            "frontierAiBaselineModel": "",
            "archLucidExecutionMode": packet.get("executionMode"),
            "reuseIntent": None,
            "reuseBlocker": "",
        },
    }


def render_reviewer_packet_markdown(packet: dict[str, Any]) -> str:
    lines = [
        "# Blind insight validation — reviewer packet",
        "",
        f"**Packet label:** {packet.get('packetLabel')}",
        f"**Evidence basis:** {packet.get('evidenceBasis')} · **Execution mode (ArchLucid path):** {packet.get('executionMode')}",
        "",
        str(packet.get("architecturePacketSummary") or ""),
        "",
        "> Reviewer sees **Arm A** and **Arm B** only. Source mapping is in `source-key.json` (facilitator only).",
        "",
    ]

    for arm in packet.get("blindArms") or []:
        if not isinstance(arm, dict):
            continue

        arm_code = arm.get("armCode")
        lines.extend(
            [
                f"## Arm {arm_code}",
                "",
                f"Material findings: **{arm.get('findingCount')}**",
                "",
            ]
        )

        for finding in arm.get("findings") or []:
            if not isinstance(finding, dict):
                continue

            lines.extend(
                [
                    f"### {finding.get('findingCode')} · {finding.get('severity')} · {finding.get('category')}",
                    "",
                    str(finding.get("body") or ""),
                    "",
                ]
            )

    lines.extend(
        [
            "## Scoring",
            "",
            "Complete `scoring-sheet.json` using 1–5 scales:",
            "",
        ]
    )

    for field, guidance in _RATING_GUIDANCE.items():
        lines.append(f"- **{field}** — {guidance}")

    lines.extend(
        [
            "",
            "Optional single-letter **classification** per finding: O / U / N / X / S.",
            "",
            "**Guardrail:** Demo-derived fixtures illustrate protocol shape only — not buyer proof.",
            "",
        ]
    )

    return "\n".join(lines)


def render_facilitator_key_markdown(packet: dict[str, Any]) -> str:
    lines = [
        "# Blind insight validation — facilitator source key",
        "",
        "**Do not share with reviewer until scoring is complete.**",
        "",
        f"Generated UTC: {packet.get('generatedUtc')}",
        "",
        "| Arm | Source |",
        "| --- | --- |",
    ]

    source_key = packet.get("sourceKey") or {}

    for arm_code, mapping in sorted(source_key.items()):
        if not isinstance(mapping, dict):
            continue

        lines.append(f"| **{arm_code}** | {mapping.get('sourceLabel')} (`{mapping.get('sourceKey')}`) |")

    lines.append("")
    return "\n".join(lines)


def render_exec_summary_template(packet: dict[str, Any]) -> str:
    return "\n".join(
        [
            "# Blind insight validation — Sponsor report (template)",
            "",
            f"**Fixture / packet:** {packet.get('packetLabel')}",
            f"**Sessions aggregated:** _(fill after ≥3 sessions)_",
            "",
            "## Headline metrics (fill from completed scoring sheets)",
            "",
            "| Metric | ArchLucid arm | Manual AI arm | Interpretation guardrail |",
            "| --- | --- | --- | --- |",
            "| Mean novelty (1–5) | | | Do not publish without ≥3 blind sessions |",
            "| Mean surprise factor (1–5) | | | High O-rate ≠ failure; low N-rate = differentiation risk |",
            "| Mean decision impact (1–5) | | | Single session is directional only |",
            "| X / wrong findings (count) | | | Any critical X → engineering priority |",
            "| Reuse intent (yes/maybe/no) | | | Not a product claim until cohort complete |",
            "",
            "## Decision guidance",
            "",
            "- **Advance insight narrative** when ArchLucid N-rate or mean surprise ≥ manual arm across ≥3 sessions.",
            "- **Hold messaging** when N-rate <15% or reuse intent ≤2/5 — run more sessions, not more features.",
            "- **Engineering priority** when critical X findings appear — faithfulness/retrieval, not GTM expansion.",
            "",
            "## Evidence honesty",
            "",
            f"- Execution mode on fixture: **{packet.get('executionMode')}**",
            f"- Evidence basis: **{packet.get('evidenceBasis')}**",
            "- Do not convert demo-derived fixture output into customer outcomes.",
            "",
            "Protocol: `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md` (#blind-insight-validation)",
            "",
        ]
    )


def _mean(values: list[float]) -> float | None:
    if not values:
        return None

    return sum(values) / len(values)


def _arm_source_map(packet: dict[str, Any]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    source_key = packet.get("sourceKey") or {}

    for arm_code, row in source_key.items():
        if isinstance(row, dict):
            mapping[str(arm_code)] = str(row.get("sourceKey") or "")

    return mapping


def summarize_scoring_sheet(
    scoring_sheet: dict[str, Any],
    packet: dict[str, Any] | None = None,
) -> dict[str, Any]:
    source_by_arm = _arm_source_map(packet or {})
    per_arm: dict[str, dict[str, Any]] = {}

    for rating in scoring_sheet.get("ratings") or []:
        if not isinstance(rating, dict):
            continue

        arm_code = str(rating.get("armCode") or "unknown")
        bucket = per_arm.setdefault(
            arm_code,
            {
                "armCode": arm_code,
                "sourceKey": source_by_arm.get(arm_code),
                "findingCount": 0,
                "ratedFindingCount": 0,
                "classificationCounts": {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0},
                "means": {field: [] for field in _RATING_FIELDS},
            },
        )
        bucket["findingCount"] += 1

        has_numeric = False

        for field in _RATING_FIELDS:
            value = rating.get(field)

            if isinstance(value, (int, float)):
                bucket["means"][field].append(float(value))
                has_numeric = True

        if has_numeric:
            bucket["ratedFindingCount"] += 1

        code = str(rating.get("classification") or "").upper()

        if code in bucket["classificationCounts"]:
            bucket["classificationCounts"][code] += 1

    arm_summaries: list[dict[str, Any]] = []

    for arm_code in sorted(per_arm):
        bucket = per_arm[arm_code]
        material = max(bucket["findingCount"], 1)
        n_count = int(bucket["classificationCounts"]["N"])
        arm_summaries.append(
            {
                "armCode": arm_code,
                "sourceKey": bucket.get("sourceKey"),
                "findingCount": bucket["findingCount"],
                "ratedFindingCount": bucket["ratedFindingCount"],
                "classificationCounts": bucket["classificationCounts"],
                "nonObviousShare": round(n_count / material, 3),
                "means": {
                    field: round(value, 2) if (value := _mean(bucket["means"][field])) is not None else None
                    for field in _RATING_FIELDS
                },
            }
        )

    session_meta = scoring_sheet.get("sessionMetadata") if isinstance(scoring_sheet.get("sessionMetadata"), dict) else {}

    return {
        "schema": _SCHEMA_SUMMARY,
        "generatedUtc": _utc_now(),
        "sessionId": scoring_sheet.get("sessionId"),
        "fixtureId": scoring_sheet.get("fixtureId"),
        "packetLabel": scoring_sheet.get("packetLabel"),
        "reuseIntent": session_meta.get("reuseIntent"),
        "armSummaries": arm_summaries,
        "interpretationGuardrails": [
            "Single-session summaries are directional — require ≥3 sessions before messaging changes.",
            "Demo-derived fixtures are protocol illustrations, not customer proof.",
            "Do not publish comparative superiority without measured blind cohort data.",
        ],
    }


def render_summary_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Blind insight validation — session summary",
        "",
        f"**Session:** {summary.get('sessionId')}",
        f"**Packet:** {summary.get('packetLabel')}",
        f"**Reuse intent:** {summary.get('reuseIntent') or 'not recorded'}",
        "",
        "## Per-arm aggregates",
        "",
        "| Arm | Source | Rated | N-share | Mean surprise | Mean decision impact |",
        "| --- | --- | --- | --- | --- | --- |",
    ]

    for arm in summary.get("armSummaries") or []:
        if not isinstance(arm, dict):
            continue

        means = arm.get("means") or {}
        lines.append(
            "| {arm} | {source} | {rated}/{total} | {nshare} | {surprise} | {impact} |".format(
                arm=arm.get("armCode"),
                source=arm.get("sourceKey") or "blinded",
                rated=arm.get("ratedFindingCount"),
                total=arm.get("findingCount"),
                nshare=arm.get("nonObviousShare"),
                surprise=means.get("surpriseFactor"),
                impact=means.get("decisionImpact"),
            )
        )

    lines.extend(["", "## Guardrails", ""])

    for guardrail in summary.get("interpretationGuardrails") or []:
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)


def write_packet_outputs(output_dir: Path, packet: dict[str, Any], scoring_sheet: dict[str, Any]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    _write_json(output_dir / "blind-packet.json", packet)
    _write_json(output_dir / "scoring-sheet.json", scoring_sheet)
    _write_json(output_dir / "source-key.json", {"sourceKey": packet.get("sourceKey")})

    (output_dir / "reviewer-packet.md").write_text(render_reviewer_packet_markdown(packet), encoding="utf-8")
    (output_dir / "facilitator-source-key.md").write_text(render_facilitator_key_markdown(packet), encoding="utf-8")
    (output_dir / "exec-summary.template.md").write_text(render_exec_summary_template(packet), encoding="utf-8")


def assemble_command(fixture: Path, output: Path, seed: int | None, session_id: str | None) -> int:
    fixture_dir = _resolve_fixture_dir(fixture)
    packet = build_blind_packet(fixture_dir, seed=seed)
    scoring_sheet = build_scoring_sheet(packet, session_id=session_id)
    write_packet_outputs(output, packet, scoring_sheet)

    print(f"Wrote blind validation packet to {output.resolve()}")
    return 0


def summarize_command(scoring_path: Path, packet_path: Path | None, output: Path | None) -> int:
    scoring_sheet = _load_json(scoring_path)
    packet = _load_json(packet_path) if packet_path and packet_path.is_file() else None
    summary = summarize_scoring_sheet(scoring_sheet, packet=packet)

    target_dir = output or scoring_path.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    _write_json(target_dir / "session-summary.json", summary)
    (target_dir / "session-summary.md").write_text(render_summary_markdown(summary), encoding="utf-8")

    print(f"Wrote session summary to {target_dir.resolve()}")
    return 0


def _parse_rating_input(prompt: str, allow_blank: bool = False) -> int | None:
    while True:
        raw = input(f"{prompt} (1-5, blank to skip): ").strip()

        if not raw:
            if allow_blank:
                return None

            print("Enter 1-5 or leave blank to skip.")
            continue

        if raw.isdigit():
            value = int(raw)

            if 1 <= value <= 5:
                return value

        print("Invalid rating — use integers 1 through 5.")


def _parse_classification_input() -> str | None:
    while True:
        raw = input("Classification O/U/N/X/S (blank to skip): ").strip().upper()

        if not raw:
            return None

        if raw in {"O", "U", "N", "X", "S"}:
            return raw

        print("Invalid classification — use O, U, N, X, or S.")


def _apply_non_interactive_ratings(
    scoring_sheet: dict[str, Any],
    fill_rating: int | None,
    fill_classification: str | None,
) -> None:
    for rating in scoring_sheet.get("ratings") or []:
        if not isinstance(rating, dict):
            continue

        for field in _RATING_FIELDS:
            if rating.get(field) is None and fill_rating is not None:
                rating[field] = fill_rating

        if rating.get("classification") is None and fill_classification is not None:
            rating["classification"] = fill_classification.upper()


def _prompt_reuse_intent() -> str | None:
    while True:
        raw = input("Reuse intent for next review cycle? yes / maybe / no (blank to skip): ").strip().lower()

        if not raw:
            return None

        if raw in {"yes", "maybe", "no"}:
            return raw

        print("Enter yes, maybe, or no.")


def score_command(
    packet_dir: Path,
    non_interactive: bool,
    fill_rating: int | None,
    fill_classification: str | None,
    auto_summarize: bool,
) -> int:
    scoring_path = packet_dir / "scoring-sheet.json"
    packet_path = packet_dir / "blind-packet.json"

    if not scoring_path.is_file():
        print(f"Missing scoring sheet: {scoring_path}", file=sys.stderr)
        return 1

    scoring_sheet = _load_json(scoring_path)
    ratings = scoring_sheet.get("ratings") or []

    if not ratings:
        print("Scoring sheet has no ratings to complete.", file=sys.stderr)
        return 1

    if non_interactive:
        _apply_non_interactive_ratings(scoring_sheet, fill_rating, fill_classification)
    else:
        print("Blind insight validation — interactive scoring")
        print("Rate each material finding before unblinding. Press Ctrl+C to save progress and exit.")
        print("")

        for index, rating in enumerate(ratings, start=1):
            if not isinstance(rating, dict):
                continue

            print("=" * 72)
            print(
                f"[{index}/{len(ratings)}] Arm {rating.get('armCode')} · "
                f"{rating.get('findingCode')} · {rating.get('severity')} · {rating.get('category')}"
            )
            print(str(rating.get("body") or ""))
            print("")

            for field in _RATING_FIELDS:
                if rating.get(field) is not None:
                    continue

                guidance = _RATING_GUIDANCE.get(field, field)
                value = _parse_rating_input(f"  {field} — {guidance}", allow_blank=True)

                if value is not None:
                    rating[field] = value

            if rating.get("classification") is None:
                classification = _parse_classification_input()

                if classification is not None:
                    rating["classification"] = classification

            _write_json(scoring_path, scoring_sheet)

        session_meta = scoring_sheet.get("sessionMetadata")

        if not isinstance(session_meta, dict):
            session_meta = {}
            scoring_sheet["sessionMetadata"] = session_meta

        if session_meta.get("reuseIntent") is None:
            reuse_intent = _prompt_reuse_intent()

            if reuse_intent is not None:
                session_meta["reuseIntent"] = reuse_intent

            if not str(session_meta.get("reuseBlocker") or "").strip():
                blocker = input("Primary blocker to reuse (blank if none): ").strip()

                if blocker:
                    session_meta["reuseBlocker"] = blocker

    _write_json(scoring_path, scoring_sheet)
    print(f"Updated scoring sheet: {scoring_path.resolve()}")

    if auto_summarize:
        return summarize_command(scoring_path, packet_path if packet_path.is_file() else None, packet_dir)

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Assemble anonymized blind-validation packets from committed-run fixtures.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    assemble = sub.add_parser("assemble", help="Build blind reviewer packet from a fixture directory.")
    assemble.add_argument(
        "--fixture",
        type=Path,
        default=_repo_root() / "fixtures" / "blind-validation" / "regulated-scenario",
        help="Fixture directory or package.json path.",
    )
    assemble.add_argument(
        "--output",
        type=Path,
        default=_repo_root() / "artifacts" / "blind-validation" / "regulated-scenario-sample",
        help="Output directory for packet artifacts.",
    )
    assemble.add_argument("--seed", type=int, default=None, help="Optional RNG seed for arm shuffle.")
    assemble.add_argument("--session-id", default=None, help="Optional session id for scoring sheet.")

    summarize = sub.add_parser("summarize", help="Aggregate a completed scoring sheet.")
    summarize.add_argument("--scoring-sheet", type=Path, required=True, help="Completed scoring-sheet.json path.")
    summarize.add_argument("--packet", type=Path, default=None, help="Optional blind-packet.json for source mapping.")
    summarize.add_argument("--output", type=Path, default=None, help="Summary output directory.")

    score = sub.add_parser("score", help="Complete scoring-sheet.json via interactive CLI prompts.")
    score.add_argument(
        "--packet-dir",
        type=Path,
        required=True,
        help="Directory containing scoring-sheet.json from assemble output.",
    )
    score.add_argument(
        "--non-interactive",
        action="store_true",
        help="Fill unrated fields without prompts (for automation/tests).",
    )
    score.add_argument(
        "--fill-rating",
        type=int,
        default=None,
        choices=range(1, 6),
        help="When --non-interactive, apply this 1-5 rating to all empty numeric fields.",
    )
    score.add_argument(
        "--fill-classification",
        default=None,
        choices=["O", "U", "N", "X", "S"],
        help="When --non-interactive, apply this classification to unrated findings.",
    )
    score.add_argument(
        "--auto-summarize",
        action="store_true",
        help="Run summarize after scoring completes.",
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "assemble":
        return assemble_command(args.fixture, args.output, args.seed, args.session_id)

    if args.command == "summarize":
        return summarize_command(args.scoring_sheet, args.packet, args.output)

    if args.command == "score":
        if args.non_interactive and args.fill_rating is None and args.fill_classification is None:
            parser.error("score --non-interactive requires --fill-rating and/or --fill-classification.")

        return score_command(
            args.packet_dir,
            args.non_interactive,
            args.fill_rating,
            args.fill_classification,
            args.auto_summarize,
        )

    parser.error(f"Unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    sys.exit(main())
