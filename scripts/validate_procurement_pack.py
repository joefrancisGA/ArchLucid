#!/usr/bin/env python3
"""Standalone procurement pack validator (canonical sources + buyer-safe wording + previews)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
_SCRIPTS_DIR = _REPO_ROOT / "scripts"

if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

import procurement_pack_validation as pp_val  # noqa: E402  (needs sys.path first)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate ArchLucid procurement pack inputs.")
    parser.add_argument(
        "--preview-dir",
        type=Path,
        default=None,
        help="If validation passes, emit manifest.json + redaction_report.md-only preview here.",
    )
    parser.add_argument(
        "--max-assurance-review-age-days",
        type=int,
        default=366,
        help="Max staleness window for ASSURANCE_STATUS_CANONICAL + TRUST_CENTER **Last reviewed** (default ~1y).",
    )
    parser.add_argument(
        "--deal-ready-staleness-days",
        type=int,
        default=120,
        help="With --deal-ready: max staleness applied by deal-ready doc checks (defaults to build parity).",
    )
    parser.add_argument(
        "--deal-ready",
        action="store_true",
        help="Also run buyer release checks (SOC2/deal freshness stack) mirrored from build `--deal-ready`.",
    )
    parser.add_argument(
        "--skip-claim-scan",
        action="store_true",
        help="Only structural checks (canonical sources/templates/freshness) — skips regex honesty scan.",
    )
    args = parser.parse_args()

    errors = pp_val.procurement_pack_quick_checks(
        _REPO_ROOT,
        max_assurance_review_age_days=args.max_assurance_review_age_days,
        deal_ready_max_review_age_days=args.deal_ready_staleness_days,
        preview_dir=args.preview_dir,
        run_buyer_claim_scans=not args.skip_claim_scan,
        deal_ready_bundle=args.deal_ready,
    )

    if errors:
        print("procurement pack validation FAILED:", file=sys.stderr)

        for e in errors:

            print(f"  - {e}", file=sys.stderr)

        return 1

    preview_note = ""

    if args.preview_dir is not None:
        preview_note = f"; wrote preview → {args.preview_dir.resolve()}"

    print(f"procurement pack validation OK{preview_note}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
