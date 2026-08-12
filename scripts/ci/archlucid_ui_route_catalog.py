"""Discover routable ArchLucid UI paths for the owner traffic workbook."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
UI_APP_DIR = REPO_ROOT / "archlucid-ui" / "src" / "app"
UI_LIB_DIR = REPO_ROOT / "archlucid-ui" / "src" / "lib"
HELP_REGISTRY = UI_LIB_DIR / "product-documentation-registry.ts"
CLOUD_CONNECTIONS_HELP_ROUTES = UI_LIB_DIR / "cloud-connections-help-routes.ts"

# Default Hit% for catalog paths newly inserted by sync-archlucid-ui-route-traffic-workbook.py.
DEFAULT_NEW_HIT_PCT = "0.02%"

# Owner overrides pinning a specific 3-letter workbook ID to a route path. Empty by default: the sync
# falls back to suggest_row_id(). Add an entry only to keep an ID stable across a path rename, and keep
# values unique 3-letter uppercase IDs (guarded by tests/test_archlucid_ui_route_catalog.py).
PREFERRED_NEW_ROW_IDS: dict[str, str] = {
    "/shell/contextual-help-drawer": "HCD",
    "/help/choose-your-next-step": "HPX",
}

# Admin internal-runbook help topics excluded from buyer UX scoring (/al-ui-lowest).
INTERNAL_UX_RANKING_HELP_PATHS: frozenset[str] = frozenset(
    {
        "/help/configuration-reference",
    }
)

# Legacy workbook paths → canonical catalog paths (scores and Hit% merge on collision).
WORKBOOK_PATH_MIGRATIONS: dict[str, str] = {
    "/alerts": "/governance/alerts",
    "/audit": "/governance/audit",
    "/settings/cloud-connections": "/integrations/cloud-connections",
    "/settings/roles": "/administration/users?tab=roles",
    "/settings/roles/invite-reviewer": "/administration/users/invite-reviewer",
    "/admin/users": "/administration/users",
    "/settings/users": "/administration/users",
    "/settings/users?tab=users": "/administration/users?tab=users",
    "/settings/users?tab=roles": "/administration/users?tab=roles",
    "/settings/users?tab=keys": "/administration/users?tab=keys",
    "/settings/users/invite-reviewer": "/administration/users/invite-reviewer",
    "/admin/support": "/administration/support",
    "/settings/support": "/administration/support",
    "/workspace/security-trust": "/administration/security-trust",
    "/settings/security-trust": "/administration/security-trust",
    "/governance-resolution": "/governance/standards-and-rules",
    "/governance/resolution": "/governance/standards-and-rules",
    "/ask": "/insights/ask-review-questions",
    "/graph": "/insights/evidence-graph",
    "/search": "/insights/search-review-evidence",
    "/compare": "/insights/compare-two-reviews",
    "/scorecard": "/insights/architecture-scorecard",
    "/help/cloud-connections-azure": "/help/cloud-connections/azure",
    "/help/cloud-connections-aws": "/help/cloud-connections/aws",
    "/help/cloud-connections-gcp": "/help/cloud-connections/gcp",
    # TB-2050 / Batch C retired help aliases — fold Hit% into canons.
    "/help/governance-api-contracts": "/help/api-contracts",
    "/help/creating-runs": "/help/review-guide",
    "/help/data-handling-tenant-isolation": "/help/data-handling",
    "/help/evidence-only-review": "/help/first-architecture-review",
    "/help/how-it-works": "/help/getting-started",
    "/help/integrations/azure-boards": "/help/azure-boards",
    "/help/product-overview": "/help/executive-summary",
    "/help/starting-reviews": "/help/review-guide",
    "/help/evaluator-workbook": "/help/choose-your-next-step",
    "/help/path-chooser": "/help/choose-your-next-step",
    "/help/first-hour-operator-path": "/help/first-architecture-review",
    "/help/first-pilot-path": "/help/first-architecture-review",
    "/help/operator-auth-roles": "/help/users-and-roles",
    "/help/pilot-nav-profile": "/help/pilot-guide",
    # Workbook rows are catalog routes, so these fold to the destination page even when the
    # browser redirect lands on a section anchor — build_catalog() never emits "#fragment" paths
    # and assert_ui_route_traffic_workbook_canonical rejects rows outside the catalog.
    "/help/first-review": "/help/first-architecture-review",
    "/help/first-value-20-minutes": "/help/first-architecture-review",
    "/help/pilot-roi-model": "/help/executive-summary",
    "/help/developer-troubleshooting": "/help/engineering-troubleshooting",
    # Legacy key: /help/policy-pack-delta-demo is a live registry topic again, so this entry only
    # keeps the route out of the traffic catalog. Dropping it needs a workbook sync for the new row.
    "/help/policy-pack-delta-demo": "/help/policy-packs#policy-pack-delta-demo",
    "/manifests": "/governance/signed-records",
    "/manifests/[manifestId]": "/governance/signed-records/[manifestId]",
    "/manifests/[manifestId]/artifacts/[artifactId]": (
        "/governance/signed-records/[manifestId]/artifacts/[artifactId]"
    ),
    "/signed-records": "/governance/signed-records",
    "/signed-records/[manifestId]": "/governance/signed-records/[manifestId]",
    "/signed-records/[manifestId]/artifacts/[artifactId]": (
        "/governance/signed-records/[manifestId]/artifacts/[artifactId]"
    ),
    "/settings/cost-reporting": "/administration/ai-usage",
    "/settings/ai-usage": "/administration/ai-usage",
    "/admin/ai-usage-cost": "/administration/ai-usage",
    "/onboarding/start": "/architecture/first-review-guide",
    "/onboard": "/architecture/first-review-guide",
    "/quick-start": "/get-started",
    "/login": "/auth/signin",
    "/operate/architecture-graph": "/insights/evidence-graph",
    "/governance/alerts?tab=inbox": "/governance/alerts",
    # TB-1124: Advisory scans hub under Governance (next.config permanent redirects only).
    "/advisory": "/governance/advisory-scans",
    "/advisory?tab=scans": "/governance/advisory-scans?tab=scans",
    "/advisory?tab=schedules": "/governance/advisory-scans?tab=schedules",
    "/advisory-scheduling": "/governance/advisory-scans?tab=schedules",
    # TB-1134: Governance setup route rename.
    "/governance/first-30-days": "/governance/setup",
    # TB-1441 / TB-1443: /alert-routing bookmark → Alert rules Notifications tab (routing tab id retired).
    "/alert-routing": "/governance/alert-rules?tab=notifications",
    "/governance/alert-rules?tab=routing": "/governance/alert-rules?tab=notifications",
    # TB-1887 / TB-1886: /settings/alerts is next.config-only → Alert rules hub.
    "/settings/alerts": "/governance/alert-rules",
    # TB-1902 / TB-1901: /settings/exec-digest is next.config-only → Digests Schedule tab.
    "/settings/exec-digest": "/architecture/digests?tab=schedule",
    "/health": "/administration/system-health",
    # Batch A retired help aliases (permanent redirect only) — migrate out of workbook/catalog.
    "/help/core-pilot": "/help/first-architecture-review",
    "/dashboard": "/architecture/executive-dashboard",
    "/executive/dashboard": "/architecture/executive-dashboard",
    "/portfolio": "/architecture/executive-dashboard",
    # Public architecture-prefixed reviews / architectures URLs (App Router still under /reviews).
    "/reviews": "/architecture/reviews",
    "/reviews/new": "/architecture/reviews/new",
    "/reviews/[runId]": "/architecture/reviews/[runId]",
    "/reviews/[runId]/findings/[findingId]": "/architecture/reviews/[runId]/findings/[findingId]",
    "/reviews/[runId]/findings/[findingId]/inspect": "/architecture/reviews/[runId]/findings/[findingId]/inspect",
    "/reviews/[runId]/findings/[findingId]/evidence-trace": "/architecture/reviews/[runId]/findings/[findingId]/evidence-trace",
    "/reviews/[runId]/provenance": "/architecture/reviews/[runId]/provenance",
    "/reviews/[runId]/signed-record": "/architecture/reviews/[runId]/signed-record",
    "/reviews/[runId]?archTab=governance": "/architecture/reviews/[runId]?archTab=governance",
    "/architectures": "/architecture/architectures",
    "/architectures/new": "/architecture/architectures/new",
    "/architectures/[architectureId]": "/architecture/architectures/[architectureId]",
    "/settings": "/administration",
    "/administration/settings": "/administration",
    "/governance/risk-exceptions": "/governance/exceptions",
    # Internal Operations rename (was /admin/* platform surfaces).
    "/admin/health": "/internal/health",
    "/admin/tenant-health": "/internal/tenant-health",
    "/admin/configuration": "/internal/configuration",
    "/admin/rag-health": "/internal/rag-health",
    "/admin/integrations/itsm": "/internal/integrations/itsm",
    "/admin/tenants": "/internal/tenants",
    "/admin/evidence-proposals": "/internal/evidence-proposals",
    "/admin/fleet-llm-cogs": "/internal/fleet-llm-cogs",
    "/admin/pricing-quote-aging": "/internal/pricing-quote-aging",
    "/admin/trial-funnel": "/internal/trial-funnel",
    "/admin/demo-readiness": "/internal/demo-readiness",
    "/admin/deployment-status": "/internal/deployment-status",
    # Sponsor report → Insights.
    "/sponsor-report": "/insights/executive-summary",
    "/sponsor-report/executive-summary": "/insights/executive-summary",
    "/sponsor-report/roi-summary": "/insights/roi-summary",
    "/sponsor-report/pilot-outcomes": "/insights/pilot-outcomes",
    "/sponsor-report/architecture-scorecard": "/insights/architecture-scorecard",
    "/value-report": "/insights/executive-summary",
    "/value-report/roi": "/insights/roi-summary",
    "/value-report/pilot": "/insights/pilot-outcomes",
    # Validate review (replay) under Internal Operations.
    "/replay": "/internal/replay",
    # Legacy internal-ops path segments.
    "/internal-operations/recommendation-learning": "/internal/recommendation-learning",
    "/operate/integration-events/dlq": "/internal/integration-events/dlq",
    "/product-learning": "/internal/product-learning",
}

# Paths that must not appear as scored App Router catalog entries (pages gone / never traffic-scored).
# RER run-scoped artifact Preview App Router shim removed — old bookmarks 404; Preview hrefs are GAR only.
REDIRECT_ONLY_APP_PATHS = frozenset(
    {
        "/advisory",
        "/advisory-scheduling",
        "/alert-routing",
        "/architecture/reviews/[runId]/artifacts/[artifactId]",
        "/demo",
    }
)

# Next.config-only redirect bookmarks that stay in the owner traffic workbook.
# /settings/alerts retired from the workbook (SEA removed, TB-1886–TB-1890); migration still maps to SAX.
# /settings/exec-digest retired from the workbook (EEX removed); migration still maps to DIS.
# Batch C folded FIR `/help/first-pilot-path` into COR — permanent redirect only (no traffic-tracked bookmark).
# TB-1794 / TB-1798 / TB-1801: legacy auth/onboarding bookmarks stay as redirect-shim workbook rows (LOG/OXX/OSX).
TRAFFIC_TRACKED_REDIRECT_BOOKMARKS: frozenset[str] = frozenset(
    {
        "/login",
        "/onboard",
        "/onboarding/start",
    }
)

# Operator-shell overlays scored in the workbook but not App Router pages.
SHELL_OVERLAY_TRAFFIC_ENTRIES: dict[str, str] = {
    "/shell/contextual-help-drawer": "Shell overlay",
}


@dataclass(frozen=True)
class CatalogEntry:
    path: str
    section: str
    source: str


def _omit_from_url(segment: str) -> bool:
    if segment.startswith("@"):
        return True
    if segment.startswith("_"):
        return True
    if len(segment) >= 2 and segment[0] == "(" and segment[-1] == ")":
        return True
    return False


def url_path_for_page(page_file: Path, app_dir: Path) -> str:
    rel_parent = page_file.parent.relative_to(app_dir)
    parts: list[str] = []
    for segment in rel_parent.parts:
        if _omit_from_url(segment):
            continue
        parts.append(segment)
    if not parts:
        return "/"
    return canonicalize_public_operator_path("/" + "/".join(parts))


def canonicalize_public_operator_path(path: str) -> str:
    """Map App Router filesystem paths to public `/architecture/*` URLs."""
    if path == "/reviews" or path.startswith("/reviews/"):
        return f"/architecture{path}"

    if path == "/architectures" or path.startswith("/architectures/"):
        return f"/architecture{path}"

    if path == "/administration/settings":
        return "/administration"

    if path.startswith("/administration/settings/"):
        return "/administration/" + path[len("/administration/settings/") :]

    return path


def discover_app_router_paths(app_dir: Path = UI_APP_DIR) -> list[str]:
    if not app_dir.is_dir():
        return []
    paths: list[str] = []
    for page in sorted(app_dir.rglob("page.tsx")):
        if page.is_file():
            paths.append(url_path_for_page(page, app_dir))
    return sorted(set(paths))


def _parse_ts_string_array(file_path: Path, const_name: str) -> list[str]:
    if not file_path.is_file():
        return []
    text = file_path.read_text(encoding="utf-8")
    pattern = rf"export const {re.escape(const_name)} = \[([^\]]+)\]"
    match = re.search(pattern, text, re.DOTALL)
    if match is None:
        return []
    return re.findall(r'"([^"]+)"', match.group(1))


def _parse_help_slugs(registry_path: Path = HELP_REGISTRY) -> list[str]:
    if not registry_path.is_file():
        return []
    text = registry_path.read_text(encoding="utf-8")
    return sorted(set(re.findall(r'^\s+slug:\s*"([^"]+)"', text, flags=re.MULTILINE)))


def _parse_cloud_connections_help_providers(
    routes_path: Path = CLOUD_CONNECTIONS_HELP_ROUTES,
) -> list[str]:
    return _parse_ts_string_array(routes_path, "CLOUD_CONNECTIONS_HELP_PROVIDERS")


def _retired_cloud_connections_hyphen_help_paths() -> set[str]:
    """Hyphen bookmark URLs superseded by slash canonicals (`cloud-connections-help-routes.ts`)."""
    return {f"/help/cloud-connections-{provider}" for provider in _parse_cloud_connections_help_providers()}


def _cloud_connections_slash_help_paths() -> list[str]:
    providers = _parse_cloud_connections_help_providers()

    return [f"/help/cloud-connections/{provider}" for provider in providers]


def discover_help_paths() -> tuple[list[str], set[str]]:
    slugs = _parse_help_slugs()
    retired_slug_paths = _retired_cloud_connections_hyphen_help_paths()
    paths = ["/help"]
    paths.extend(f"/help/{slug}" for slug in slugs if f"/help/{slug}" not in retired_slug_paths)
    paths.extend(_cloud_connections_slash_help_paths())
    alias_paths = {path for path in paths if path.startswith("/help/cloud-connections/")}

    return sorted(set(paths)), alias_paths


def _tab_path(base_path: str, param: str, value: str) -> str:
    return f"{base_path}?{param}={value}"


def discover_tab_paths() -> list[str]:
    advisory_tabs = _parse_ts_string_array(UI_LIB_DIR / "advisory-hub-tab.ts", "ADVISORY_HUB_TAB_IDS")
    digests_tabs = _parse_ts_string_array(UI_LIB_DIR / "digests-hub-tab.ts", "DIGESTS_HUB_TAB_IDS")
    alert_rules_tabs = _parse_ts_string_array(UI_LIB_DIR / "alerts-hub-tab.ts", "ALERT_RULES_HUB_TAB_IDS")
    arch_tabs = _parse_ts_string_array(
        UI_LIB_DIR / "architecture-workspace-tabs.ts",
        "ARCHITECTURE_WORKSPACE_TAB_IDS",
    )

    paths: list[str] = []
    for tab_id in advisory_tabs:
        paths.append(_tab_path("/governance/advisory-scans", "tab", tab_id))
    for tab_id in digests_tabs:
        paths.append(_tab_path("/architecture/digests", "tab", tab_id))
    for tab_id in alert_rules_tabs:
        paths.append(_tab_path("/governance/alert-rules", "tab", tab_id))
    # Alerts inbox is bare `/governance/alerts` (AL) — do not invent `?tab=inbox` (GOI removed).
    for tab_id in ("users", "roles"):
        paths.append(_tab_path("/administration/users", "tab", tab_id))
    for path_mode in ("quick-review", "guided-intake", "detailed"):
        paths.append(_tab_path("/architecture/reviews/new", "path", path_mode))
    for tab_id in arch_tabs:
        paths.append(_tab_path("/architecture/reviews/[runId]", "archTab", tab_id))
    return sorted(set(paths))


def infer_section(path: str, *, help_alias_paths: set[str]) -> str:
    if "?" in path:
        return "Tab surface"
    if path == "/help":
        return "Help hub"
    if path.startswith("/help/"):
        if path in INTERNAL_UX_RANKING_HELP_PATHS:
            return "Internal"
        if path in help_alias_paths:
            return "Help alias"
        return "Help topic"
    # Public architecture-prefixed reviews / architectures (canonical URLs).
    if path.startswith("/architecture/reviews") or path.startswith("/reviews"):
        return "Core review"
    if path.startswith("/architecture/architectures") or path.startswith("/architectures"):
        return "Core review"
    if path.startswith("/architecture/executive-dashboard"):
        return "Executive"
    if path.startswith("/architecture/architecture-intelligence") or path.startswith(
        "/architecture-intelligence"
    ):
        return "Core review"
    if path in ("/", "/dashboard", "/ask") or path.startswith("/insights/ask-review-questions"):
        return "Core review"
    if path.startswith("/governance/advisory-scans") or path.startswith("/operate"):
        return "Advisory"
    if path.startswith("/governance") or path.startswith("/alert"):
        return "Alerts/gov"
    if path.startswith("/settings"):
        return "Settings"
    if path.startswith("/integrations"):
        return "Integrations"
    if path.startswith("/internal"):
        if path.startswith("/internal/integration-events"):
            return "Advisory"
        if path == "/internal/product-learning":
            return "Onboarding"
        if path == "/internal/replay":
            return "Marketing"
        return "Admin"
    if path.startswith("/admin"):
        return "Admin"
    if path.startswith("/auth") or path == "/login" or path == "/403":
        return "Auth"
    if path.startswith("/help"):
        return "Help topic"
    if path.startswith("/executive"):
        return "Executive"
    if (
        path.startswith("/insights/executive-summary")
        or path.startswith("/insights/roi-summary")
        or path.startswith("/insights/pilot-outcomes")
    ):
        return "Sponsor report"
    if path.startswith("/architecture/digests") or path.startswith("/digests") or path == "/digest-subscriptions":
        return "Digests"
    if path.startswith("/insights/architecture-scorecard"):
        return "Insights"
    if path.startswith("/insights/evidence-graph"):
        return "Planning"
    if (
        path == "/architecture/first-review-guide"
        or path.startswith("/onboard")
        or path.startswith("/getting-started")
    ):
        return "Onboarding"
    if path.startswith("/planning") or path.startswith("/graph") or path == "/compare":
        return "Planning"
    if path in ("/why-archlucid", "/demo/explain"):
        return "Learning"
    return "Marketing"


def build_catalog() -> dict[str, CatalogEntry]:
    help_paths, help_alias_paths = discover_help_paths()
    catalog: dict[str, CatalogEntry] = {}

    for path in discover_app_router_paths():
        if path in REDIRECT_ONLY_APP_PATHS:
            continue

        catalog[path] = CatalogEntry(path=path, section=infer_section(path, help_alias_paths=help_alias_paths), source="app_router")

    for path in help_paths:
        # Migrated-away aliases stay out of the traffic catalog unless explicitly tracked.
        if path in WORKBOOK_PATH_MIGRATIONS and path not in TRAFFIC_TRACKED_REDIRECT_BOOKMARKS:
            continue

        if path not in catalog:
            catalog[path] = CatalogEntry(
                path=path,
                section=infer_section(path, help_alias_paths=help_alias_paths),
                source="help_alias" if path in help_alias_paths else "help_topic",
            )

    for path in discover_tab_paths():
        catalog[path] = CatalogEntry(path=path, section="Tab surface", source="tab_surface")

    for path, section in SHELL_OVERLAY_TRAFFIC_ENTRIES.items():
        catalog[path] = CatalogEntry(path=path, section=section, source="shell_overlay")

    for path in TRAFFIC_TRACKED_REDIRECT_BOOKMARKS:
        if path not in catalog:
            catalog[path] = CatalogEntry(
                path=path,
                section=infer_section(path, help_alias_paths=help_alias_paths),
                source="redirect_bookmark",
            )

    return catalog


def migrate_workbook_path(path: str) -> str:
    current = path
    seen: set[str] = set()
    while current in WORKBOOK_PATH_MIGRATIONS:
        if current in seen:
            break
        seen.add(current)
        current = WORKBOOK_PATH_MIGRATIONS[current]

    if "?" in current:
        base, query = current.split("?", 1)
        return f"{canonicalize_public_operator_path(base)}?{query}"

    return canonicalize_public_operator_path(current)


def suggest_row_id(path: str, used_ids: set[str]) -> str:
    base_path, _, query = path.partition("?")
    tokens: list[str] = []
    for segment in base_path.strip("/").split("/"):
        if not segment:
            continue
        if segment.startswith("[") and segment.endswith("]"):
            inner = segment[1:-1]
            tokens.append(inner[:2].upper() if inner else "X")
        else:
            tokens.append(segment[0].upper())
            if len(segment) > 1:
                tokens.append(segment[1].upper())

    if query:
        for key in ("archTab", "path", "tab"):
            marker = f"{key}="
            if marker in query:
                value = query.split(marker, 1)[1].split("&", 1)[0]
                if value:
                    tokens.append(value[0].upper())
                break

    seed = "".join(tokens)
    if not seed:
        seed = "RT"
    candidates: list[str] = []
    candidates.append(seed[:3])
    if len(seed) > 3:
        candidates.append(seed[:2] + seed[-1])
    candidates.append(seed[0] + seed[-2:] if len(seed) >= 3 else seed.ljust(3, "X"))
    for length in (3, 2, 1):
        for start in range(0, max(1, len(seed) - length + 1)):
            candidates.append(seed[start : start + length].ljust(3, "X")[:3])

    for candidate in candidates:
        normalized = candidate.upper()[:3]
        if normalized and normalized not in used_ids:
            return normalized

    for suffix in range(2, 100):
        candidate = f"{seed[:2]}{suffix}"[:3]
        if candidate not in used_ids:
            return candidate

    raise ValueError(f"Could not allocate a unique row id for path {path!r}")


def app_router_page_count(app_dir: Path = UI_APP_DIR) -> int:
    if not app_dir.is_dir():
        return 0
    return sum(1 for page in app_dir.rglob("page.tsx") if page.is_file())
