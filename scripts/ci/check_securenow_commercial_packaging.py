#!/usr/bin/env python3
"""Validate SecureNow commercial packaging stays buyer-safe and non-transactable."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ORDER_FORM = Path("docs/securenow/ORDER_FORM_TEMPLATE.md")
CHECKLIST = Path("docs/securenow/QUOTE_TO_PILOT_CHECKLIST.md")
METER_CARD = Path("docs/securenow/SKU_METER_CARD.md")
QUOTE_PACKET_COPY = Path(
    "archlucid-ui/src/lib/product-line/securenow-quote-packet-copy.ts"
)
PUBLISHED_LIST_PRICE_COPY = Path(
    "archlucid-ui/src/lib/product-line/securenow-published-list-price-copy.ts"
)
QUOTE_PACKET_VIEW = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-quote-packet/SecureNowQuotePacketPageView.tsx"
)
REVIEWER_HOME_COPY = Path(
    "archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts"
)
WHY_COPY = Path("archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts")
PUBLIC_PACKAGING_COPY = Path(
    "archlucid-ui/src/lib/marketing/securenow-public-commercial-packaging-copy.ts"
)
PUBLIC_SAMPLE_LINKS = Path("archlucid-ui/src/lib/marketing/public-sample-entry-links.ts")
BETA_SKU_CONTENTS_COPY = Path(
    "archlucid-ui/src/lib/product-line/securenow-beta-sku-contents-copy.ts"
)
SKU_CARD_VIEW = Path(
    "archlucid-ui/src/app/(marketing)/securenow-sku/SecureNowSkuCardView.tsx"
)
WELCOME_PAGE = Path("archlucid-ui/src/components/marketing/WelcomeMarketingPage.tsx")
PUBLIC_FOOTER = Path("archlucid-ui/src/components/marketing/MarketingPublicFooter.tsx")

SKU_IDS = ("SN-EVAL", "SN-ANNUAL", "SN-SUB-ADD", "SN-SNAP-4")
FORBIDDEN_PHRASES = ("guaranteed savings", "guaranteed ROI", "READY_TO_PUBLISH")


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")


def _check_common(relative: Path, text: str, errors: list[str]) -> None:
    if not text.startswith("> **Scope:**"):
        errors.append(f"{relative}: missing leading Scope blockquote")
    if "NO_GO" not in text:
        errors.append(f"{relative}: missing NO_GO")
    if "$" in text:
        errors.append(f"{relative}: contains '$'; fee amounts must stay private")
    lowered = text.lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase.lower() in lowered:
            errors.append(f"{relative}: contains forbidden phrase {phrase!r}")


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []

    order = _read(root, ORDER_FORM, errors)
    if order:
        _check_common(ORDER_FORM, order, errors)
        for sku in SKU_IDS:
            if sku not in order:
                errors.append(f"{ORDER_FORM}: missing {sku}")
        for token in (
            "PRIVATE_PRICE_SHEET.md",
            "NOT AN APPROVED CUSTOMER OFFER",
            "CONTROLLED_PILOT_OFFER.md",
            "SUPPORT_COMMITMENT.md",
        ):
            if token not in order:
                errors.append(f"{ORDER_FORM}: missing {token!r}")

    checklist = _read(root, CHECKLIST, errors)
    if checklist:
        _check_common(CHECKLIST, checklist, errors)
        for token in (
            "PRIVATE_PRICE_SHEET.md",
            "QUOTE_COVER.md",
            "ORDER_FORM_TEMPLATE.md",
            "DATA_PROCESSING_SCHEDULE.md",
            "PILOT_MEASUREMENT_LOG.md",
            "ROI_COST_INPUT.md",
            "cannot authorize commerce",
        ):
            if token not in checklist:
                errors.append(f"{CHECKLIST}: missing {token!r}")

    meter = _read(root, METER_CARD, errors)
    if meter:
        _check_common(METER_CARD, meter, errors)
        for sku in SKU_IDS:
            if sku not in meter:
                errors.append(f"{METER_CARD}: missing {sku}")
        for token in ("2 Azure subscriptions", "4 successful snapshots", "5 named operators"):
            if token not in meter:
                errors.append(f"{METER_CARD}: missing meter {token!r}")

    quote_packet = _read(root, QUOTE_PACKET_COPY, errors)
    if quote_packet:
        if "NO_GO" not in quote_packet:
            errors.append(f"{QUOTE_PACKET_COPY}: missing NO_GO")
        if "$" in quote_packet:
            errors.append(f"{QUOTE_PACKET_COPY}: contains '$'; fee amounts must stay private")
        for sku in SKU_IDS:
            if sku not in quote_packet:
                errors.append(f"{QUOTE_PACKET_COPY}: missing {sku}")
        for token in ("Not an approved offer", "cannot authorize commerce"):
            if token not in quote_packet:
                errors.append(f"{QUOTE_PACKET_COPY}: missing {token!r}")
        if "PRIVATE_PRICE_SHEET" in quote_packet:
            errors.append(f"{QUOTE_PACKET_COPY}: must not name PRIVATE_PRICE_SHEET")

    reviewer_home = _read(root, REVIEWER_HOME_COPY, errors)
    if reviewer_home:
        if "/administration/securenow-quote-packet" not in reviewer_home:
            errors.append(f"{REVIEWER_HOME_COPY}: missing quote-packet href")
        if "Quote packet" not in reviewer_home:
            errors.append(f"{REVIEWER_HOME_COPY}: missing Quote packet label")
        if "$" in reviewer_home:
            errors.append(f"{REVIEWER_HOME_COPY}: contains '$'; fee amounts must stay private")

    why = _read(root, WHY_COPY, errors)
    if why and (
        "Those documents stay with the owner until buyer communication is approved." not in why
    ):
        errors.append(f"{WHY_COPY}: missing owner-held buyer-communication sentence")

    public_packaging = _read(root, PUBLIC_PACKAGING_COPY, errors)
    if public_packaging:
        if "$" in public_packaging:
            errors.append(f"{PUBLIC_PACKAGING_COPY}: contains '$'; fee amounts must stay private")
        if "PRIVATE_PRICE_SHEET" in public_packaging:
            errors.append(f"{PUBLIC_PACKAGING_COPY}: must not name PRIVATE_PRICE_SHEET")
        for token in (
            "securenow-public-quote-sequence",
            "At the meter cap",
            "does not include SecureNow SKU entitlements",
            "NO_GO",
        ):
            if token not in public_packaging:
                errors.append(f"{PUBLIC_PACKAGING_COPY}: missing {token!r}")
        for sku in SKU_IDS:
            if sku not in public_packaging:
                errors.append(f"{PUBLIC_PACKAGING_COPY}: missing {sku}")

    public_links = _read(root, PUBLIC_SAMPLE_LINKS, errors)
    if public_links:
        if 'PUBLIC_SECURENOW_SKU_CARD_HREF = "/securenow-sku"' not in public_links:
            errors.append(f"{PUBLIC_SAMPLE_LINKS}: missing PUBLIC_SECURENOW_SKU_CARD_HREF")

    beta_contents = _read(root, BETA_SKU_CONTENTS_COPY, errors)
    if beta_contents:
        if "/administration/securenow-quote-packet" in beta_contents and (
            "SECURENOW_OPERATOR_QUOTE_PACKET_HREF" not in beta_contents
            or beta_contents.find("/administration/securenow-quote-packet")
            < beta_contents.find("SECURENOW_OPERATOR_QUOTE_PACKET_HREF")
        ):
            errors.append(
                f"{BETA_SKU_CONTENTS_COPY}: public quote link must not target administration quote packet"
            )
        if "/securenow-sku#securenow-public-quote-sequence" not in beta_contents:
            errors.append(f"{BETA_SKU_CONTENTS_COPY}: missing public quote sequence anchor href")

    list_price_copy = _read(root, PUBLISHED_LIST_PRICE_COPY, errors)
    if list_price_copy:
        if "$" not in list_price_copy:
            errors.append(f"{PUBLISHED_LIST_PRICE_COPY}: must contain published list price literals")
        for sku in SKU_IDS:
            if sku not in list_price_copy:
                errors.append(f"{PUBLISHED_LIST_PRICE_COPY}: missing {sku}")

    sku_view = _read(root, SKU_CARD_VIEW, errors)
    if sku_view:
        for token in (
            "securenow-sku-architecture-boundary",
            "SecureNowPublicQuoteSequenceSection",
            "secureNowSkuMeterCapForSku",
            "SecureNowPublishedListPriceSection",
        ):
            if token not in sku_view:
                errors.append(f"{SKU_CARD_VIEW}: missing {token!r}")

    quote_packet_view = _read(root, QUOTE_PACKET_VIEW, errors)
    if quote_packet_view and "SecureNowPublishedListPriceSection" not in quote_packet_view:
        errors.append(f"{QUOTE_PACKET_VIEW}: missing SecureNowPublishedListPriceSection")

    welcome = _read(root, WELCOME_PAGE, errors)
    if welcome:
        if "PUBLIC_SECURENOW_SKU_CARD_HREF" not in welcome:
            errors.append(f"{WELCOME_PAGE}: missing PUBLIC_SECURENOW_SKU_CARD_HREF")

    footer = _read(root, PUBLIC_FOOTER, errors)
    if footer:
        if "PUBLIC_SECURENOW_SKU_CARD_HREF" not in footer:
            errors.append(f"{PUBLIC_FOOTER}: missing PUBLIC_SECURENOW_SKU_CARD_HREF")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow commercial packaging: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
