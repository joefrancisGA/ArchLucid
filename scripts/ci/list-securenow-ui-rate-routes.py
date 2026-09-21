#!/usr/bin/env python3
"""List SecureNow (security product line) operator + help routes for /al-ui-rate batches."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
UI_LIB = REPO / "archlucid-ui" / "src" / "lib"

SECURENOW_EXCLUDED_HELP_SLUGS = frozenset(
    {
        "cloud-connections-aws",
        "cloud-connections-gcp",
        "first-architecture-review",
        "evidence-intake",
        "review-packages",
        "review-guide",
        "choose-your-next-step",
        "accelerator-chooser",
        "billing-and-plans",
        "architecture-desk",
        "architecture-draft-editing",
        "architecture-sharing",
        "career-rehearsal-doors",
        "slack-integration",
        "security-evidence-paths",
    }
)

SECURENOW_OPERATOR_HREFS: tuple[str, ...] = (
    "/",
    "/security/assigned-to-me",
    "/security/remediation-factory",
    "/security/remediation-patterns",
    "/security/remediation-instances",
    "/compliance/policy-packs",
    "/compliance/standards-and-rules",
    "/compliance/findings",
    "/compliance/audit-evidence",
    "/infrastructure/drift",
    "/infrastructure/diagrams",
    "/infrastructure/diagram-reconcile",
    "/infrastructure/terraform",
    "/infrastructure/resources",
    "/infrastructure/declared-connections",
    "/infrastructure/ask",
    "/infrastructure/extract-upload",
    "/integrations/cloud-connections",
    "/integrations/cloud-connections/azure",
    "/integrations/jira",
    "/integrations/servicenow",
    "/integrations/teams",
    "/administration/notifications",
    "/administration/workspace-settings",
    "/administration/users",
    "/administration/identity-providers",
    "/administration/security-trust",
    "/administration/connection-status",
    "/administration/system-health",
    "/administration/auth-domains",
    "/help",
)


def _slug_from_registry_files() -> list[str]:
    slugs: set[str] = set()
    pattern = re.compile(r'"slug":\s*"([^"]+)"')
    for path in UI_LIB.glob("product-documentation-registry-entries*.ts"):
        text = path.read_text(encoding="utf-8", errors="replace")
        for match in pattern.finditer(text):
            slugs.add(match.group(1))
    return sorted(slugs)


def build_securenow_ui_rate_routes() -> list[dict[str, str]]:
    routes: list[dict[str, str]] = []
    for href in SECURENOW_OPERATOR_HREFS:
        slug = href.strip("/").replace("/", "-") or "home"
        routes.append({"slug": slug, "href": href, "section": "operator"})

    for slug in _slug_from_registry_files():
        if slug in SECURENOW_EXCLUDED_HELP_SLUGS:
            continue
        routes.append(
            {
                "slug": f"help-{slug}",
                "href": f"/help/{slug}",
                "section": "help",
            }
        )

    return routes


def main() -> int:
    routes = build_securenow_ui_rate_routes()
    if "--json" in sys.argv:
        print(json.dumps(routes, indent=2))
        return 0

    print(f"SecureNow UI rate routes: {len(routes)} total")
    print(f"  operator: {sum(1 for r in routes if r['section'] == 'operator')}")
    print(f"  help: {sum(1 for r in routes if r['section'] == 'help')}")
    for row in routes:
        print(f"{row['section']:8} {row['href']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
