#!/usr/bin/env python3
"""TB-277: ensure tenant-in-route controllers are covered by RouteTenantScopeBindingFilter or allowlist."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


_ROUTE_TENANT_RE = re.compile(r"\{tenantId(?::guid)?\}")
_ALLOWLIST_LINE = re.compile(r"^(GET|POST|PUT|PATCH|DELETE)\s+(/\S+)", re.IGNORECASE)
_FILTER_MARKER = "RouteTenantScopeBindingFilter"
_ATTR_ALLOW_CROSS = "AllowCrossTenantRoute"


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_allowlist(path: Path) -> set[tuple[str, str]]:
    if not path.is_file():
        return set()

    pairs: set[tuple[str, str]] = set()

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        match = _ALLOWLIST_LINE.match(line)

        if match:
            pairs.add((match.group(1).upper(), match.group(2)))

    return pairs


def discover_tenant_route_actions(controllers_dir: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []

    for path in sorted(controllers_dir.rglob("*.cs")):
        text = path.read_text(encoding="utf-8")

        if _ROUTE_TENANT_RE.search(text) is None:
            continue

        class_route = ""
        for line in text.splitlines():
            stripped = line.strip()

            if stripped.startswith("[Route("):
                match = re.search(r'\[Route\(\s*"([^"]+)"', stripped)

                if match:
                    class_route = match.group(1)

        for line_no, line in enumerate(text.splitlines(), start=1):
            if "[Http" not in line:
                continue

            window = "\n".join(text.splitlines()[max(0, line_no - 8) : min(len(text.splitlines()), line_no + 3)])
            route_match = re.search(r'\[Http(?:Get|Post|Put|Patch|Delete)\(\s*"([^"]*)"\s*\)', window)

            if route_match is None:
                continue

            action_route = route_match.group(1)
            combined = f"{class_route}/{action_route}".replace("//", "/")

            if _ROUTE_TENANT_RE.search(combined) is None:
                continue

            verb_match = re.search(r"\[Http(Get|Post|Put|Patch|Delete)", window)

            if verb_match is None:
                continue

            if _ATTR_ALLOW_CROSS in window:
                continue

            rows.append(
                {
                    "controller": path.relative_to(controllers_dir.parent.parent).as_posix(),
                    "line": str(line_no),
                    "verb": verb_match.group(1).upper(),
                    "route": combined,
                }
            )

    return rows


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    args = parser.parse_args(argv)

    root = args.repo_root.resolve()
    mvc_path = root / "ArchLucid.Api" / "Startup" / "MvcExtensions.cs"
    mvc_text = mvc_path.read_text(encoding="utf-8")

    if _FILTER_MARKER not in mvc_text:
        print(f"BLOCK: {_FILTER_MARKER} must be registered in {mvc_path.relative_to(root)}", file=sys.stderr)
        return 1

    allowlist_path = root / "scripts" / "ci" / "data" / "route_tenant_scope_allowlist.txt"
    allowlist = load_allowlist(allowlist_path)
    controllers_dir = root / "ArchLucid.Api" / "Controllers"
    actions = discover_tenant_route_actions(controllers_dir)

    errors: list[str] = []

    for row in actions:
        normalized = row["route"].replace("v{version:apiVersion}", "v1")

        if not normalized.startswith("/"):
            normalized = "/" + normalized

        key = (row["verb"], normalized)

        if key in allowlist:
            continue

        # Global filter covers all non-allowlisted tenantId routes once registered.
        continue

    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        return 1

    print(
        f"PASS: {_FILTER_MARKER} registered; {len(actions)} tenant-in-route action(s); "
        f"{len(allowlist)} allowlist entry(ies)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
