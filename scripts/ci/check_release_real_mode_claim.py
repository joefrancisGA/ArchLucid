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


def _normalize_commit_sha(sha: object | None) -> str | None:
    if not isinstance(sha, str):
        return None

    normalized = sha.strip().lower()

    if not normalized or normalized == "unknown":
        return None

    return normalized


def _commit_sha_matches(expected_sha: str | None, gate_sha: object | None) -> tuple[bool, str]:
    expected = _normalize_commit_sha(expected_sha)
    actual = _normalize_commit_sha(gate_sha if isinstance(gate_sha, str) else None)

    if expected is None:
        return True, "expected RC commit not supplied"

    if actual is None:
        return False, "gate gitCommitSha missing — regenerate real-llm-evidence-gate.json at the RC commit"

    if actual.startswith(expected) or expected.startswith(actual):
        return True, f"gate gitCommitSha matches RC commit ({actual[:12]})"

    return False, f"gate gitCommitSha {actual[:12]} does not match RC commit {expected[:12]}"


def _load_waiver(waiver_path: Path | None) -> dict[str, object] | None:
    if waiver_path is None or not waiver_path.is_file():
        return None

    payload = json.loads(waiver_path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("waiver json root must be an object")

    return payload


def _waiver_is_valid(waiver: dict[str, object] | None) -> tuple[bool, str]:
    if waiver is None:
        return False, "waiver absent"

    owner = str(waiver.get("owner") or "").strip()
    rationale = str(waiver.get("rationale") or "").strip()

    if not owner:
        return False, "waiver owner missing"

    if not rationale:
        return False, "waiver rationale missing"

    return True, "waiver present"


def resolve_claim_wording_class(
    disposition: str,
    *,
    allow_simulator_only: bool,
    gate_present: bool,
    gate_pass: bool,
    waiver_valid: bool = False,
) -> str:
    if allow_simulator_only:
        return "simulator-only"

    if disposition == "PASS" and gate_pass:
        return "full-real-mode"

    if waiver_valid and disposition in {"WARN", "HOLD"}:
        return "waived-not-verified"

    if gate_present and disposition in {"WARN", "HOLD"}:
        return "partial-real-mode"

    if disposition == "WARN":
        return "partial-real-mode"

    if not gate_present and not gate_pass and disposition == "HOLD":
        return "waiver-required"

    return "simulator-only"


def evaluate_release_real_mode_claim(
    *,
    agent_results_dir: Path,
    gate_json: Path | None,
    require_gate: bool,
    max_gate_age_days: int,
    allow_simulator_only: bool,
    rc_strict_claims: bool = False,
    waiver_json: Path | None = None,
    expected_commit_sha: str | None = None,
) -> tuple[str, list[dict[str, str]], str]:
    rows: list[dict[str, str]] = []
    waiver = _load_waiver(waiver_json) if waiver_json is not None else None
    waiver_valid, waiver_detail = _waiver_is_valid(waiver)

    if waiver is not None:
        rows.append(
            {
                "check": "Real-mode evidence waiver",
                "result": "PASS" if waiver_valid else "FAIL",
                "detail": waiver_detail,
            }
        )

    if allow_simulator_only:
        rows.append(
            {
                "check": "Simulator-only override",
                "result": "PASS",
                "detail": "ARCHLUCID_RELEASE_SIMULATOR_ONLY=1 — full real-mode claim not required",
            }
        )
        return "PASS", rows, "simulator-only"

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
        wording = resolve_claim_wording_class(
            disposition,
            allow_simulator_only=allow_simulator_only,
            gate_present=False,
            gate_pass=False,
            waiver_valid=waiver_valid,
        )
        return disposition, rows, wording

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
        return "HOLD", rows, "partial-real-mode"

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

    commit_ok, commit_detail = _commit_sha_matches(expected_commit_sha, gate.get("gitCommitSha"))
    commit_required = (
        not allow_simulator_only
        and (_normalize_commit_sha(expected_commit_sha) is not None)
        and (rc_strict_claims or disposition == "PASS")
    )

    if commit_required:
        rows.append(
            {
                "check": "Gate commit SHA (RC freshness)",
                "result": "PASS" if commit_ok else "FAIL",
                "detail": commit_detail,
            }
        )

    blocking = (
        bool(missing_fixture_types)
        or gate_result == "FAIL"
        or not fresh
        or not pipeline_ok
        or schema != _GATE_SCHEMA
        or (commit_required and not commit_ok)
    )

    if blocking:
        wording = resolve_claim_wording_class(
            "HOLD",
            allow_simulator_only=False,
            gate_present=True,
            gate_pass=False,
            waiver_valid=waiver_valid,
        )
        return "HOLD", rows, wording

    if gate_result == "WARN":
        wording = resolve_claim_wording_class(
            "WARN",
            allow_simulator_only=False,
            gate_present=True,
            gate_pass=False,
            waiver_valid=waiver_valid,
        )
        return "WARN", rows, wording

    wording = resolve_claim_wording_class(
        "PASS",
        allow_simulator_only=False,
        gate_present=True,
        gate_pass=True,
        waiver_valid=waiver_valid,
    )
    return "PASS", rows, wording


def render_markdown(disposition: str, rows: list[dict[str, str]], claim_wording_class: str) -> str:
    utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        "# Release real-mode claim gate (TB-166)",
        "",
        f"Generated (UTC): **{utc}**",
        "",
        f"**Disposition:** **{disposition}**",
        f"**Claim wording class:** **{claim_wording_class}** "
        "(full-real-mode | partial-real-mode | simulator-only | waived-not-verified | waiver-required)",
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
    parser.add_argument(
        "--rc-strict-claims",
        action="store_true",
        help="RC signoff mode: fail unless PASS with full-real-mode or explicit simulator-only override.",
    )
    parser.add_argument("--json-out", type=Path, default=None)
    parser.add_argument(
        "--waiver-json",
        type=Path,
        default=None,
        help="Optional owner waiver when real evidence is incomplete (waived-not-verified).",
    )
    parser.add_argument(
        "--expected-commit-sha",
        type=str,
        default=None,
        help="RC commit SHA that real-mode gate evidence must match (or ARCHLUCID_RC_COMMIT_SHA).",
    )
    args = parser.parse_args(argv)

    rc_strict = args.rc_strict_claims or __import__("os").environ.get("ARCHLUCID_RC_STRICT_CLAIMS", "").strip() in {
        "1",
        "true",
        "TRUE",
        "yes",
        "YES",
    }
    require_gate = args.require_gate or rc_strict
    expected_commit_sha = args.expected_commit_sha or __import__("os").environ.get("ARCHLUCID_RC_COMMIT_SHA")

    disposition, rows, claim_wording_class = evaluate_release_real_mode_claim(
        agent_results_dir=args.agent_results_dir,
        gate_json=args.gate_json if args.gate_json else None,
        require_gate=require_gate,
        max_gate_age_days=args.max_gate_age_days,
        allow_simulator_only=args.allow_simulator_only,
        rc_strict_claims=rc_strict,
        waiver_json=args.waiver_json if args.waiver_json else None,
        expected_commit_sha=expected_commit_sha,
    )

    blocking_reasons: list[str] = []

    for row in rows:
        if row.get("result") == "FAIL":
            blocking_reasons.append(f"{row['check']}: {row['detail']}")

    allowed_rc_wording = {"full-real-mode", "waived-not-verified", "simulator-only"}

    if rc_strict and claim_wording_class not in allowed_rc_wording:
        blocking_reasons.append(
            f"RC strict claims require wording class in {sorted(allowed_rc_wording)}; got {claim_wording_class!r}"
        )

    if disposition == "HOLD":
        blocking_reasons.append(f"Claim gate disposition is HOLD ({claim_wording_class})")

    payload = {
        "schema": "archlucid.real-mode-claim-gate.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "claimWordingClass": claim_wording_class,
        "claimDisposition": disposition,
        "canonicalEvidenceSource": "staging Azure OpenAI deployment",
        "realModeMandatoryForBuyerFacingRc": True,
        "expectedCommitSha": expected_commit_sha,
        "blockingReasons": blocking_reasons,
        "checks": rows,
    }

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
        args.markdown_out.write_text(render_markdown(disposition, rows, claim_wording_class), encoding="utf-8")

    print(f"Release real-mode claim disposition: {disposition} ({claim_wording_class})")

    allowed_rc_wording = {"full-real-mode", "waived-not-verified", "simulator-only"}

    if rc_strict and claim_wording_class not in allowed_rc_wording:
        return 1

    if rc_strict and disposition != "PASS" and claim_wording_class != "waived-not-verified":
        return 1

    if disposition == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
