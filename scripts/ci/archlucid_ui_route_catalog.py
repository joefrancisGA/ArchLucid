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
    "/internal/validate-route": "REP",
    "/shell/contextual-help-drawer": "HCD",
    "/help/choose-your-next-step": "HPX",
    "/governance/advisory-scans?tab=scans": "ADT",
    # App Router dynamic segment renamed [runId] → [reviewId]; keep stable workbook IDs on sync.
    "/architecture/reviews/[reviewId]": "RRE",
    "/architecture/reviews/[reviewId]/findings/[findingId]": "RRF",
    "/architecture/reviews/[reviewId]/findings/[findingId]/evidence-trace": "ERU",
    "/architecture/reviews/[reviewId]/provenance": "RRP",
    "/architecture/reviews/[reviewId]/print": "APR",
    "/architecture/reviews/[reviewId]?archTab=activity": "REA",
    "/architecture/reviews/[reviewId]?archTab=clarifications": "REC",
    "/architecture/reviews/[reviewId]?archTab=diagram": "RED",
    "/architecture/reviews/[reviewId]?archTab=evidence": "REE",
    "/architecture/reviews/[reviewId]?archTab=findings": "REF",
    "/architecture/reviews/[reviewId]?archTab=governance": "REG",
    "/architecture/reviews/[reviewId]?archTab=overview": "REO",
    "/insights/pilot-outcomes": "SPP",
    "/insights/sponsor-report": "SPE",
}

# When workbook path migrations collide, keep the canonical tab/hub row id (ADV hub retired → ADT).
WORKBOOK_COLLISION_PREFERRED_ROW_IDS: dict[str, str] = {
    "/governance/advisory-scans?tab=scans": "ADT",
    "/administration/workspace-settings": "ATE",
    "/administration/workspace-settings/recycle-bin": "STR",
}

# Routes outside `/internal` excluded from buyer UX scoring (/al-ui-lowest) and buyer traffic rollup.
INTERNAL_UX_RANKING_EXCLUDED_PATHS: frozenset[str] = frozenset(
    {
        "/help/configuration-reference",
        "/demo/explain",
        "/internal/agent-model-catalog",
        "/internal/platform-bundled-policy-packs",
    }
)

# TB-2241 — canonical contextual-only operator paths (must match nav-contextual-only-operator-paths.ts).
CONTEXTUAL_ONLY_OPERATOR_NAV_PATHS: frozenset[str] = frozenset(
    {
        "/architecture/architecture-intelligence",
    }
)

# Back-compat alias — name predates non-help exclusions (e.g. DEX).
INTERNAL_UX_RANKING_HELP_PATHS = INTERNAL_UX_RANKING_EXCLUDED_PATHS

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
    # Legacy key: /help/policy-pack-delta-demo is a live registry topic again, so this entry only
    # keeps the route out of the traffic catalog. Dropping it needs a workbook sync for the new row.
    "/help/policy-pack-delta-demo": "/help/policy-packs#policy-pack-delta-demo",
    "/manifests": "/governance/sealed-records",
    "/manifests/[manifestId]": "/governance/sealed-records/[manifestId]",
    "/manifests/[manifestId]/artifacts/[artifactId]": (
        "/governance/sealed-records/[manifestId]/artifacts/[artifactId]"
    ),
    "/signed-records": "/governance/sealed-records",
    "/signed-records/[manifestId]": "/governance/sealed-records/[manifestId]",
    "/signed-records/[manifestId]/artifacts/[artifactId]": (
        "/governance/sealed-records/[manifestId]/artifacts/[artifactId]"
    ),
    "/governance/signed-records": "/governance/sealed-records",
    "/governance/signed-records/[manifestId]": "/governance/sealed-records/[manifestId]",
    "/governance/signed-records/[manifestId]/artifacts/[artifactId]": (
        "/governance/sealed-records/[manifestId]/artifacts/[artifactId]"
    ),
    "/settings/cost-reporting": "/administration/ai-usage",
    "/settings/ai-usage": "/administration/ai-usage",
    "/admin/ai-usage-cost": "/administration/ai-usage",
    "/quick-start": "/get-started",
    "/administration/tenant": "/administration/workspace-settings",
    "/administration/tenant/recycle-bin": "/administration/workspace-settings/recycle-bin",
    "/governance/alerts?tab=inbox": "/governance/alerts",
    # TB-1124: Advisory scans hub under Governance (next.config permanent redirects only).
    # ADV workbook row retired — fold hub Hit% into default Scans tab (ADT).
    "/advisory": "/governance/advisory-scans?tab=scans",
    "/governance/advisory-scans": "/governance/advisory-scans?tab=scans",
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
    "/architecture/digests?tab=browse": "/architecture/digests?tab=get-started",
    "/digests?tab=browse": "/architecture/digests?tab=get-started",
    "/health": "/administration/system-health",
    "/dashboard": "/architecture/sponsor-dashboard",
    "/sponsor/dashboard": "/architecture/sponsor-dashboard",
    "/portfolio": "/architecture/sponsor-dashboard",
    # Public architecture-prefixed reviews / architectures URLs (App Router still under /reviews).
    "/reviews": "/architecture/reviews",
    "/reviews/new": "/architecture/reviews/new",
    "/reviews/[runId]": "/architecture/reviews/[reviewId]",
    "/reviews/[runId]/findings/[findingId]": "/architecture/reviews/[reviewId]/findings/[findingId]",
    "/reviews/[runId]/findings/[findingId]/inspect": "/architecture/reviews/[reviewId]/findings/[findingId]/inspect",
    "/reviews/[runId]/findings/[findingId]/evidence-trace": (
        "/architecture/reviews/[reviewId]/findings/[findingId]/evidence-trace"
    ),
    "/reviews/[runId]/provenance": "/architecture/reviews/[reviewId]/provenance",
    "/reviews/[runId]/signed-record": "/architecture/reviews/[reviewId]/signed-record",
    "/reviews/[runId]?archTab=governance": "/architecture/reviews/[reviewId]?archTab=governance",
    # Workbook rows that still use the old dynamic segment after /architecture/reviews/ prefix migration.
    "/architecture/reviews/[runId]": "/architecture/reviews/[reviewId]",
    "/architecture/reviews/[runId]/findings/[findingId]": "/architecture/reviews/[reviewId]/findings/[findingId]",
    "/architecture/reviews/[runId]/findings/[findingId]/evidence-trace": (
        "/architecture/reviews/[reviewId]/findings/[findingId]/evidence-trace"
    ),
    "/architecture/reviews/[runId]/provenance": "/architecture/reviews/[reviewId]/provenance",
    "/architecture/reviews/[runId]/print": "/architecture/reviews/[reviewId]/print",
    "/architecture/reviews/[runId]?archTab=activity": "/architecture/reviews/[reviewId]?archTab=activity",
    "/architecture/reviews/[runId]?archTab=clarifications": "/architecture/reviews/[reviewId]?archTab=clarifications",
    "/architecture/reviews/[runId]?archTab=diagram": "/architecture/reviews/[reviewId]?archTab=diagram",
    "/architecture/reviews/[runId]?archTab=evidence": "/architecture/reviews/[reviewId]?archTab=evidence",
    "/architecture/reviews/[runId]?archTab=findings": "/architecture/reviews/[reviewId]?archTab=findings",
    "/architecture/reviews/[runId]?archTab=governance": "/architecture/reviews/[reviewId]?archTab=governance",
    "/architecture/reviews/[runId]?archTab=overview": "/architecture/reviews/[reviewId]?archTab=overview",
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
    "/sponsor-report": "/insights/sponsor-report",
    "/sponsor-report/sponsor-report": "/insights/sponsor-report",
    "/sponsor-report/roi-summary": "/insights/roi-summary",
    "/sponsor-report/pilot-outcomes": "/insights/pilot-outcomes",
    "/sponsor-report/architecture-scorecard": "/insights/architecture-scorecard",
    "/value-report": "/insights/sponsor-report",
    "/value-report/roi": "/insights/roi-summary",
    # Pilot outcomes merged into the sponsor report; retired without a redirect, so SPP hit share
    # folds into the SPE row rather than tracking a dead path. Migrations resolve in a single pass,
    # so the older `/value-report/pilot` bookmark has to name the final destination too.
    "/value-report/pilot": "/insights/sponsor-report",
    # Validate review (replay) under Internal Operations.
    "/replay": "/internal/validate-route",
    "/internal/replay": "/internal/validate-route",
    # Legacy internal-ops path segments.
    "/internal-operations/recommendation-learning": "/internal/recommendation-learning",
    "/operate/integration-events/dlq": "/internal/failed-integration-messages",
    "/internal/integration-events/dlq": "/internal/failed-integration-messages",
    "/product-learning": "/internal/product-learning",
}

# Hub/live paths that stay in the app but are not scored in the owner workbook.
# /governance/advisory-scans hub retired (ADV removed); default Scans tab ADT is canonical.
TRAFFIC_EXCLUDED_APP_ROUTER_PATHS: frozenset[str] = frozenset(
    {
        "/governance/advisory-scans",
    }
)

# Paths that must not appear as scored App Router catalog entries (pages gone / never traffic-scored).
# RER run-scoped artifact Preview App Router shim removed — old bookmarks 404; Preview hrefs are GAR only.
# /example-roi-bulletin marketing page removed (EXA retired); old bookmarks 404.
REDIRECT_ONLY_APP_PATHS = frozenset(
    {
        "/advisory",
        "/advisory-scheduling",
        "/alert-routing",
        "/administration/tenant",
        "/administration/tenant/recycle-bin",
        "/architecture/reviews/[reviewId]/artifacts/[artifactId]",
        "/demo",
        "/example-roi-bulletin",
        "/internal/replay",
    }
)

# Next.config-only redirect bookmarks that stay in the owner traffic workbook.
# /settings/alerts retired from the workbook (SEA removed, TB-1886–TB-1890); migration still maps to SAX.
# /settings/exec-digest retired from the workbook (EEX removed); migration still maps to DIS.
# Batch C folded FIR `/help/first-pilot-path` into COR — permanent redirect only (no traffic-tracked bookmark).
# Legacy bookmark paths migrate in WORKBOOK_PATH_MIGRATIONS only — not scored workbook rows.
TRAFFIC_TRACKED_REDIRECT_BOOKMARKS: frozenset[str] = frozenset()

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
        UI_LIB_DIR / "architecture" / "architecture-workspace-tabs.ts",
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
        paths.append(_tab_path("/architecture/reviews/[reviewId]", "archTab", tab_id))
    return sorted(set(paths))


def _is_redirect_shim_path(path: str) -> bool:
    return path in TRAFFIC_TRACKED_REDIRECT_BOOKMARKS


def infer_section(path: str, *, help_alias_paths: set[str]) -> str:
    if _is_redirect_shim_path(path):
        return "Redirect shim"

    if path in INTERNAL_UX_RANKING_EXCLUDED_PATHS:
        return "Internal"

    if "?" in path:
        return "Tab surface"
    if path == "/help":
        return "Help hub"
    if path.startswith("/help/"):
        if path in INTERNAL_UX_RANKING_EXCLUDED_PATHS:
            return "Internal"
        if path in help_alias_paths:
            return "Help alias"
        return "Help topic"
    # Public architecture-prefixed reviews / architectures (canonical URLs).
    if path.startswith("/architecture/reviews") or path.startswith("/reviews"):
        return "Core review"
    if path.startswith("/architecture/architectures") or path.startswith("/architectures"):
        return "Core review"
    if path.startswith("/architecture/sponsor-dashboard"):
        return "Sponsor"
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
        if path == "/internal/validate-route":
            return "Marketing"
        return "Admin"
    if path.startswith("/admin"):
        return "Admin"
    if path.startswith("/auth") or path == "/403":
        return "Auth"
    if path.startswith("/help"):
        return "Help topic"
    if path.startswith("/sponsor"):
        return "Sponsor"
    if (
        path.startswith("/insights/sponsor-report")
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
    if path == "/why-archlucid":
        return "Learning"
    return "Marketing"


def build_catalog() -> dict[str, CatalogEntry]:
    help_paths, help_alias_paths = discover_help_paths()
    catalog: dict[str, CatalogEntry] = {}

    for path in discover_app_router_paths():
        if path in REDIRECT_ONLY_APP_PATHS:
            continue

        if path in TRAFFIC_EXCLUDED_APP_ROUTER_PATHS:
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
