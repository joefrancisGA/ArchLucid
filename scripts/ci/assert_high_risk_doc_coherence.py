"""
Narrow, deterministic documentation coherence checks where contradictions carry sales / security risk.

Validates only explicit source-of-truth files (no archived assessments, no broad markdown corpus).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


_CI_DIR = Path(__file__).resolve().parent

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from generate_pricing_json import extract_locked_prices_json  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]


def _read(rel: Path) -> str:
    path = REPO_ROOT / rel

    if not path.is_file():
        raise FileNotFoundError(path)

    return path.read_text(encoding="utf-8")


def _fail(msg: str) -> int:
    print(f"ERROR: {msg}", file=sys.stderr)

    return 1


# Trust Center phrases that contradict V1_DEFERRED §6c (CPA SOC 2 deferral, third-party pen V2).
_TRUST_FALSE_SOC_PHRASES: tuple[str, ...] = (
    "cpa-issued soc 2 type ii report is available",
    "soc 2 type ii report is available for distribution",
    "soc 2 examination report has been issued",
    "soc 2 audit opinion has been issued",
)

_TRUST_FALSE_ISO_PEN_PHRASES: tuple[str, ...] = (
    "iso 27001 certified",
    "iso 27001 certificate has been issued",
    "iso 27001 certification has been awarded",
    "third-party penetration test completed for v1",
    "third-party pen test report is publicly available",
    "external penetration test completed for v1 ga",
)


def check_trust_center_vs_deferred_posture(trust_text: str) -> list[str]:
    """Return human-readable errors if TRUST_CENTER.md reads as contradicting deferred security posture."""
    errors: list[str] = []
    tl = trust_text.lower()

    for phrase in _TRUST_FALSE_SOC_PHRASES:

        if phrase in tl:
            errors.append(f"TRUST_CENTER.md reads as claiming issued CPA SOC 2 — found '{phrase}'.")

    for phrase in _TRUST_FALSE_ISO_PEN_PHRASES:

        if phrase in tl:
            errors.append(f"TRUST_CENTER.md may contradict V1_DEFERRED §6c — found '{phrase}'.")

    soc_segment = trust_text.split("| **SOC 2**", maxsplit=1)[1][:1200]

    if "Deferred" not in soc_segment and "self-assessment" not in soc_segment.lower():
        errors.append("TRUST_CENTER.md SOC 2 row must remain explicitly deferred / self-assessment honest.")

    return errors


def check_mcp_scope_deferred_joint_update(v1_scope: str, v1_deferred: str) -> list[str]:
    """
    MCP remains out of V1 unless both V1_SCOPE.md and V1_DEFERRED.md are updated together.

    Detects half-updated edits where one file still says MCP is out of V1 and the other does not.
    """
    scope_mcp_out = "**MCP** is **not** V1" in v1_scope

    inbound_row = re.search(
        r"\*\*Inbound MCP server.*?\*\*Out of V1\.\*\*",
        v1_deferred,
        flags=re.DOTALL | re.IGNORECASE,
    )

    deferred_mcp_inbound_out = inbound_row is not None

    if scope_mcp_out != deferred_mcp_inbound_out:
        return [
            "MCP shipping-boundary mismatch: V1_SCOPE.md (MCP is **not** V1) and "
            "V1_DEFERRED.md §6d inbound MCP **Out of V1.** posture must be updated together.",
        ]

    return []


def check_pricing_locked_json_matches_public(philosophy_text: str, pricing_json_text: str) -> list[str]:
    """Machine-readable pricing.json must match the ```locked-prices JSON in PRICING_PHILOSOPHY.md."""
    errors: list[str] = []

    try:
        locked_raw = extract_locked_prices_json(philosophy_text)
    except ValueError as ex:
        return [f"PRICING_PHILOSOPHY.md locked-prices block: {ex}"]

    try:
        locked_obj = json.loads(locked_raw)
        public_obj = json.loads(pricing_json_text)
    except json.JSONDecodeError as ex:
        return [f"pricing JSON parse error: {ex}"]

    if not isinstance(locked_obj, dict) or not isinstance(public_obj, dict):
        return ["pricing JSON root must be an object."]

    if locked_obj != public_obj:
        errors.append(
            "archlucid-ui/public/pricing.json must exactly match the object inside "
            "PRICING_PHILOSOPHY.md ```locked-prices (run scripts/ci/generate_pricing_json.py).",
        )

    return errors


def check_v1_scope_mcp_inventory_row(v1_scope: str) -> list[str]:
    """Speculative ecosystem row and MCP inventory row must keep explicit not-V1 posture."""
    errors: list[str] = []

    if "**MCP** is **not** V1" not in v1_scope:
        errors.append(
            "V1_SCOPE.md must keep explicit MCP-is-not-V1 posture in the speculative ecosystem row.",
        )

    if "Model Context Protocol (MCP) server" not in v1_scope:
        errors.append("V1_SCOPE.md must include the MCP server inventory row.")
    else:
        tail = v1_scope.split("Model Context Protocol (MCP) server", maxsplit=1)[1][:400]

        if "Not in V1" not in tail:
            errors.append("V1_SCOPE.md MCP inventory row must state Not in V1 for the shipping boundary.")

    return errors


def check_v1_deferred_mcp_section(v1_deferred: str) -> list[str]:
    if "**Out of V1.**" not in v1_deferred or "Inbound MCP" not in v1_deferred:
        return ["V1_DEFERRED.md §6d must document MCP as out of V1 (inbound membrane row)."]

    return []


def assert_high_risk_doc_coherence_inner(
    *,
    v1_scope: str,
    v1_deferred: str,
    trust: str,
    philosophy: str,
    pricing_json: str,
) -> list[str]:
    """
    Pure coherence checks (for unit tests). Returns error strings; empty means pass.
    """
    errors: list[str] = []

    errors.extend(check_trust_center_vs_deferred_posture(trust))
    errors.extend(check_mcp_scope_deferred_joint_update(v1_scope, v1_deferred))
    errors.extend(check_v1_scope_mcp_inventory_row(v1_scope))
    errors.extend(check_v1_deferred_mcp_section(v1_deferred))
    errors.extend(check_pricing_locked_json_matches_public(philosophy, pricing_json))

    locked = philosophy.split("```locked-prices", maxsplit=1)

    if len(locked) < 2:
        errors.append("PRICING_PHILOSOPHY.md missing locked-prices fence.")
    else:
        if "teamStripeCheckoutUrlSalesLedPlaceholder" not in locked[1]:
            errors.append(
                "PRICING_PHILOSOPHY.md locked-prices block must include "
                "teamStripeCheckoutUrlSalesLedPlaceholder (see generate_pricing_json.py).",
            )

    if "teamStripeCheckoutUrlSalesLedPlaceholder" not in pricing_json:
        errors.append("archlucid-ui/public/pricing.json must include teamStripeCheckoutUrlSalesLedPlaceholder.")

    return errors


def main() -> int:
    from assert_v1_connector_catalog_alignment import run_alignment_checks

    align_code, align_msgs = run_alignment_checks(REPO_ROOT, emit_doc_code=True)

    for line in align_msgs:
        target = (
            sys.stderr
            if line.startswith("ERROR:")
            or line.startswith("  - ")
            or line.startswith("Fix:")
            else sys.stdout
        )

        print(line, file=target)

    if align_code != 0:
        return align_code

    v1_scope = _read(Path("docs/library/V1_SCOPE.md"))
    v1_deferred = _read(Path("docs/library/V1_DEFERRED.md"))
    trust = _read(Path("docs/go-to-market/TRUST_CENTER.md"))
    philosophy = _read(Path("docs/go-to-market/PRICING_PHILOSOPHY.md"))
    pricing_json = _read(Path("archlucid-ui/public/pricing.json"))

    errs = assert_high_risk_doc_coherence_inner(
        v1_scope=v1_scope,
        v1_deferred=v1_deferred,
        trust=trust,
        philosophy=philosophy,
        pricing_json=pricing_json,
    )

    if errs:

        for e in errs:
            print(f"ERROR: {e}", file=sys.stderr)

        return 1

    print("assert_high_risk_doc_coherence: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
