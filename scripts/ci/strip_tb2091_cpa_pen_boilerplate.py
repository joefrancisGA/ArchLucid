#!/usr/bin/env python3
"""TB-2091 one-shot: strip CPA SOC 2 / third-party pen-test boilerplate from non-allowlisted UI chrome."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
UI_SRC = REPO / "archlucid-ui" / "src"

# Basename stems (without .ts) allowed to keep factual CPA/pen-test honesty.
ALLOWLIST_STEMS = frozenset(
    {
        "trust-center-evidence-copy",
        "security-trust-evidence-copy",
        "settings-security-trust-evidence-copy",
        "security-trust-help-evidence-copy",
        "procurement-help-evidence-copy",
        "caiq-sig-response-help-evidence-copy",
        "soc2-self-assessment-help-guide-content",
        "soc2-self-assessment-help-evidence-copy",
        "ui-route-traffic-trust-center",
        "ui-route-traffic-security-trust",
        "ui-route-traffic-settings-security-trust",
        "ui-route-traffic-security-trust-help",
        "ui-route-traffic-procurement-help",
        "ui-route-traffic-caiq-sig-response-help",
        "ui-route-traffic-soc2-self-assessment-help",
    }
)

UNIVERSAL_STRIP = [
    re.compile(r"\s*Does not imply CPA SOC 2 or third-party pen-test publication\.?", re.I),
]

CLAIM_STRIP = [
    re.compile(r",?\s*a CPA(?:-issued)? SOC 2 (?:attestation|report)", re.I),
    re.compile(r",?\s*(?:or\s+)?a published third-party pen[- ]test report", re.I),
    re.compile(r",?\s*(?:or\s+)?published third-party pen[- ]test report", re.I),
    re.compile(r",?\s*(?:or\s+)?a published third-party pen[- ]test summary", re.I),
    re.compile(r"\s*Do not imply CPA SOC 2 or third-party pen-test publication\.?", re.I),
    re.compile(
        r"\s*Do not imply CPA SOC 2 attestation or a published third-party pen[- ]test(?: from this (?:page|demo))?\.?",
        re.I,
    ),
    re.compile(r"\s*Do not imply a published third-party pen[- ]test from this page\.?", re.I),
    re.compile(
        r"\s*and does not imply CPA SOC 2 attestation or a published third-party pen[- ]test\.?",
        re.I,
    ),
    re.compile(
        r"\s*SOC 2 CPA attestation and third-party pen-test publication are not implied here\.?\s*",
        re.I,
    ),
    re.compile(r";\s*not diligence\s*/\s*CPA SOC 2\s*/\s*third-party pen-test", re.I),
    re.compile(r";\s*not CPA SOC 2\s*/\s*third-party pen-test(?: unless linked artifact says so)?", re.I),
    re.compile(r"\s*/\s*CPA SOC 2\s*/\s*third-party pen-test", re.I),
    re.compile(r"\s*—\s*not CPA SOC 2 or third-party pen-test publication\.?", re.I),
    re.compile(r"\s*- not CPA SOC 2 or third-party pen-test publication\.?", re.I),
    re.compile(r"\s*—\s*not CPA SOC 2\.?", re.I),
    re.compile(r",?\s*not a CPA SOC 2 attestation", re.I),
    re.compile(r",?\s*a CPA SOC 2 attestation,", re.I),
    re.compile(
        r",?\s*a CPA SOC 2 attestation,\s*a published third-party pen[- ]test report,\s*or\s+",
        re.I,
    ),
    re.compile(
        r"\bit is help orientation, not a CPA SOC 2 attestation,\s*a published third-party pen[- ]test report,\s*or\s+",
        re.I,
    ),
    # Garbled leftovers from partial list removal
    re.compile(r"\bnot,\s*a published third-party pen[- ]test summary,\s*or\s+", re.I),
    re.compile(r"\bdoes not publish or a third-party pen[- ]test summary", re.I),
    re.compile(r",\s*a published third-party pen[- ]test summary,\s*or\s+", re.I),
]


def is_allowlisted(path: Path) -> bool:
    return path.stem in ALLOWLIST_STEMS


def cleanup_punctuation(text: str) -> str:
    # Do not collapse general spaces — that would destroy TypeScript indentation.
    # Do not strip empty `()` — that breaks `.trim()` and similar calls.
    text = re.sub(r",,+", ",", text)
    text = re.sub(r",\s+,", ",", text)
    text = re.sub(r",\s+\.", ".", text)
    text = re.sub(r"—\s*—", "—", text)
    text = re.sub(r",\s+or\s+or\s+", ", or ", text)
    text = re.sub(r"\bis not,\s+", "is not ", text)
    text = re.sub(r"\bthey are not,\s+", "they are not ", text)
    text = re.sub(r"\bit is not,\s+", "it is not ", text)
    text = re.sub(r",\s*\.", ".", text)
    text = re.sub(r"\(\s*;", "(", text)
    text = re.sub(r";\s*\)", ")", text)
    return text


def strip_text(text: str, *, allowlisted: bool) -> str:
    out = text

    for pattern in UNIVERSAL_STRIP:
        out = pattern.sub("", out)

    if not allowlisted:
        for pattern in CLAIM_STRIP:
            out = pattern.sub("", out)

    return cleanup_punctuation(out)


def candidate_files() -> list[Path]:
    patterns = (
        "*evidence-copy*.ts",
        "*-guide-content.ts",
        "*architecture-created*-sources.ts",
        "run-detail-*-sources.ts",
        "architecture-scorecard-page-copy.ts",
        "sponsor-workspace-health-page-copy.ts",
        "ui-route-traffic-*.ts",
        "signup-invite-only-copy.ts",
    )
    found: set[Path] = set()

    for pattern in patterns:
        found.update(UI_SRC.joinpath("lib").rglob(pattern))

    return sorted(p for p in found if p.is_file() and not p.name.endswith(".test.ts"))


def transform_file(path: Path, *, write: bool) -> bool:
    raw = path.read_bytes()
    newline = b"\r\n" if b"\r\n" in raw else b"\n"
    original = raw.decode("utf-8")
    # Normalize to \n for transforms; restore original newline on write.
    normalized = original.replace("\r\n", "\n").replace("\r", "\n")
    allowlisted = is_allowlisted(path)
    updated_norm = strip_text(normalized, allowlisted=allowlisted)

    if updated_norm == normalized:
        return False

    if write:
        out = updated_norm.replace("\n", newline.decode("ascii"))
        path.write_bytes(out.encode("utf-8"))

    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true", help="Exit 1 if any file would change")
    args = parser.parse_args()
    write = bool(args.write)
    changed: list[Path] = []

    for path in candidate_files():
        if transform_file(path, write=write):
            changed.append(path)

    print(f"{'Wrote' if write else 'Would change'} {len(changed)} files")

    for path in changed[:40]:
        print(f"  {path.relative_to(REPO)}")

    if len(changed) > 40:
        print(f"  ... and {len(changed) - 40} more")

    if args.check and changed:
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
