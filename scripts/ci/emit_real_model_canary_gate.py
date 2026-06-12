#!/usr/bin/env python3
"""Emit structured real-model canary gate artifact for RC/release workflows (T1-4)."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

_GATE_SCHEMA = "archlucid.real-model-canary-gate.v1"
_CREDENTIAL_PAIRS: tuple[tuple[str, str], ...] = (
    ("ARCHLUCID_REAL_AOAI_TEST_ENDPOINT", "ARCHLUCID_REAL_AOAI_TEST_KEY"),
    ("AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_API_KEY"),
    ("ARCHLUCID_CI_REAL_AOAI_ENDPOINT", "ARCHLUCID_CI_REAL_AOAI_KEY"),
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _env_present(name: str) -> bool:
    return bool(os.environ.get(name, "").strip())


def credentials_available() -> tuple[bool, str]:
    for endpoint_name, key_name in _CREDENTIAL_PAIRS:
        if _env_present(endpoint_name) and _env_present(key_name):
            return True, f"{endpoint_name}+{key_name}"

    return False, "no credential pair present in environment"


def waiver_requested() -> tuple[bool, str | None, str | None]:
    if os.environ.get("ARCHLUCID_REAL_MODE_CANARY_WAIVER", "").strip() not in {"1", "true", "TRUE"}:
        return False, None, None

    owner = os.environ.get("ARCHLUCID_REAL_MODE_CANARY_WAIVER_OWNER", "").strip() or None
    rationale = os.environ.get("ARCHLUCID_REAL_MODE_CANARY_WAIVER_RATIONALE", "").strip() or None

    return True, owner, rationale


def resolve_claim_wording_class(
    *,
    disposition: str,
    canary_result: str,
    rc_strict: bool,
) -> str:
    if canary_result == "PASS":
        return "full-real-mode"

    if canary_result == "WAIVED":
        return "simulator-only"

    if canary_result in {"SKIPPED_NO_CREDENTIALS", "SKIPPED"}:
        return "simulator-only"

    if disposition == "WAIVER_REQUIRED_FAIL":
        return "blocked-pending-waiver"

    if canary_result == "FAIL":
        return "partial-real-mode"

    if rc_strict and disposition in {"FAIL", "WAIVED"}:
        return "simulator-only" if disposition == "WAIVED" else "partial-real-mode"

    return "partial-real-mode"


def allowed_claim_wording_summary(claim_wording_class: str) -> str:
    summaries = {
        "full-real-mode": (
            "Allowed: controlled-pilot claims backed by current real-model canary evidence. "
            "Prohibited: SOC 2 CPA, third-party pen-test, or broad public-reference claims."
        ),
        "simulator-only": (
            "Allowed: simulator-backed architecture review, audit trail, and governance workflows. "
            "Prohibited: live Azure OpenAI / full-real AI quality claims without fresh real evidence."
        ),
        "partial-real-mode": (
            "Allowed: mixed or partial real-mode posture with explicit limitations in release notes. "
            "Prohibited: full-real quad-agent quality claims until evidence is PASS and current."
        ),
        "blocked-pending-waiver": (
            "Allowed: none for buyer-facing AI claims on this RC cut. "
            "Required: attach real-model canary credentials or an explicit owner waiver before signoff."
        ),
    }

    return summaries.get(
        claim_wording_class,
        "Allowed wording must follow release evidence artifacts; do not exceed claim-readiness posture.",
    )


def run_bounded_canary_prereq_check() -> tuple[str, str]:
    script = repo_root() / "scripts" / "ci" / "verify_real_mode_prereqs.ps1"

    if not script.is_file():
        return "FAIL", "verify_real_mode_prereqs.ps1 missing"

    command = [
        "pwsh",
        "-NoProfile",
        "-File",
        str(script),
        "-Profile",
        "CiLiveAoai",
        "-Strict",
    ]
    completed = subprocess.run(command, cwd=repo_root(), capture_output=True, text=True, check=False)

    if completed.returncode == 0:
        return "PASS", "CiLiveAoai strict prereq check passed"

    detail = (completed.stderr or completed.stdout or "strict prereq check failed").strip()
    return "FAIL", detail[:500]


def evaluate_gate(*, rc_strict: bool) -> dict[str, object]:
    creds_ok, cred_detail = credentials_available()
    waiver, owner, rationale = waiver_requested()
    canary_result = "SKIPPED"
    canary_detail = "credentials not evaluated for live canary"

    if creds_ok:
        canary_result, canary_detail = run_bounded_canary_prereq_check()
    elif waiver:
        canary_result = "WAIVED"
        canary_detail = f"Owner waiver by {owner or '(unset)'}: {rationale or '(no rationale)'}"
    elif rc_strict:
        canary_result = "WAIVER_REQUIRED_FAIL"
        canary_detail = (
            "RC/release requires live canary credentials or explicit owner waiver "
            "(ARCHLUCID_REAL_MODE_CANARY_WAIVER=1 + OWNER + RATIONALE)"
        )
    else:
        canary_result = "SKIPPED_NO_CREDENTIALS"
        canary_detail = cred_detail

    if canary_result == "PASS":
        disposition = "PASS"
    elif canary_result in {"SKIPPED_NO_CREDENTIALS"}:
        disposition = "SKIP"
    elif canary_result == "WAIVED":
        disposition = "WAIVED"
    elif canary_result == "WAIVER_REQUIRED_FAIL":
        disposition = "WAIVER_REQUIRED_FAIL"
    else:
        disposition = "FAIL"

    claim_wording_class = resolve_claim_wording_class(
        disposition=disposition,
        canary_result=canary_result,
        rc_strict=rc_strict,
    )

    blocking_reasons: list[str] = []

    if disposition in {"FAIL", "WAIVER_REQUIRED_FAIL"}:
        blocking_reasons.append(
            f"Real-model canary disposition {disposition} ({canary_detail})"
        )

    if rc_strict and claim_wording_class == "blocked-pending-waiver":
        blocking_reasons.append(
            "RC strict canary requires owner waiver env vars or live credentials"
        )

    return {
        "schema": _GATE_SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "claimWordingClass": claim_wording_class,
        "allowedClaimSummary": allowed_claim_wording_summary(claim_wording_class),
        "rcStrict": rc_strict,
        "credentialsPresent": creds_ok,
        "credentialDetail": cred_detail,
        "canaryResult": canary_result,
        "canaryDetail": canary_detail,
        "blockingReasons": blocking_reasons,
        "waiver": {
            "requested": waiver,
            "owner": owner,
            "rationale": rationale,
        },
    }


def render_markdown(payload: dict[str, object]) -> str:
    lines = [
        "# Real-model canary gate",
        "",
        f"**Disposition:** {payload.get('disposition')}",
        f"**Claim wording class:** {payload.get('claimWordingClass')}",
        f"**RC strict:** {payload.get('rcStrict')}",
        f"**Canary result:** {payload.get('canaryResult')}",
        "",
        str(payload.get("canaryDetail")),
        "",
        "## Allowed buyer wording",
        "",
        str(payload.get("allowedClaimSummary")),
        "",
        "Policy: [`RC_RELEASE_GATE.md`](../runbooks/RC_RELEASE_GATE.md)",
        "",
    ]

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument(
        "--rc-strict",
        action="store_true",
        help="RC/release context: credential-missing is waiver-required fail unless waiver env is set.",
    )
    args = parser.parse_args(argv)

    rc_strict = args.rc_strict or os.environ.get("ARCHLUCID_RC_RELEASE_CONTEXT", "").strip() in {
        "1",
        "true",
        "TRUE",
    }
    payload = evaluate_gate(rc_strict=rc_strict)

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    disposition = str(payload["disposition"])
    print(f"emit_real_model_canary_gate: {disposition}")

    if disposition in {"FAIL", "WAIVER_REQUIRED_FAIL"}:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
