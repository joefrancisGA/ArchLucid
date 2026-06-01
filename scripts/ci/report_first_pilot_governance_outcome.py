#!/usr/bin/env python3
"""Emit buyer-safe governance outcome summary for first-pilot proof (TB-122)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def load_deltas(path: Path | None) -> dict[str, object]:
    if path is None or not path.is_file():
        return {}

    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError("deltas JSON must be an object")

    return payload


def resolve_disposition(deltas: dict[str, object], pilot_strict_satisfied: bool) -> str:
    if deltas.get("isDemoTenant") is True:
        return "HOLD"

    if not pilot_strict_satisfied:
        return "HOLD"

    proof = deltas.get("proofPackageCompleteness")

    if isinstance(proof, dict):
        sendability = str(proof.get("proofSendability", "")).lower()

        if sendability in {"hold", "blocked", "not_ready"}:
            return "HOLD"

    return "PASS"


def build_payload(run_id: str, deltas: dict[str, object], pilot_strict_satisfied: bool) -> dict[str, object]:
    disposition = resolve_disposition(deltas, pilot_strict_satisfied)
    proof = deltas.get("proofPackageCompleteness") if isinstance(deltas.get("proofPackageCompleteness"), dict) else {}

    return {
        "schema": "archlucid.proof-packet.governance-outcome.v1",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "runId": run_id or "not-supplied",
        "governanceBlockingDecision": "none" if disposition == "PASS" else "review_required",
        "proofDisposition": disposition,
        "publishingTier": proof.get("publishingTier", "not_collected"),
        "proofSendability": proof.get("proofSendability", "not_collected"),
        "evidenceCompleteness": proof.get("evidenceCompleteness", "not_collected"),
        "sponsorProofReadiness": proof.get("sponsorProofReadiness", "not_collected"),
        "agentOutputPilotStrictEvidenceSatisfied": pilot_strict_satisfied,
        "policyPackCertificationClaim": "Policy-pack matches are advisory inputs only — not certification or attestation.",
        "buyerSafeCaveat": (
            "Governance posture is summarized from persisted run evidence; unresolved waivers may still require operator review."
            if disposition == "PASS"
            else "Hold sponsor circulation until governance and proof completeness items are resolved."
        ),
        "policiesAppliedNote": "See enabled policy-pack assignments and governance dry-run artifacts in this proof folder.",
        "unresolvedWaiversNote": "Inspect governance screens and waiver registry when disposition is not PASS.",
    }


def render_markdown(payload: dict[str, object]) -> str:
    disposition = str(payload.get("proofDisposition", "WARN"))
    run_id = str(payload.get("runId", "not-supplied"))

    lines = [
        "# Governance outcome summary",
        "",
        f"**Run id:** `{run_id}`",
        f"**Disposition:** **{disposition}**",
        "",
        "## Buyer-safe status",
        "",
        str(payload.get("buyerSafeCaveat", "")),
        "",
        str(payload.get("policyPackCertificationClaim", "")),
        "",
        "## Proof completeness signals",
        "",
        f"- Publishing tier: {payload.get('publishingTier')}",
        f"- Proof sendability: {payload.get('proofSendability')}",
        f"- Evidence completeness: {payload.get('evidenceCompleteness')}",
        f"- Sponsor proof readiness: {payload.get('sponsorProofReadiness')}",
        "",
        "## Operator notes",
        "",
        str(payload.get("policiesAppliedNote", "")),
        str(payload.get("unresolvedWaiversNote", "")),
        "",
    ]

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", default="")
    parser.add_argument("--deltas-json", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--pilot-strict-satisfied", action="store_true")
    args = parser.parse_args(argv)

    deltas = load_deltas(args.deltas_json)
    payload = build_payload(args.run_id.strip(), deltas, args.pilot_strict_satisfied)
    disposition = str(payload["proofDisposition"])

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    if disposition == "PASS":
        print(f"OK: governance outcome {disposition}")
        return 0

    print(f"WARN: governance outcome {disposition}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
