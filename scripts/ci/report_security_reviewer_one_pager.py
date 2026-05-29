#!/usr/bin/env python3
"""Generate a buyer-safe security reviewer one-pager from existing trust sources."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


SOURCE_FILES: tuple[tuple[str, str], ...] = (
    ("docs/go-to-market/TRUST_CENTER.md", "Trust center narrative"),
    ("docs/security/SOC2_SELF_ASSESSMENT_2026.md", "SOC 2 self-assessment (not CPA attestation)"),
    ("docs/go-to-market/SOC2_ROADMAP.md", "SOC 2 roadmap (deferred CPA program)"),
    ("docs/library/V1_DEFERRED.md", "Explicit V1 deferrals"),
)


DEFERRED_ASSURANCES: tuple[str, ...] = (
    "CPA SOC 2 Type I/II report",
    "Third-party penetration test publication",
    "ISO or statutory certification automation",
    "Live marketplace checkout as procurement gate",
)


NEVER_ASK: tuple[str, ...] = (
    "Production database connection strings in tickets",
    "API keys, SAML secrets, or Key Vault values in email",
    "Unredacted LLM prompts in buyer-safe attachments",
    "Customer-operated webhook secrets in V1 required path",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def build_one_pager(root: Path) -> dict[str, object]:
    sources: list[dict[str, str]] = []

    for rel, role in SOURCE_FILES:
        path = root / Path(rel)
        sources.append(
            {
                "path": rel,
                "role": role,
                "present": path.is_file(),
            },
        )

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "attestationPosture": "Self-assessed controls and documented engineering evidence — not CPA SOC 2, ISO certification, or third-party pen-test attestation today.",
        "currentControlsSummary": [
            "Tenant-scoped auth (OIDC/SAML/API key) with least-privilege operator ranks",
            "Append-only audit events and correlation IDs on API failures",
            "Config summary and config lint without returning secrets",
            "Policy packs and governance workflows (optional after first commit)",
            "DPA/SIG/CAIQ-style templates in procurement pack — templates, not legal guarantees",
        ],
        "deferredAssurances": list(DEFERRED_ASSURANCES),
        "neverAskCustomersToGrant": list(NEVER_ASK),
        "sources": sources,
    }


def format_markdown(pager: dict[str, object]) -> str:
    lines = [
        "# Security reviewer one-pager (generated)",
        "",
        "> **Not a certification.** This page summarizes current documented posture vs deferred formal assurance.",
        "",
        f"**Posture:** {pager['attestationPosture']}",
        "",
        "## Current controls (V1 evidence today)",
        "",
    ]

    for item in pager.get("currentControlsSummary") or []:
        lines.append(f"- {item}")

    lines.extend(["", "## Deferred / informational only (not V1 blockers)", ""])

    for item in pager.get("deferredAssurances") or []:
        lines.append(f"- {item}")

    lines.extend(["", "## We will never ask you to paste", ""])

    for item in pager.get("neverAskCustomersToGrant") or []:
        lines.append(f"- {item}")

    lines.extend(["", "## Source documents", ""])

    for src in pager.get("sources") or []:
        flag = "present" if src.get("present") else "MISSING"
        lines.append(f"- `{src.get('path')}` ({src.get('role')}) — {flag}")

    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    pager = build_one_pager(repo_root())
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(pager, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(format_markdown(pager), encoding="utf-8")
    print("security reviewer one-pager: generated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
