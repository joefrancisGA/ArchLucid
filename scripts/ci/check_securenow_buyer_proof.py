#!/usr/bin/env python3
"""Fail closed on missing disclosure or obvious unsupported claims in SecureNow demo assets."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILES = (
    ROOT / "docs/securenow/BUYER_PROOF_DEMO.md",
    ROOT / "docs/securenow/BUYER_SECURITY_ONE_PAGER.md",
    ROOT / "docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md",
)
REQUIRED = {
    "BUYER_PROOF_DEMO.md": ("NOT customer evidence", "later successful", "outside", "partial", "provenance"),
    "BUYER_SECURITY_ONE_PAGER.md": (
        "NOT AN APPROVED",
        "NO_GO",
        "outside",
        "NOT VERIFIED",
        "not customer evidence",
        "SOC 2",
    ),
    "EXECUTIVE_PROOF_PACKET_TEMPLATE.md": ("TEMPLATE ONLY", "NOT VERIFIED", "NOT COLLECTED", "human", "ROI"),
}


def validate() -> list[str]:
    errors = []
    for path in FILES:
        if not path.is_file():
            errors.append(f"missing {path.relative_to(ROOT)}")
            continue
        content = path.read_text(encoding="utf-8")
        for token in REQUIRED[path.name]:
            if token.casefold() not in content.casefold():
                errors.append(f"{path.name}: missing disclosure or evidence term {token!r}")
    return errors


if __name__ == "__main__":
    problems = validate()
    for problem in problems:
        print(problem)
    if problems:
        raise SystemExit(1)
    print("SecureNow buyer proof disclosure checks: PASS (static claims only)")
