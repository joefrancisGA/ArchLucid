#!/usr/bin/env python3
"""Offline, fail-closed SecureNow pilot-offer contract drift audit (GTM-05).

This checks the *draft* and its dependency documents, not owner approval, beta
readiness, legal sufficiency, or any customer engagement. No external I/O.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OFFER = "docs/securenow/CONTROLLED_PILOT_OFFER.md"
MATRIX = "docs/securenow/BETA_EVIDENCE_MATRIX.json"
SOURCES = (
    OFFER,
    MATRIX,
    "docs/securenow/BUYER_PROOF_DEMO.md",
    "docs/securenow/BETA_EVIDENCE_GATE.md",
    "docs/securenow/BETA_DEPLOYMENT_SMOKE.md",
)
MAX_BYTES = 256_000


def _read_source(root: Path, relative: str) -> str | None:
    """Reject missing, symlinked, oversized or non-UTF-8 inputs without echoing them."""
    path = root / relative
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
        return None
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return None


def audit(root: Path) -> dict:
    problems: set[str] = set()
    sources: dict[str, str] = {}
    for relative in SOURCES:
        content = _read_source(root, relative)
        if content is None:
            problems.add("SOURCE_MISSING_OR_UNSAFE")
        else:
            sources[relative] = content

    offer = sources.get(OFFER, "")
    if offer:
        # First-party boilerplate is an important guard against inadvertent
        # dissemination of a draft as a purchasable or released product.
        if not re.search(r"(?im)^>\s*\*\*INTERNAL PROPOSAL / NOT AN APPROVED CUSTOMER OFFER\.", offer):
            problems.add("DRAFT_DISCLAIMER_MISSING")
        if not re.search(r"(?i)SecureNow beta release remains \*\*NO_GO\*\*", offer):
            problems.add("BETA_HOLD_MISSING")
        for heading in (
            "Qualification and suitability",
            "Proposed engagement sequence",
            "Measurable acceptance criteria",
            "Proposed commercial terms",
            "Owner-controlled release and sales checklist",
        ):
            if not re.search(r"(?im)^##\s+" + re.escape(heading) + r"\b", offer):
                problems.add("PILOT_SECTION_MISSING")

        sequence = re.findall(r"(?m)^\|\s*([0-9]+)\.\s+[^|\n]+\|", offer)
        if sequence != [str(i) for i in range(7)]:
            problems.add("MILESTONE_SEQUENCE_CHANGED")
        rows = re.findall(r"(?m)^\|\s*[0-9]+\.\s+[^\n]+$", offer)
        stages = {row.split("|", 2)[1].strip().split(".", 1)[0]: row.lower()
                  for row in rows}
        if ("4" not in stages or "customer" not in stages["4"]
                or "human attestation" not in stages["4"]
                or "5" not in stages or "repeat authorized capture" not in stages["5"]
                or "not verified" not in stages["5"]):
            problems.add("CHANGE_OR_VERIFICATION_GUARD_MISSING")

        sections = re.split(r"(?m)^##\s+", offer)
        checklist_sections = [s for s in sections
                              if s.startswith("Owner-controlled release and sales checklist")]
        if len(checklist_sections) != 1:
            problems.add("OWNER_CHECKLIST_MISSING")
        else:
            checklist = checklist_sections[0]
            unchecked = re.findall(r"(?im)^\s*-\s*\[ \]\s+.+$", checklist)
            checked = re.findall(r"(?im)^\s*-\s*\[[xX]\]\s+.+$", checklist)
            if len(unchecked) < 9 or checked:
                problems.add("OWNER_CHECKLIST_NOT_ALL_OPEN")
            for term in ("sponsor", "consent", "22-row", "foreign-tenant",
                         "Reader", "pricing", "NO_GO", "synthetic"):
                if term.lower() not in checklist.lower():
                    problems.add("OWNER_GATE_REQUIREMENT_MISSING")

        terms_sections = [s for s in sections
                          if s.startswith("Proposed commercial terms")]
        if len(terms_sections) != 1 or "TO BE NEGOTIATED" not in terms_sections[0]:
            problems.add("TERMS_NOT_EXPLICITLY_UNPRICED")
        elif re.search(r"\$\s*\d[\d,]*(?:\.\d{2})?", terms_sections[0]):
            problems.add("UNAPPROVED_PRICE_IN_DRAFT")

        for filename in ("BUYER_PROOF_DEMO.md", "BETA_EVIDENCE_GATE.md",
                         "BETA_DEPLOYMENT_SMOKE.md"):
            if not re.search(r"\]\(" + re.escape(filename) + r"\)", offer):
                problems.add("EVIDENCE_LINK_MISSING")

        if ("outside SecureNow" not in offer
                or "later successful capture" not in offer.lower()
                or "no autonomous remediation" not in offer.lower()):
            problems.add("ADVISORY_OR_VERIFICATION_BOUNDARY_MISSING")

    matrix = sources.get(MATRIX)
    row_count = None
    if matrix is not None:
        try:
            decoded = json.loads(matrix)
            rows = decoded.get("requirements") if isinstance(decoded, dict) else None
            if not isinstance(rows, list) or len(rows) != 22:
                problems.add("BETA_MATRIX_SHAPE_CHANGED")
            elif any(not isinstance(row, dict) or not isinstance(row.get("id"), str)
                     or not row["id"] for row in rows) or len({r["id"] for r in rows}) != 22:
                problems.add("BETA_MATRIX_SHAPE_CHANGED")
            else:
                row_count = 22
        except (ValueError, TypeError):
            problems.add("BETA_MATRIX_SHAPE_CHANGED")

    return {
        "schema": "securenow.pilot-offer-contract-audit.v1",
        "status": "HOLD_OWNER_APPROVAL_REQUIRED",
        "draftContractIntact": not problems,
        "blockingDriftCodes": sorted(problems),
        "sourceCount": len(sources),
        "sourceCountExpected": len(SOURCES),
        "betaMatrixRows": row_count,
        "offerApproved": False,
        "betaGo": False,
        "publicationAllowed": False,
        "customerOutcomeObserved": False,
        "note": "Offline source contract only. Even a clean audit cannot approve a pilot, beta release, price or customer claim.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = audit(args.root)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("SecureNow controlled pilot contract: " +
          ("draft intact; still HOLD" if result["draftContractIntact"] else
           "source drift found; HOLD"))
    return 0 if result["draftContractIntact"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
