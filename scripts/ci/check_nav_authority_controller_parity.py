#!/usr/bin/env python3
"""TB-882 — cross-check nav-config requiredAuthority vs ASP.NET controller GET policies.

Detects drift where operator sidebar authority does not match the primary page-load GET
policy on mapped API controllers (TB-623 looser-nav / TB-625 stricter-nav shapes).

See docs/library/TECH_BACKLOG.md (TB-882) and archlucid-ui/docs/NAV_CONFIG_CONTRACT.md.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

AUTHORITY_RANK: dict[str, int] = {
    "ReadAuthority": 1,
    "ExecuteAuthority": 2,
    "AdminAuthority": 3,
}

# Host.Core policy aliases that gate the same nav tiers as ArchLucidPolicies.*Authority.
_POLICY_ALIASES: dict[str, str] = {
    "RequireAdmin": "AdminAuthority",
}

_CLASS_LINE_RE = re.compile(r"^\s*public\s+(?:(?:sealed|partial)\s+)*class\s+(\w+)\b")
_ATTR_ROUTE_RE = re.compile(r'\[Route\(\s*"([^"]+)"\s*\)\]')
_POLICY_ON_LINE_RE = re.compile(r"Policy\s*=\s*ArchLucidPolicies\.(\w+)")
_ATTR_BARE_AUTH_RE = re.compile(r"\[Authorize\]\s*$")
_ATTR_ALLOW_ANON_RE = re.compile(r"\[AllowAnonymous\]")
_HTTP_GET_RE = re.compile(r"\[HttpGet(?:\(([^)]*)\))?\]")
_METHOD_SIG_RE = re.compile(
    r"^\s*(?:public|private|protected|internal)\s+(?:async\s+)?[\w<>,\[\]?]+\s+(\w+)\s*\("
)
_TS_CONST_PATH_RE = re.compile(
    r"export\s+const\s+(\w+)\s*=\s*(?:`([^`]+)`|\"([^\"]+)\")(?:\s+as\s+const)?"
)
_HREF_FIELD_RE = re.compile(
    r"href:\s*(?:\"(/[^\"#]*)\"(?:\s+as\s+typeof[^,]*)?|(\w+)(?:\s+as\s+typeof[^,]*)?)"
)
_REQUIRED_AUTH_RE = re.compile(r"requiredAuthority:\s*\"(\w+Authority)\"")


@dataclass(frozen=True)
class NavLinkAuthority:
    href: str
    required_authority: str
    source_file: str


@dataclass(frozen=True)
class PrimaryGetPolicy:
    relative_path: str
    class_name: str
    method_name: str
    http_get_route: str | None
    effective_policy: str


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def overrides_path(root: Path) -> Path:
    return root / "scripts" / "ci" / "data" / "route_tier_policy_nav_overrides.json"


def exemptions_path(root: Path) -> Path:
    return root / "scripts" / "ci" / "data" / "nav_authority_controller_parity_exemptions.json"


def manifest_path(root: Path) -> Path:
    return root / "scripts" / "ci" / "data" / "nav_authority_controller_parity_manifest.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def harvest_ts_path_constants(ui_lib_dir: Path) -> dict[str, str]:
    """Collect export const path literals from archlucid-ui/src/lib for href resolution."""
    constants: dict[str, str] = {}

    for path in sorted(ui_lib_dir.rglob("*.ts")):
        text = path.read_text(encoding="utf-8")
        for match in _TS_CONST_PATH_RE.finditer(text):
            name = match.group(1)
            raw = match.group(2) if match.group(2) is not None else match.group(3)
            if raw is None:
                continue

            resolved = raw
            for _ in range(4):
                changed = False
                for const_name, const_value in constants.items():
                    token = "${" + const_name + "}"
                    if token in resolved:
                        resolved = resolved.replace(token, const_value)
                        changed = True
                if not changed:
                    break

            if resolved.startswith("/"):
                constants[name] = resolved

    return constants


def resolve_href_token(token: str, constants: dict[str, str]) -> str | None:
    stripped = token.strip()
    if stripped.startswith("/"):
        return stripped.split("#")[0].split("?")[0] or stripped

    if stripped in constants:
        return constants[stripped].split("#")[0].split("?")[0]

    return None


def parse_nav_link_authorities(ui_lib_dir: Path) -> list[NavLinkAuthority]:
    constants = harvest_ts_path_constants(ui_lib_dir)
    links: list[NavLinkAuthority] = []

    for path in sorted(ui_lib_dir.rglob("*nav-group-builder.ts")):
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ui_lib_dir).as_posix()

        for block in re.findall(r"\{[^{}]*href:[^{}]*\}", text, flags=re.DOTALL):
            auth_match = _REQUIRED_AUTH_RE.search(block)
            if auth_match is None:
                continue

            href_match = _HREF_FIELD_RE.search(block)
            if href_match is None:
                continue

            literal = href_match.group(1)
            const_name = href_match.group(2)
            href = literal if literal is not None else resolve_href_token(const_name or "", constants)
            if href is None:
                continue

            links.append(
                NavLinkAuthority(
                    href=href,
                    required_authority=auth_match.group(1),
                    source_file=rel,
                )
            )

    by_href: dict[str, NavLinkAuthority] = {}
    for link in links:
        existing = by_href.get(link.href)
        if existing is not None and existing.required_authority != link.required_authority:
            raise ValueError(
                f"nav href {link.href!r} has conflicting requiredAuthority: "
                f"{existing.required_authority!r} vs {link.required_authority!r}"
            )
        by_href[link.href] = link

    return sorted(by_href.values(), key=lambda item: item.href)


def reverse_nav_controller_map(overrides: dict) -> dict[str, list[str]]:
    nav_map = overrides.get("nav_operator_href_by_controller_file") or {}
    if not isinstance(nav_map, dict):
        raise ValueError("overrides.nav_operator_href_by_controller_file must be an object")

    href_to_controllers: dict[str, list[str]] = {}
    for controller_file, href in nav_map.items():
        if not isinstance(controller_file, str) or not isinstance(href, str):
            continue
        normalized = href.split("#")[0].split("?")[0]
        href_to_controllers.setdefault(normalized, []).append(controller_file)

    for href in href_to_controllers:
        href_to_controllers[href] = sorted(set(href_to_controllers[href]))

    return href_to_controllers


def _collect_class_attributes(lines: list[str], class_line_index: int) -> list[str]:
    attrs: list[str] = []
    j = class_line_index - 1
    while j >= 0:
        raw = lines[j]
        s = raw.strip()
        if s == "":
            break
        if s.startswith("//") or s.startswith("///"):
            j -= 1
            continue
        if not s.startswith("["):
            break
        attrs.insert(0, s)
        j -= 1
    return attrs


def _normalize_policy(policy: str | None) -> str | None:
    if policy is None:
        return None
    return _POLICY_ALIASES.get(policy, policy)


def _policy_from_attributes(attrs: list[str]) -> str | None:
    for attr in reversed(attrs):
        if not attr.startswith("[Authorize"):
            continue
        match = _POLICY_ON_LINE_RE.search(attr)
        if match is not None:
            return _normalize_policy(match.group(1))
        if _ATTR_BARE_AUTH_RE.match(attr):
            return "Authorize"
    if any(_ATTR_ALLOW_ANON_RE.search(attr) for attr in attrs):
        return "AllowAnonymous"
    return None


def _collect_method_attribute_lines(lines: list[str], http_get_index: int) -> list[str]:
    attrs: list[str] = []
    j = http_get_index - 1
    while j >= 0:
        s = lines[j].strip()
        if s == "":
            break
        if s.startswith("//") or s.startswith("///"):
            j -= 1
            continue
        if not s.startswith("["):
            break
        attrs.insert(0, s)
        j -= 1

    attrs.append(lines[http_get_index].strip())

    k = http_get_index + 1
    while k < len(lines):
        s = lines[k].strip()
        if s == "":
            k += 1
            continue
        if s.startswith("//") or s.startswith("///"):
            k += 1
            continue
        if s.startswith("["):
            attrs.append(s)
            k += 1
            continue
        break

    return attrs


def _http_get_route_specificity(route_arg: str | None) -> tuple[int, int]:
    if route_arg is None or route_arg.strip() == "":
        return (0, 0)
    cleaned = route_arg.strip().strip('"')
    if "{" in cleaned:
        return (2, len(cleaned))
    return (1, len(cleaned))


@dataclass(frozen=True)
class ControllerSourceGroup:
    relative_paths: tuple[str, ...]
    class_name: str
    class_policy: str | None


def _is_controller_source_file(file_name: str) -> bool:
    return bool(re.match(r".*Controller(?:\.[^.]+)?\.cs$", file_name))


def _discover_controller_groups(controllers_dir: Path) -> dict[str, ControllerSourceGroup]:
    groups: dict[str, list[str]] = {}
    class_policy_by_group: dict[str, str | None] = {}
    class_name_by_group: dict[str, str] = {}

    for path in sorted(controllers_dir.rglob("*.cs")):
        if not _is_controller_source_file(path.name):
            continue
        rel = path.relative_to(controllers_dir).as_posix()
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines()
        class_name: str | None = None
        class_line_index = -1

        for i, line in enumerate(lines):
            match = _CLASS_LINE_RE.match(line)
            if match is None:
                continue
            candidate = match.group(1)
            if not candidate.endswith("Controller"):
                continue
            class_name = candidate
            class_line_index = i
            break

        if class_name is None:
            continue

        group_key = f"{path.parent.relative_to(controllers_dir).as_posix()}::{class_name}"
        groups.setdefault(group_key, []).append(rel)
        class_name_by_group[group_key] = class_name

        attrs = _collect_class_attributes(lines, class_line_index)
        policy = _policy_from_attributes(attrs)
        if policy not in (None, "AllowAnonymous", "Authorize", "none"):
            class_policy_by_group[group_key] = policy
        elif group_key not in class_policy_by_group:
            class_policy_by_group[group_key] = policy

    out: dict[str, ControllerSourceGroup] = {}
    for group_key, rel_paths in groups.items():
        out[group_key] = ControllerSourceGroup(
            relative_paths=tuple(sorted(rel_paths)),
            class_name=class_name_by_group[group_key],
            class_policy=class_policy_by_group.get(group_key),
        )
    return out


def _primary_get_from_group(
    group: ControllerSourceGroup,
    controllers_dir: Path,
) -> PrimaryGetPolicy | None:
    lines: list[str] = []
    for rel in group.relative_paths:
        lines.extend((controllers_dir / rel).read_text(encoding="utf-8").splitlines())
        lines.append("")

    class_policy = group.class_policy
    candidates: list[tuple[tuple[int, int], int, str, str | None, list[str], str]] = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        get_match = _HTTP_GET_RE.match(line)
        if get_match is None:
            i += 1
            continue

        route_arg = get_match.group(1)
        method_attrs = _collect_method_attribute_lines(lines, i)

        method_name = "unknown"
        k = i + 1
        while k < len(lines):
            sig = _METHOD_SIG_RE.match(lines[k])
            if sig is not None:
                method_name = sig.group(1)
                break
            if lines[k].strip() and not lines[k].strip().startswith("["):
                break
            k += 1

        effective = _policy_from_attributes(method_attrs) or class_policy
        if effective in (None, "AllowAnonymous", "Authorize", "none"):
            i += 1
            continue

        source_rel = group.relative_paths[0]
        candidates.append(
            (
                _http_get_route_specificity(route_arg),
                i,
                method_name,
                route_arg.strip().strip('"') if route_arg else None,
                method_attrs,
                source_rel,
            )
        )
        i += 1

    primary_rel = group.relative_paths[0]
    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0][0], item[0][1], item[1]))
    _, _, method_name, route, method_attrs, source_rel = candidates[0]
    effective = _policy_from_attributes(method_attrs) or class_policy
    if effective is None:
        return None

    return PrimaryGetPolicy(
        relative_path=source_rel,
        class_name=group.class_name,
        method_name=method_name,
        http_get_route=route,
        effective_policy=effective,
    )


def parse_primary_get_policy(text: str, relative_path: str) -> PrimaryGetPolicy | None:
    """Parse one controller source file in isolation (unit-test helper)."""
    lines = text.splitlines()
    class_name: str | None = None
    class_line_index = -1

    for i, line in enumerate(lines):
        match = _CLASS_LINE_RE.match(line)
        if match is None:
            continue
        candidate = match.group(1)
        if not candidate.endswith("Controller"):
            continue
        class_name = candidate
        class_line_index = i
        break

    if class_name is None:
        return None

    class_policy = _policy_from_attributes(_collect_class_attributes(lines, class_line_index))
    candidates: list[tuple[tuple[int, int], int, str, str | None, list[str]]] = []

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        get_match = _HTTP_GET_RE.match(line)
        if get_match is None:
            i += 1
            continue

        route_arg = get_match.group(1)
        method_attrs = _collect_method_attribute_lines(lines, i)

        method_name = "unknown"
        k = i + 1
        while k < len(lines):
            sig = _METHOD_SIG_RE.match(lines[k])
            if sig is not None:
                method_name = sig.group(1)
                break
            if lines[k].strip() and not lines[k].strip().startswith("["):
                break
            k += 1

        effective = _policy_from_attributes(method_attrs) or class_policy
        if effective in (None, "AllowAnonymous", "Authorize", "none"):
            i += 1
            continue

        candidates.append(
            (
                _http_get_route_specificity(route_arg),
                i,
                method_name,
                route_arg.strip().strip('"') if route_arg else None,
                method_attrs,
            )
        )
        i += 1

    if not candidates:
        return None

    candidates.sort(key=lambda item: (item[0][0], item[0][1], item[1]))
    _, _, method_name, route, method_attrs = candidates[0]
    effective = _policy_from_attributes(method_attrs) or class_policy
    if effective is None:
        return None

    return PrimaryGetPolicy(
        relative_path=relative_path,
        class_name=class_name,
        method_name=method_name,
        http_get_route=route,
        effective_policy=effective,
    )


def discover_primary_get_policies(controllers_dir: Path) -> dict[str, PrimaryGetPolicy]:
    policies: dict[str, PrimaryGetPolicy] = {}
    for group in _discover_controller_groups(controllers_dir).values():
        parsed = _primary_get_from_group(group, controllers_dir)
        if parsed is None:
            continue
        for rel in group.relative_paths:
            policies[rel] = parsed
    return policies


def load_exemptions(root: Path) -> dict[str, dict]:
    path = exemptions_path(root)
    if not path.is_file():
        return {}

    data = load_json(path)
    rows = data.get("exemptions") or []
    out: dict[str, dict] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        href = row.get("nav_href")
        if isinstance(href, str) and href:
            out[href.split("#")[0].split("?")[0]] = row
    return out


def build_manifest_entries(root: Path) -> list[dict]:
    ui_lib = root / "archlucid-ui" / "src" / "lib"
    overrides = load_json(overrides_path(root))
    href_to_controllers = reverse_nav_controller_map(overrides)
    nav_links = parse_nav_link_authorities(ui_lib)
    controller_policies = discover_primary_get_policies(root / "ArchLucid.Api" / "Controllers")
    exemptions = load_exemptions(root)

    entries: list[dict] = []
    for link in nav_links:
        controllers = href_to_controllers.get(link.href, [])
        controller_rows: list[dict] = []

        for controller_file in controllers:
            policy_row = controller_policies.get(controller_file)
            if policy_row is None:
                controller_rows.append(
                    {
                        "controller_file": controller_file,
                        "primary_get_policy": None,
                        "method": None,
                    }
                )
                continue

            controller_rows.append(
                {
                    "controller_file": controller_file,
                    "primary_get_policy": policy_row.effective_policy,
                    "method": policy_row.method_name,
                    "http_get_route": policy_row.http_get_route,
                }
            )

        controllers_with_get = [
            row
            for row in controller_rows
            if isinstance(row.get("primary_get_policy"), str) and row.get("primary_get_policy")
        ]

        nav_rank = AUTHORITY_RANK.get(link.required_authority, 0)
        strictest_policy: str | None = None
        strictest_rank = 0
        loosest_policy: str | None = None
        loosest_rank = 0

        for row in controllers_with_get:
            policy = row["primary_get_policy"]
            rank = AUTHORITY_RANK.get(policy, 0)
            if rank > strictest_rank:
                strictest_rank = rank
                strictest_policy = policy
            if loosest_policy is None or rank < loosest_rank:
                loosest_rank = rank
                loosest_policy = policy

        parity = "unmapped"
        if controllers_with_get and strictest_policy is not None and loosest_policy is not None:
            parity = "match"
            if nav_rank < strictest_rank:
                parity = "nav_looser_than_controller"
            elif nav_rank > loosest_rank:
                parity = "nav_stricter_than_controller"

        entry = {
            "nav_href": link.href,
            "nav_required_authority": link.required_authority,
            "nav_source_file": link.source_file,
            "controller_primary_get_policy_strictest": strictest_policy,
            "controller_primary_get_policy_loosest": loosest_policy,
            "controller_files": controller_rows,
            "parity": parity,
        }
        if link.href in exemptions:
            entry["exemption"] = exemptions[link.href].get("code")
        entries.append(entry)

    return entries


def run_check(root: Path) -> list[str]:
    errors: list[str] = []
    exemptions = load_exemptions(root)
    known_codes: set[str] = set()
    ex_path = exemptions_path(root)
    if ex_path.is_file():
        for row in load_json(ex_path).get("exemptions", []):
            if isinstance(row, dict) and isinstance(row.get("code"), str):
                known_codes.add(row["code"])

    manifest_file = manifest_path(root)
    if not manifest_file.is_file():
        return [
            "missing nav authority parity manifest — run: "
            "python scripts/ci/check_nav_authority_controller_parity.py --sync"
        ]

    committed = load_json(manifest_file)
    live_entries = build_manifest_entries(root)
    live_by_href = {row["nav_href"]: row for row in live_entries}

    committed_entries = committed.get("entries")
    if not isinstance(committed_entries, list):
        return ["manifest: 'entries' must be a list"]

    if committed_entries != live_entries:
        errors.append(
            "nav authority parity manifest is stale — run: "
            "python scripts/ci/check_nav_authority_controller_parity.py --sync"
        )

    for entry in live_entries:
        href = entry["nav_href"]
        parity = entry.get("parity")
        nav_auth = entry.get("nav_required_authority")
        strictest_auth = entry.get("controller_primary_get_policy_strictest")
        loosest_auth = entry.get("controller_primary_get_policy_loosest")
        exemption_code = entry.get("exemption")

        if parity == "unmapped":
            continue

        if strictest_auth is None or loosest_auth is None:
            errors.append(f"{href}: mapped controllers lack a parseable primary HttpGet policy")
            continue

        if parity == "match":
            continue

        if exemption_code:
            if exemption_code not in known_codes:
                errors.append(f"{href}: exemption {exemption_code!r} missing from exemptions catalog")
            continue

        if parity == "nav_looser_than_controller":
            errors.append(
                f"{href}: nav requiredAuthority {nav_auth!r} is looser than controller primary GET "
                f"{strictest_auth!r} (TB-623 shape — sidebar shows link callers cannot load)"
            )
            continue

        if parity == "nav_stricter_than_controller":
            errors.append(
                f"{href}: nav requiredAuthority {nav_auth!r} is stricter than controller primary GET "
                f"{loosest_auth!r} (TB-625 shape — add exemption if intentional or align policies)"
            )
            continue

        errors.append(f"{href}: unknown parity state {parity!r}")

    for href, exemption in exemptions.items():
        if href not in live_by_href:
            errors.append(f"exemption references unknown nav href {href!r}")

    return errors


def run_sync(root: Path) -> list[str]:
    entries = build_manifest_entries(root)
    manifest_path(root).write_text(
        json.dumps({"version": 1, "entries": entries}, indent=2) + "\n",
        encoding="utf-8",
    )
    return run_check(root)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sync", action="store_true", help="Regenerate manifest JSON then verify.")
    args = parser.parse_args()

    root = repo_root()
    errors = run_sync(root) if args.sync else run_check(root)
    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        return 1

    print("nav authority / controller parity: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
