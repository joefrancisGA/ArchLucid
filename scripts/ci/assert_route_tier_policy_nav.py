#!/usr/bin/env python3
"""Cross-check ArchLucid.Api controller route/policies/tier vs nav + documentation matrix + JSON registry.

See docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md and scripts/ci/data/route_tier_policy_nav_registry.json.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ControllerSurface:
    relative_path: str
    class_name: str
    route_raw: str
    normalized_prefix: str
    class_policy: str | None
    bare_authorize: bool
    allow_anonymous: bool
    commercial_tier: str | None


_ROUTE_TOKEN_RE = re.compile(r"v\{version:apiVersion\}")
_CLASS_LINE_RE = re.compile(r"^\s*public\s+(?:(?:sealed|partial)\s+)*class\s+(\w+)\b")
_ATTR_ROUTE_RE = re.compile(r'\[Route\(\s*"([^"]+)"\s*\)\]')
_POLICY_ON_LINE_RE = re.compile(r"Policy\s*=\s*ArchLucidPolicies\.(\w+)")
_ATTR_BARE_AUTH_RE = re.compile(r"\[Authorize\]\s*$")
_ATTR_ALLOW_ANON_RE = re.compile(r"\[AllowAnonymous\]")
_ATTR_TIER_RE = re.compile(r"\[RequiresCommercialTenantTier\(\s*TenantTier\.(\w+)\s*\)\]")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize_route(route_raw: str, class_name: str) -> str:
    if route_raw == "[controller]":
        stem = class_name[: -len("Controller")] if class_name.endswith("Controller") else class_name
        route_raw = stem.lower()

    normalized = _ROUTE_TOKEN_RE.sub("v1", route_raw)
    if not normalized.startswith("/"):
        normalized = "/" + normalized
    return normalized


def parse_controller_cs(text: str, relative_path: str) -> ControllerSurface | None:
    lines = text.splitlines()
    for i, line in enumerate(lines):
        m = _CLASS_LINE_RE.match(line)
        if m is None:
            continue

        class_name = m.group(1)
        if not class_name.endswith("Controller"):
            continue

        route_raw: str | None = None
        class_policy: str | None = None
        bare_authorize = False
        allow_anonymous = False
        commercial_tier: str | None = None

        j = i - 1
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

            if route_raw is None:
                rm = _ATTR_ROUTE_RE.search(s)
                if rm is not None:
                    route_raw = rm.group(1)

            if s.startswith("[Authorize"):
                pm = _POLICY_ON_LINE_RE.search(s)
                if pm is not None:
                    class_policy = pm.group(1)

            if _ATTR_BARE_AUTH_RE.match(s):
                bare_authorize = True

            if _ATTR_ALLOW_ANON_RE.match(s):
                allow_anonymous = True

            tm = _ATTR_TIER_RE.search(s)
            if tm is not None:
                commercial_tier = tm.group(1).lower()

            j -= 1

        if route_raw is None:
            return None

        prefix = normalize_route(route_raw, class_name)
        return ControllerSurface(
            relative_path=relative_path,
            class_name=class_name,
            route_raw=route_raw,
            normalized_prefix=prefix,
            class_policy=class_policy,
            bare_authorize=bare_authorize,
            allow_anonymous=allow_anonymous,
            commercial_tier=commercial_tier,
        )

    return None


def discover_controllers(controllers_dir: Path) -> list[ControllerSurface]:
    found: list[ControllerSurface] = []
    for path in sorted(controllers_dir.rglob("*Controller.cs")):
        rel = path.relative_to(controllers_dir).as_posix()
        text = path.read_text(encoding="utf-8")
        parsed = parse_controller_cs(text, rel)
        if parsed is not None:
            found.append(parsed)

    return found


def parse_nav_hrefs(ui_nav_dir: Path) -> set[str]:
    hrefs: set[str] = set()
    for path in ui_nav_dir.glob("*nav-group-builder.ts"):
        text = path.read_text(encoding="utf-8")
        for m in re.finditer(r'href:\s*"([^"]+)"', text):
            hrefs.add(m.group(1))
    return hrefs


def registry_path(root: Path) -> Path:
    return root / "scripts" / "ci" / "data" / "route_tier_policy_nav_registry.json"


def load_registry(root: Path) -> dict:
    path = registry_path(root)
    if not path.is_file():
        raise FileNotFoundError(f"Missing registry: {path}")

    return json.loads(path.read_text(encoding="utf-8"))


def overrides_path(root: Path) -> Path:
    return root / "scripts" / "ci" / "data" / "route_tier_policy_nav_overrides.json"


def matrix_doc_path(root: Path) -> Path:
    return root / "docs" / "library" / "ROUTE_TIER_POLICY_NAV_MATRIX.md"


MATRIX_APPENDIX_HEADING = "## Appendix — per-controller registry (CI)"


def materialize_registry(root: Path) -> None:
    raw = overrides_path(root).read_text(encoding="utf-8")
    ov = json.loads(raw)
    ex_map = ov.get("exemption_by_controller_file") or {}
    nav_map = ov.get("nav_operator_href_by_controller_file") or {}
    if not isinstance(ex_map, dict) or not isinstance(nav_map, dict):
        raise ValueError("overrides must contain exemption_by_controller_file and nav_operator_href_by_controller_file objects")

    controllers_dir = root / "ArchLucid.Api" / "Controllers"
    discovered = discover_controllers(controllers_dir)
    rows: list[dict] = []
    for c in discovered:
        rel = c.relative_path
        rows.append(
            {
                "controller_file": rel,
                "class_name": c.class_name,
                "route_template": c.route_raw,
                "normalized_prefix": c.normalized_prefix,
                "commercial_tier": c.commercial_tier or "none",
                "class_policy": effective_policy(c.class_policy, c.bare_authorize, c.allow_anonymous),
                "exemption": ex_map.get(rel),
                "nav_operator_href": nav_map.get(rel),
            }
        )

    registry_path(root).write_text(
        json.dumps({"version": 1, "entries": rows}, indent=2) + "\n",
        encoding="utf-8",
    )


def render_matrix_appendix(root: Path) -> str:
    data = load_registry(root)
    entries = data.get("entries")
    if not isinstance(entries, list):
        raise ValueError("registry: 'entries' must be a list")

    entry_count = len(entries)
    lines = [
        MATRIX_APPENDIX_HEADING,
        "",
        "Merge-blocking check: `python scripts/ci/assert_route_tier_policy_nav.py` after editing controllers, overrides, or this table.",
        "",
        "- **Registry JSON:** `scripts/ci/data/route_tier_policy_nav_registry.json` (regenerate: `python scripts/ci/assert_route_tier_policy_nav.py --sync`).",
        "- **Allowlist / exemption reasons:** `scripts/ci/data/route_tier_policy_nav_exemptions.json`.",
        "- **Nav / exemption overrides:** `scripts/ci/data/route_tier_policy_nav_overrides.json`.",
        "",
        f"<!-- route-tier-policy-nav-registry-count:{entry_count} -->",
        "",
        "| Controller source | API prefix (normalized) | commercial_tier (class) | class_policy | Operator nav href (parity only) | Exemption code |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for entry in sorted(entries, key=lambda item: item["controller_file"]):
        controller_file = entry["controller_file"]
        normalized_prefix = entry["normalized_prefix"]
        exemption = entry.get("exemption") or ""
        nav_href = entry.get("nav_operator_href") or ""
        commercial_tier = entry["commercial_tier"]
        class_policy = entry["class_policy"]
        lines.append(
            f"| `{controller_file}` | `{normalized_prefix}` | {commercial_tier} | {class_policy} | {nav_href} | {exemption} |"
        )

    return "\n".join(lines) + "\n"


def sync_matrix_doc(root: Path) -> None:
    doc_path = matrix_doc_path(root)
    matrix_text = doc_path.read_text(encoding="utf-8")

    if MATRIX_APPENDIX_HEADING not in matrix_text:
        raise ValueError(f"matrix doc missing appendix heading: {MATRIX_APPENDIX_HEADING!r}")

    head = matrix_text.split(MATRIX_APPENDIX_HEADING)[0].rstrip() + "\n\n"
    doc_path.write_text(head + render_matrix_appendix(root), encoding="utf-8")


def run_sync(root: Path) -> list[str]:
    """Regenerate registry JSON + matrix appendix from controllers, then re-check."""
    materialize_registry(root)
    sync_matrix_doc(root)
    return run_check(root)


def effective_policy(entry_class_policy: str | None, bare: bool, allow_anonymous: bool) -> str:
    if allow_anonymous:
        return "AllowAnonymous"
    if entry_class_policy is not None:
        return entry_class_policy
    if bare:
        return "Authorize"
    return "none"


def run_dump(controllers: list[ControllerSurface]) -> None:
    rows = []
    for c in controllers:
        rows.append(
            {
                "controller_file": c.relative_path,
                "class_name": c.class_name,
                "route_template": c.route_raw,
                "normalized_prefix": c.normalized_prefix,
                "commercial_tier": c.commercial_tier or "none",
                "class_policy": effective_policy(c.class_policy, c.bare_authorize, c.allow_anonymous),
                "exemption": None,
                "nav_operator_href": None,
            }
        )
    print(json.dumps({"version": 1, "entries": rows}, indent=2))


def matrix_row_documents_controller(matrix_text: str, controller_file: str, normalized_prefix: str) -> bool:
    for line in matrix_text.splitlines():
        if controller_file in line and normalized_prefix in line:
            return True

    return False


def run_check(root: Path) -> list[str]:
    errors: list[str] = []
    data = load_registry(root)
    entries = data.get("entries")
    if not isinstance(entries, list):
        return ["registry: 'entries' must be a list"]

    by_file: dict[str, dict] = {}
    for e in entries:
        if not isinstance(e, dict):
            errors.append("registry: entry must be object")
            continue
        cf = e.get("controller_file")
        if not isinstance(cf, str) or not cf:
            errors.append("registry entry missing controller_file")
            continue
        if cf in by_file:
            errors.append(f"duplicate registry controller_file: {cf}")
        by_file[cf] = e

    controllers_dir = root / "ArchLucid.Api" / "Controllers"
    discovered = discover_controllers(controllers_dir)
    by_disc: dict[str, ControllerSurface] = {c.relative_path: c for c in discovered}

    matrix_text = matrix_doc_path(root).read_text(encoding="utf-8")
    exempt_codes_path = root / "scripts" / "ci" / "data" / "route_tier_policy_nav_exemptions.json"
    known_exempt_codes: set[str] = set()
    if exempt_codes_path.is_file():
        ex_json = json.loads(exempt_codes_path.read_text(encoding="utf-8"))
        for item in ex_json.get("codes", []):
            if isinstance(item, dict) and isinstance(item.get("code"), str):
                known_exempt_codes.add(item["code"])

    for rel, actual in by_disc.items():
        expected = by_file.get(rel)
        if expected is None:
            errors.append(
                f"no registry row for controller file {rel} "
                f"(run: python scripts/ci/assert_route_tier_policy_nav.py --sync)"
            )
            continue

        exp_route = expected.get("route_template")
        if exp_route != actual.route_raw:
            errors.append(f"{rel}: route_template expected {exp_route!r} actual {actual.route_raw!r}")

        exp_prefix = expected.get("normalized_prefix")
        if exp_prefix != actual.normalized_prefix:
            errors.append(f"{rel}: normalized_prefix expected {exp_prefix!r} actual {actual.normalized_prefix!r}")

        exp_tier = (expected.get("commercial_tier") or "none").lower()
        act_tier = actual.commercial_tier or "none"
        if exp_tier != act_tier:
            errors.append(
                f"{rel}: commercial_tier expected {exp_tier!r} from registry but controller has {act_tier!r}"
            )

        exp_pol = expected.get("class_policy")
        act_pol = effective_policy(actual.class_policy, actual.bare_authorize, actual.allow_anonymous)
        if exp_pol != act_pol:
            errors.append(f"{rel}: class_policy registry {exp_pol!r} vs controller {act_pol!r}")

        exemption = expected.get("exemption")

        if exemption:
            if not isinstance(exemption, str) or not exemption:
                errors.append(f"{rel}: exemption must be a non-empty string when set")
            elif exemption not in known_exempt_codes:
                errors.append(
                    f"{rel}: exemption {exemption!r} missing from scripts/ci/data/route_tier_policy_nav_exemptions.json"
                )

            continue

        cf = expected.get("controller_file")
        np = expected.get("normalized_prefix")
        if isinstance(cf, str) and isinstance(np, str):
            if not matrix_row_documents_controller(matrix_text, cf, np):
                errors.append(
                    f"{rel}: matrix must document this controller+prefix on one table row — see "
                    f"docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md appendix (controller '{cf}', prefix '{np}')"
                )

        nav_href = expected.get("nav_operator_href")
        if nav_href is not None:
            if not isinstance(nav_href, str):
                errors.append(f"{rel}: nav_operator_href must be string or null")
            else:
                nav_hrefs = parse_nav_hrefs(root / "archlucid-ui" / "src" / "lib")
                if nav_href not in nav_hrefs:
                    errors.append(
                        f"{rel}: nav_operator_href {nav_href!r} not found in *nav-group-builder.ts "
                        f"(UI visibility is not authorization; link must exist for operator shell parity)"
                    )

    for reg_file in by_file.keys():
        if reg_file not in by_disc:
            errors.append(f"registry references missing controller file {reg_file}")

    marker = "<!-- route-tier-policy-nav-registry-count:"
    expected_count = len(entries)
    m = re.search(re.escape(marker) + r"(\d+)" + r"\s*-->", matrix_text)
    if m is None:
        errors.append(f"matrix missing count marker {marker}N-->")
    elif int(m.group(1)) != expected_count:
        errors.append(
            f"matrix registry count marker expects {m.group(1)} but registry has {expected_count} entries; "
            f"update ROUTE_TIER_POLICY_NAV_MATRIX.md"
        )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dump-registry", action="store_true", help="print scaffold JSON to stdout")
    parser.add_argument(
        "--materialize-registry",
        action="store_true",
        help="write scripts/ci/data/route_tier_policy_nav_registry.json from controllers + overrides JSON",
    )
    parser.add_argument(
        "--sync",
        action="store_true",
        help="materialize registry JSON, refresh ROUTE_TIER_POLICY_NAV_MATRIX.md appendix, then verify",
    )
    args = parser.parse_args()
    root = repo_root()
    controllers_dir = root / "ArchLucid.Api" / "Controllers"

    if args.dump_registry:
        run_dump(discover_controllers(controllers_dir))
        return 0

    if args.materialize_registry:
        materialize_registry(root)
        print(f"wrote {registry_path(root)}")
        return 0

    if args.sync:
        errors = run_sync(root)
        if not errors:
            print("assert_route_tier_policy_nav: synced registry + matrix appendix")
            return 0

        print("assert_route_tier_policy_nav sync failures (manual follow-up required):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        print(
            "  Hint: add nav/exemption overrides in scripts/ci/data/route_tier_policy_nav_overrides.json "
            "or exemption codes in route_tier_policy_nav_exemptions.json, then re-run --sync.",
            file=sys.stderr,
        )
        return 1

    errors = run_check(root)
    if errors:
        print("assert_route_tier_policy_nav failures:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print("assert_route_tier_policy_nav: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
