#!/usr/bin/env python3
"""Fail-closed contract for the generated SecureNow *synthetic* buyer demo.

Pin the hypothetical claim boundary independently from the workpack generator.
Never echo untrusted input values, identify customers, or authorize beta.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

MAX_BYTES = 65_536
AUDIT_SCHEMA = "securenow.demo.synthetic-contract-audit.v1"

# This is independent of the generator by design; reviewing a fixture change
# requires reviewing its permitted language and meaning in this contract.
EXPECTED = {
    "schema": "securenow.demo.synthetic-decision-path.v1",
    "source": "SYNTHETIC_ILLUSTRATIVE_ONLY",
    "noCustomerEvidence": True,
    "scenario": "Hypothetical storage exposure review",
    "baseline": {
        "evidenceClass": "SyntheticFixture",
        "asset": "example-storage-account",
        "observedProperty": "publicNetworkAccess=Enabled (fixture only)",
        "pathClaim": "POSSIBLE_REACHABILITY_NOT_OBSERVED_TRAFFIC",
        "confidence": "ORDINAL_UNCALIBRATED",
    },
    "advisory": {
        "cutPoint": "Review public network access policy with owner",
        "actionMode": "EXTERNAL_HUMAN_APPROVAL_REQUIRED",
        "platformMutation": False,
    },
    "verification": {
        "state": "NOT_VERIFIED",
        "reason": "No real later authorized capture, analysis completion or human attestation",
        "requiredInputs": [
            "laterCaptureId", "laterCaptureTimestamp", "analysisComplete",
            "substantivePostcondition", "externalChangeAttestation",
        ],
    },
    "buyerDecision": "Evaluate evidence usefulness; no savings or incident prevention claimed",
}


def validate(payload: object) -> list[str]:
    """Compare strict types, exact values and allowed keys; return safe reason codes."""
    errors: list[str] = []

    def walk(actual: object, expected: object, where: str) -> None:
        if type(actual) is not type(expected):
            errors.append(where + ":type")
        elif isinstance(expected, dict):
            # Do not expose unexpected keys: a key itself may contain PII.
            if actual.keys() - expected.keys():
                errors.append(where + ":unexpected_fields")
            for key, value in expected.items():
                if key not in actual:
                    errors.append(where + "." + key + ":missing")
                else:
                    walk(actual[key], value, where + "." + key)
        elif isinstance(expected, list):
            if len(actual) != len(expected):
                errors.append(where + ":length")
            for index, (a, e) in enumerate(zip(actual, expected)):
                walk(a, e, where + "[" + str(index) + "]")
        elif actual != expected:
            errors.append(where + ":changed")

    walk(payload, EXPECTED, "$")
    return errors


def _unique_pairs(pairs: list[tuple[str, object]]) -> dict:
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def _reject_constant(_value: str) -> None:
    raise ValueError("Non-finite JSON constant")


def load_payload(path: Path) -> object:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise ValueError("Invalid input file")
    return json.loads(path.read_text(encoding="utf-8"),
                      object_pairs_hook=_unique_pairs, parse_constant=_reject_constant)


def audit(input_path: Path, output_path: Path | None = None) -> tuple[dict, int]:
    try:
        issues = validate(load_payload(input_path))
    except (OSError, UnicodeError, ValueError):
        issues = ["INPUT_INVALID_OR_UNREADABLE"]
    report = {
        "schema": AUDIT_SCHEMA,
        "status": "CONFORMANT_SYNTHETIC_ONLY" if not issues else "REJECTED",
        "syntheticOnly": True,
        "customerEvidenceAttested": False,
        "platformChangeApproved": False,
        "betaGo": False,
        "issues": issues,
    }
    if output_path is not None:
        if output_path.resolve() == input_path.resolve() or output_path.is_symlink():
            raise ValueError("Audit output must not overwrite input or symlink")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report, 0 if not issues else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        report, exit_code = audit(args.input, args.output)
    except ValueError:
        print("Synthetic demo contract audit rejected invalid output path")
        return 1
    print("Synthetic demo contract: " + report["status"] + "; issues=" + str(len(report["issues"])))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
