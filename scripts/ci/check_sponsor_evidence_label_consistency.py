#!/usr/bin/env python3
"""Enforce sponsor-facing evidence-basis labels and forbid assurance over-claims."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from check_proof_summary_promise_language import scan_text

# Procurement / conversion docs — label discipline for sponsor send rules.
_REQUIRED_PROCUREMENT_ANCHORS: dict[str, tuple[str, ...]] = {
    "docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md": (
        "baseline completeness",
        "PilotStrict",
        "DEFERRED_SCOPE",
    ),
    "docs/go-to-market/QUOTE_TO_PROOF_PACKET.md": (
        "roi basis",
        "send rule",
    ),
    "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md": (
        "do not",
        "allowed buyer wording",
    ),
}

# Task #8 scope — sponsor output surfaces (first-value MD/PDF, value DOCX, demo preview, why pack, procurement).
_SPONSOR_OUTPUT_SURFACES: dict[str, tuple[str, ...]] = {
    "ArchLucid.Application/Pilots/FirstValueReportBuilder.cs": (
        "Sponsor first-page status",
        "SponsorRoiNarrativeGateMarkdownFormatter",
        "SponsorDecisionDeltaNoveltyMarkdownFormatter",
        "Deferred buyer requirements",
        "execution mode",
    ),
    "ArchLucid.ArtifactSynthesis/Docx/DocxValueReportRenderer.cs": (
        "ROI narrative claim gate",
        "HOLD disposition",
    ),
    "archlucid-ui/src/lib/demo-preview-page-copy.ts": (
        "Evidence basis",
    ),
    "archlucid-ui/src/app/(marketing)/demo/preview/_sections/DemoPreviewHero.tsx": (
        "illustrative",
    ),
    "archlucid-ui/src/app/(marketing)/see-it/SeeItMarketingBody.tsx": (
        "evaluation preview",
        "illustrative",
    ),
    "archlucid-ui/src/marketing/why-archlucid-comparison.ts": (
        "illustrative",
        "no external citation",
    ),
    "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md": (
        "does **not** claim",
        "deferred",
    ),
    "archlucid-ui/src/components/EmailRunToSponsorBanner.tsx": (
        "Execution mode",
        "projected",
    ),
    "archlucid-ui/src/components/GenerateSponsorValueReportButton.tsx": (
        "ROI baseline",
    ),
    "docs/go-to-market/SPONSOR_CLAIM_LABEL_AUDIT.md": (
        "Unsupported-Claim Audit",
        "execution mode",
        "ROI narrative claim gate",
    ),
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _required_anchor_missing(text: str, anchors: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    missing: list[str] = []

    for anchor in anchors:
        if anchor.lower() not in lowered:
            missing.append(anchor)

    return missing


def _scan_anchor_map(root: Path, anchor_map: dict[str, tuple[str, ...]], *, label: str) -> list[str]:
    errors: list[str] = []

    for rel_path, anchors in anchor_map.items():
        path = root / rel_path

        if not path.is_file():
            errors.append(f"missing {label} surface: {rel_path}")
            continue

        text = path.read_text(encoding="utf-8", errors="replace")
        missing = _required_anchor_missing(text, anchors)

        for anchor in missing:
            errors.append(f"{rel_path}: missing required {label} anchor '{anchor}'")

        errors.extend(scan_text(text, source_label=rel_path))

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    root = repo_root()
    errors: list[str] = []

    errors.extend(_scan_anchor_map(root, _REQUIRED_PROCUREMENT_ANCHORS, label="procurement"))
    errors.extend(_scan_anchor_map(root, _SPONSOR_OUTPUT_SURFACES, label="sponsor-output"))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_sponsor_evidence_label_consistency: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
