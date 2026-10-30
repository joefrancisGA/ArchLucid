#!/usr/bin/env python3
"""Validate SecureNow marketability artifacts stay internal-draft and buyer-safe."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

BUYER_OVERVIEW = Path("docs/securenow/BUYER_OVERVIEW.md")
FIXTURE_STORYBOARD = Path("docs/securenow/FIXTURE_STORYBOARD.md")
WHY_COPY = Path("archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts")
WHY_PAGE = Path("archlucid-ui/src/app/(marketing)/why-securenow/page.tsx")
ROUTE_POLICY = Path("archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts")
MARKETING_LAYOUT = Path("archlucid-ui/src/app/(marketing)/layout.tsx")
RESOURCES_MENU = Path("archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx")
REVIEWER_HOME_COPY = Path("archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts")

OVERVIEW_LINKS = (
    "PROCUREMENT_PACK_INDEX.md",
    "QUOTE_COVER.md",
    "CONTROLLED_PILOT_OFFER.md",
)
FORBIDDEN_PHRASES = ("guaranteed savings", "READY_TO_PUBLISH", "Start trial")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    overview = _read(root, BUYER_OVERVIEW, errors)
    if overview:
        if "**Scope:**" not in overview:
            errors.append(f"{BUYER_OVERVIEW}: missing **Scope:**")
        if "NO_GO" not in overview:
            errors.append(f"{BUYER_OVERVIEW}: missing NO_GO")
        if "INTERNAL DRAFT" not in overview:
            errors.append(f"{BUYER_OVERVIEW}: missing INTERNAL DRAFT")
        for link in OVERVIEW_LINKS:
            if link not in overview:
                errors.append(f"{BUYER_OVERVIEW}: missing link to {link}")
        if "$" in overview:
            errors.append(f"{BUYER_OVERVIEW}: contains '$'")
        lowered = overview.lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase.lower() in lowered:
                errors.append(f"{BUYER_OVERVIEW}: contains forbidden phrase {phrase!r}")

    why_copy = _read(root, WHY_COPY, errors)
    if why_copy:
        if "Internal draft. Not approved buyer communication. SecureNow beta remains NO_GO." not in why_copy:
            errors.append(f"{WHY_COPY}: missing internal draft banner string")
        if "This page does not publish a price." not in why_copy:
            errors.append(f"{WHY_COPY}: missing price discipline sentence")

    why_page = _read(root, WHY_PAGE, errors)
    if why_page and "index: false" not in why_page:
        errors.append(f"{WHY_PAGE}: missing index: false")

    route_policy = _read(root, ROUTE_POLICY, errors)
    if route_policy:
        if "isSecureNowDraftMarketingPath" not in route_policy:
            errors.append(f"{ROUTE_POLICY}: missing isSecureNowDraftMarketingPath")
        if "/why-securenow" not in route_policy:
            errors.append(f"{ROUTE_POLICY}: missing /why-securenow")
        if '"/pricing"' not in route_policy:
            errors.append(f"{ROUTE_POLICY}: missing blocked /pricing prefix")

    layout = _read(root, MARKETING_LAYOUT, errors)
    if layout:
        if "shouldRedirectMarketingLayout" not in layout:
            errors.append(f"{MARKETING_LAYOUT}: missing shouldRedirectMarketingLayout")
        if "why-securenow-security-shell" not in layout:
            errors.append(f"{MARKETING_LAYOUT}: missing why-securenow-security-shell")

    menu = _read(root, RESOURCES_MENU, errors)
    if menu and 'href="/why-securenow"' in menu:
        errors.append(f"{RESOURCES_MENU}: must not link href=\"/why-securenow\"")

    reviewer = _read(root, REVIEWER_HOME_COPY, errors)
    if reviewer:
        for token in ("For reviewers", "Draft overview", "Reviewer packet", "Request a conversation"):
            if token not in reviewer:
                errors.append(f"{REVIEWER_HOME_COPY}: missing {token!r}")
        lowered = reviewer.lower()
        for phrase in FORBIDDEN_PHRASES:
            if phrase.lower() in lowered:
                errors.append(f"{REVIEWER_HOME_COPY}: contains forbidden phrase {phrase!r}")

    storyboard = _read(root, FIXTURE_STORYBOARD, errors)
    if storyboard and "Every beat below is a fixture" not in storyboard:
        errors.append(f"{FIXTURE_STORYBOARD}: missing fixture discipline line")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow marketability: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
