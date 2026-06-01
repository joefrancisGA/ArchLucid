#!/usr/bin/env python3
"""Ensure commercial-closeout.json agrees with go-no-go-summary.json (TB-131)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def expected_commercial_disposition(summary: dict[str, object]) -> str:
    blocks = int(summary.get("blockCount") or 0)
    sponsor = str(summary.get("sponsorPacketDisposition") or "HOLD")

    if blocks > 0:
        return "HOLD"

    if sponsor == "DEFERRED_SCOPE":
        return "DEFERRED_SCOPE"

    if sponsor in {"READY", "WARN"}:
        return "PASS"

    return "HOLD"


def consistency_violations(summary: dict[str, object], closeout: dict[str, object]) -> list[str]:
    violations: list[str] = []

    expected = expected_commercial_disposition(summary)
    actual = str(closeout.get("commercialDisposition") or "")

    if actual != expected:
        violations.append(
            f"commercialDisposition {actual!r} != expected {expected!r} from sponsorPacketDisposition/blockCount",
        )

    if str(closeout.get("sponsorPacketDisposition") or "") != str(summary.get("sponsorPacketDisposition") or ""):
        violations.append("closeout sponsorPacketDisposition diverges from go-no-go-summary")

    if str(closeout.get("roiBasisStatus") or "") != str(summary.get("roiBasisStatus") or ""):
        violations.append("closeout roiBasisStatus diverges from go-no-go-summary")

    if bool(closeout.get("roiSponsorSafe")) != bool(summary.get("roiSponsorSafe")):
        violations.append("closeout roiSponsorSafe diverges from go-no-go-summary")

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--go-no-go-summary", type=Path, required=True)
    parser.add_argument("--commercial-closeout", type=Path, required=True)
    parser.add_argument("--commercial-closeout-md", type=Path, default=None)
    args = parser.parse_args(argv)

    summary = load_json(args.go_no_go_summary)
    closeout = load_json(args.commercial_closeout)
    violations = consistency_violations(summary, closeout)

    if args.commercial_closeout_md and args.commercial_closeout_md.is_file():
        md = args.commercial_closeout_md.read_text(encoding="utf-8")
        disposition = str(closeout.get("commercialDisposition") or "")

        if disposition and disposition not in md:
            violations.append("commercial-closeout.md missing commercialDisposition value")

    if violations:
        print("Commercial closeout consistency: FAIL", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Commercial closeout consistency: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
