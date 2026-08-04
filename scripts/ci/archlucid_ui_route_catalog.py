"""Discover routable ArchLucid UI paths for the owner traffic workbook."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
UI_APP_DIR = REPO_ROOT / "archlucid-ui" / "src" / "app"
UI_LIB_DIR = REPO_ROOT / "archlucid-ui" / "src" / "lib"
HELP_REGISTRY = UI_LIB_DIR / "product-documentation-registry.ts"

# Default Hit% for catalog paths newly inserted by sync-archlucid-ui-route-traffic-workbook.py.
DEFAULT_NEW_HIT_PCT = "0.02%"

# Legacy workbook paths → canonical catalog paths (scores and Hit% merge on collision).
WORKBOOK_PATH_MIGRATIONS: dict[str, str] = {
    "/alerts": "/governance/alerts",
    "/audit": "/governance/audit",
    "/settings/cloud-connections": "/integrations/cloud-connections",
    "/settings/roles": "/administration/settings/users?tab=roles",
    "/settings/roles/invite-reviewer": "/administration/settings/users/invite-reviewer",
    "/admin/users": "/administration/settings/users",
    "/settings/users": "/administration/settings/users",
    "/settings/users?tab=users": "/administration/settings/users?tab=users",
    "/settings/users?tab=roles": "/administration/settings/users?tab=roles",
    "/settings/users?tab=keys": "/administration/settings/users?tab=keys",
    "/settings/users/invite-reviewer": "/administration/settings/users/invite-reviewer",
    "/admin/support": "/administration/settings/support",
    "/settings/support": "/administration/settings/support",
    "/workspace/security-trust": "/administration/settings/security-trust",
    "/settings/security-trust": "/administration/settings/security-trust",
    "/governance-resolution": "/governance/resolution",
    "/help/cloud-connections-azure": "/help/cloud-connections/azure",
    "/help/cloud-connections-aws": "/help/cloud-connections/aws",
    "/help/cloud-connections-gcp": "/help/cloud-connections/gcp",
    "/manifests": "/signed-records",
    "/manifests/[manifestId]": "/signed-records/[manifestId]",
    "/manifests/[manifestId]/artifacts/[artifactId]": "/signed-records/[manifestId]/artifacts/[artifactId]",
    "/settings/cost-reporting": "/administration/settings/ai-usage",
    "/settings/ai-usage": "/administration/settings/ai-usage",
    # TB-1124: Advisory scans hub under Governance (next.config permanent redirects only).
    "/advisory": "/governance/advisory-scans",
    "/advisory?tab=scans": "/governance/advisory-scans?tab=scans",
    "/advisory?tab=schedules": "/governance/advisory-scans?tab=schedules",
    "/advisory-scheduling": "/governance/advisory-scans?tab=schedules",
    # TB-1134: Governance setup route rename.
    "/governance/first-30-days": "/governance/setup",
    # TB-1441 / TB-1443: /alert-routing is next.config-only → Alert rules Routing tab.
    "/alert-routing": "/governance/alert-rules?tab=routing",
    # TB-1887 / TB-1886: /settings/alerts is next.config-only → Alert rules hub.
    "/settings/alerts": "/governance/alert-rules",
    # TB-1902 / TB-1901: /settings/exec-digest is next.config-only → Digests Schedule tab.
    "/settings/exec-digest": "/digests?tab=schedule",
    "/health": "/administration/system-health",
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
}

# Legacy App Router redirect stubs — canonical nav hrefs live under /governance/advisory-scans (TB-1124).
# /alert-routing has no App Router page after TB-1441 (next.config permanent redirect only).
REDIRECT_ONLY_APP_PATHS = frozenset(
    {
        "/advisory",
        "/advisory-scheduling",
        "/alert-routing",
    }
)

# Next.config-only redirect bookmarks that stay in the owner traffic workbook (TB-1887).
# /settings/exec-digest retired from the workbook (EEX removed); migration still maps to DIS.
TRAFFIC_TRACKED_REDIRECT_BOOKMARKS = frozenset(
    {
        "/settings/alerts",
        "/help/core-pilot",
    }
)


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


def _parse_help_aliases(registry_path: Path = HELP_REGISTRY) -> dict[str, str]:
    if not registry_path.is_file():
        return {}
    text = registry_path.read_text(encoding="utf-8")
    match = re.search(
        r"HELP_TOPIC_SLUG_ALIASES.*?=\s*\{([^}]+)\}",
        text,
        flags=re.DOTALL,
    )
    if match is None:
        return {}
    aliases: dict[str, str] = {}
    for alias, canonical in re.findall(r'"([^"]+)":\s*"([^"]+)"', match.group(1)):
        aliases[alias] = canonical
    return aliases


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
        paths.append(_tab_path("/digests", "tab", tab_id))
    for tab_id in alert_rules_tabs:
        paths.append(_tab_path("/governance/alert-rules", "tab", tab_id))
    # Inbox is the only non-redirect tab on the alerts hub.
    paths.append(_tab_path("/governance/alerts", "tab", "inbox"))
    for tab_id in ("users", "roles", "keys"):
        paths.append(_tab_path("/administration/settings/users", "tab", tab_id))
    for path_mode in ("quick-review", "guided-intake", "detailed"):
        paths.append(_tab_path("/architecture/reviews/new", "path", path_mode))
    for tab_id in arch_tabs:
        paths.append(_tab_path("/architecture/reviews/[runId]", "archTab", tab_id))
    return sorted(set(paths))


def _retired_help_slug_paths(aliases: dict[str, str]) -> set[str]:
    """Hyphen slug URLs superseded by per-cloud slash aliases in HELP_TOPIC_SLUG_ALIASES."""
    retired: set[str] = set()

    for _alias, canonical in aliases.items():

        if canonical.startswith("cloud-connections-"):
            retired.add(f"/help/{canonical}")

    return retired


def discover_help_paths() -> tuple[list[str], set[str]]:
    slugs = _parse_help_slugs()
    aliases = _parse_help_aliases()
    retired_slug_paths = _retired_help_slug_paths(aliases)
    paths = ["/help"]
    paths.extend(f"/help/{slug}" for slug in slugs if f"/help/{slug}" not in retired_slug_paths)
    paths.extend(f"/help/{alias}" for alias in aliases)
    alias_paths = {f"/help/{alias}" for alias in aliases}
    return sorted(set(paths)), alias_paths


def infer_section(path: str, *, help_alias_paths: set[str]) -> str:
    if "?" in path:
        return "Tab surface"
    if path == "/help":
        return "Help hub"
    if path.startswith("/help/"):
        if path in help_alias_paths:
            return "Help alias"
        return "Help topic"
    if path.startswith("/reviews"):
        return "Core review"
    if path.startswith("/architectures"):
        return "Core review"
    if path.startswith("/architecture-intelligence"):
        return "Core review"
    if path in ("/", "/dashboard", "/ask"):
        return "Core review"
    if path.startswith("/governance/advisory-scans") or path.startswith("/operate"):
        return "Advisory"
    if path.startswith("/governance") or path.startswith("/alert"):
        return "Alerts/gov"
    if path.startswith("/settings"):
        return "Settings"
    if path.startswith("/integrations"):
        return "Integrations"
    if path.startswith("/admin"):
        return "Admin"
    if path.startswith("/auth") or path == "/login" or path == "/403":
        return "Auth"
    if path.startswith("/help"):
        return "Help topic"
    if path.startswith("/executive"):
        return "Executive"
    if path.startswith("/digests") or path == "/digest-subscriptions":
        return "Digests"
    if path.startswith("/insights/evidence-graph"):
        return "Planning"
    if (
        path == "/architecture/first-review-guide"
        or path.startswith("/onboard")
        or path.startswith("/getting-started")
        or path == "/product-learning"
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
