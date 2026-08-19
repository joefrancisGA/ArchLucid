#!/usr/bin/env python3
"""Generate buyer-safe trial-to-paid test-mode evidence for first-pilot proof."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def collect_guard_status(root: Path) -> tuple[list[str], list[str]]:
    violations: list[str] = []
    notes: list[str] = []

    required_docs = (
        Path("docs/runbooks/TRIAL_FUNNEL_END_TO_END.md"),
        Path("docs/runbooks/TRIAL_END_TO_END.md"),
        Path("docs/go-to-market/TRIAL_AND_SIGNUP.md"),
        Path("docs/security/TRIAL_AUTH.md"),
        Path("docs/security/TRIAL_LIMITS.md"),
    )

    for rel in required_docs:
        if not (root / rel).is_file():
            violations.append(f"missing trial funnel doc: {rel.as_posix()}")

    pricing_json = root / "archlucid-ui" / "public" / "pricing.json"
    if not pricing_json.is_file():
        violations.append("missing archlucid-ui/public/pricing.json")
    else:
        try:
            payload = json.loads(_read_text(pricing_json))
            checkout_url = ""
            sales_led_placeholder = False

            if isinstance(payload, dict):
                checkout_url = str(payload.get("teamStripeCheckoutUrl") or "")
                sales_led_placeholder = payload.get("teamStripeCheckoutUrlSalesLedPlaceholder") is True

                team = payload.get("team")
                if isinstance(team, dict) and not checkout_url:
                    checkout_url = str(team.get("stripeCheckoutUrl") or team.get("checkoutUrl") or "")

            if checkout_url.strip():
                lower = checkout_url.lower()

                if sales_led_placeholder or "placeholder" in lower:
                    notes.append(
                        "Team checkout URL is a sales-led placeholder — live Stripe TEST checkout remains owner-only deferred."
                    )
                elif "cs_test_" in lower or "buy.stripe.com/test_" in lower:
                    notes.append("Team checkout URL uses Stripe TEST mode markers.")
                else:
                    notes.append(
                        "Team checkout URL is present but does not match known TEST-mode markers; "
                        "confirm Billing:Provider and live-key guards before citing as test-mode proof."
                    )
            else:
                notes.append("Team checkout URL absent — acceptable when Billing:Provider=Noop for local funnel.")
        except json.JSONDecodeError as exc:
            violations.append(f"pricing.json is not valid JSON: {exc}")

    guard_script = root / "scripts" / "ci" / "pricing_json_checkout_guard.py"
    if not guard_script.is_file():
        violations.append("missing scripts/ci/pricing_json_checkout_guard.py")

    return violations, notes


def render_markdown(*, disposition: str, violations: list[str], notes: list[str]) -> str:
    lines = [
        "# Trial-to-paid test-mode evidence",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Disposition | **{disposition}** |",
        f"| Generated (UTC) | {datetime.now(timezone.utc).isoformat()} |",
        "",
        "## What test-mode checkout validates",
        "",
        "- Self-serve signup, tenant provisioning, sample run seed, and first commit audit trail.",
        "- Stripe **TEST** checkout or Noop billing activator paths documented in trial runbooks.",
        "- Trial write limits, auth boundaries, and sponsor banner after first commit.",
        "",
        "## Deferred (not V1 product failure)",
        "",
        "- Live Stripe/Marketplace checkout and owner-only go-live decisions.",
        "- Public reference-customer publication and production billing key enablement.",
        "",
        "## Recommended next ask (sales-led conversion)",
        "",
        "- Attach this proof row plus quote-to-proof packet when the buyer asks about commerce readiness.",
        "- State explicitly that engineering validates TEST-mode funnel readiness; live commerce remains owner action.",
        "",
    ]

    if notes:
        lines.extend(["## Engineering notes", ""])
        lines.extend(f"- {note}" for note in notes)
        lines.append("")

    if violations:
        lines.extend(["## Violations", ""])
        lines.extend(f"- {item}" for item in violations)
        lines.append("")

    lines.extend(
        [
            "## Canonical references",
            "",
            "- [`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`](../../docs/runbooks/TRIAL_FUNNEL_END_TO_END.md)",
            "- [`docs/runbooks/TRIAL_END_TO_END.md`](../../docs/runbooks/TRIAL_END_TO_END.md)",
            "- [`docs/go-to-market/TRIAL_AND_SIGNUP.md`](../../docs/go-to-market/TRIAL_AND_SIGNUP.md)",
            "",
        ]
    )

    return "\n".join(lines)


def build_json_summary(*, disposition: str, violations: list[str], notes: list[str]) -> dict[str, object]:
    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "violations": violations,
        "notes": notes,
        "live_commerce_deferred": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Report trial-to-paid test-mode commercial evidence.")
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    root = repo_root()
    violations, notes = collect_guard_status(root)
    disposition = "PASS" if not violations else "HOLD"
    markdown = render_markdown(disposition=disposition, violations=violations, notes=notes)

    markdown_path = args.markdown_out.expanduser().resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")

    if args.json_summary_out is not None:
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(
            json.dumps(build_json_summary(disposition=disposition, violations=violations, notes=notes), indent=2)
            + "\n",
            encoding="utf-8",
        )

    if violations:
        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("trial-to-paid test-mode evidence: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
