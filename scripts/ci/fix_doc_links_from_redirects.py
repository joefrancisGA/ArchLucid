#!/usr/bin/env python3
"""Rewrite broken markdown links using docs/redirects.md former-path mappings."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote

from check_doc_links import LINK_RE, repo_root, resolve_target

# Repo-relative former path -> repo-relative canonical path.
_REDIRECTS: dict[str, str] = {
    "docs/TROUBLESHOOTING.md": "docs/runbooks/TROUBLESHOOTING.md",
    "docs/library/BUILD.md": "docs/engineering/BUILD.md",
    "docs/library/CONTAINERIZATION.md": "docs/engineering/CONTAINERIZATION.md",
    "docs/library/DEPLOYMENT.md": "docs/engineering/DEPLOYMENT.md",
    "docs/library/OPERATOR_QUICKSTART.md": "docs/library/customer-facing/OPERATOR_QUICKSTART.md",
    "docs/library/PILOT_GUIDE.md": "docs/library/customer-facing/PILOT_GUIDE.md",
    "docs/library/CORE_PILOT.md": "docs/CORE_PILOT.md",
    "docs/DEPLOYMENT.md": "docs/engineering/DEPLOYMENT.md",
    "docs/templates/archlucid-api-endpoint/README.md": "templates/archlucid-api-endpoint/README.md",
    "docs/runbooks/CANARY_DEPLOYMENT.md": "docs/runbooks/PRODUCTION_DEPLOYMENT.md",
    "docs/architecture/customer_facing_cloud_neutrality_P0_IMPLEMENTATION_PROMPTS_2026_07_12.md": (
        "docs/architecture/customer_facing_cloud_neutrality_assessment.md"
    ),
    "docs/runbooks/go-to-market/STRIPE_CHECKOUT.md": "docs/go-to-market/STRIPE_CHECKOUT.md",
    "docs/API_FUZZ_TESTING.md": "docs/library/API_FUZZ_TESTING.md",
    "security/ZAP_BASELINE_RULES.md": "docs/security/ZAP_BASELINE_RULES.md",
    "security/SYSTEM_THREAT_MODEL.md": "docs/security/SYSTEM_THREAT_MODEL.md",
    "security/RLS_RISK_ACCEPTANCE.md": "docs/security/RLS_RISK_ACCEPTANCE.md",
    "runbooks/API_KEY_ROTATION.md": "docs/runbooks/API_KEY_ROTATION.md",
}

# When redirecting CANARY_DEPLOYMENT, preserve this anchor on PRODUCTION_DEPLOYMENT.
_ANCHOR_OVERRIDES: dict[str, str] = {
    "docs/runbooks/CANARY_DEPLOYMENT.md": "#part-c--canary-promotion-container-apps",
}


def _repo_relative(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def _relative_link(from_file: Path, canonical: Path) -> str:
    return os.path.relpath(canonical, from_file.parent).replace("\\", "/")


def _canonical_for_missing(resolved: Path, root: Path) -> Path | None:
    rel = _repo_relative(resolved, root)

    if rel not in _REDIRECTS:
        return None

    canonical = root / _REDIRECTS[rel]
    anchor = _ANCHOR_OVERRIDES.get(rel, "")

    if not canonical.is_file():
        print(f"warning: canonical target missing: {canonical}", file=sys.stderr)
        return None

    return canonical


def _apply_bare_library_replacements(text: str, md_rel: Path) -> tuple[str, int]:
    """Fix same-directory bare filenames under docs/library/ after doc moves."""
    changes = 0
    rel = md_rel.as_posix()

    if rel == "docs/CONTRIBUTOR_ON_ONE_PAGE.md":
        new_text, count = re.subn(r"\]\(TROUBLESHOOTING\.md", "](runbooks/TROUBLESHOOTING.md", text)
        return new_text, count

    if rel.startswith("docs/library/customer-facing/"):
        replacements = (
            (r"\]\(customer-facing/PILOT_GUIDE\.md", "](PILOT_GUIDE.md"),
            (r"\]\(customer-facing/OPERATOR_QUICKSTART\.md", "](OPERATOR_QUICKSTART.md"),
        )

        for pattern, replacement in replacements:
            text, count = re.subn(pattern, replacement, text)
            changes += count

        return text, changes

    if rel.startswith("docs/library/"):
        replacements = (
            (r"\]\(BUILD\.md\)", "](../engineering/BUILD.md)"),
            (r"\]\(CONTAINERIZATION\.md\)", "](../engineering/CONTAINERIZATION.md)"),
            (r"\]\(DEPLOYMENT\.md\)", "](../engineering/DEPLOYMENT.md)"),
            (r"\]\(OPERATOR_QUICKSTART\.md", "](customer-facing/OPERATOR_QUICKSTART.md"),
            (r"\]\(PILOT_GUIDE\.md", "](customer-facing/PILOT_GUIDE.md"),
            (r"\]\(CORE_PILOT\.md\)", "](../CORE_PILOT.md)"),
        )

        for pattern, replacement in replacements:
            text, count = re.subn(pattern, replacement, text)
            changes += count

    if rel == "docs/library/contributor-reference/SECURITY.md":
        text, count = re.subn(r"\]\(\.\./\.\./DEPLOYMENT\.md\)", "](../../engineering/DEPLOYMENT.md)", text)
        changes += count

    return text, changes


def _fix_file(md_file: Path, root: Path) -> int:
    text = md_file.read_text(encoding="utf-8", errors="replace")
    changes = 0

    def replace_link(match: re.Match[str]) -> str:
        nonlocal changes
        raw = match.group(1).strip()
        decoded = unquote(raw)
        pos = decoded.find("#")
        path_part = decoded[:pos] if pos >= 0 else decoded
        anchor = decoded[pos:] if pos >= 0 else ""

        resolved = resolve_target(md_file, raw)

        if resolved is None or resolved.is_file():
            return match.group(0)

        canonical = _canonical_for_missing(resolved, root)

        if canonical is None:
            return match.group(0)

        if rel_key := _repo_relative(resolved, root):
            if rel_key in _ANCHOR_OVERRIDES and not anchor:
                anchor = _ANCHOR_OVERRIDES[rel_key]

        new_target = _relative_link(md_file, canonical) + anchor
        changes += 1
        return match.group(0).replace(raw, new_target, 1)

    new_text = LINK_RE.sub(replace_link, text)
    bare_changes = 0
    new_text, bare_changes = _apply_bare_library_replacements(new_text, md_file.relative_to(root))
    changes += bare_changes

    if changes > 0:
        md_file.write_text(new_text, encoding="utf-8", newline="\n")

    return changes


def main() -> int:
    root = repo_root()
    total = 0
    scan_roots = [root / "docs", root / "archlucid-ui" / "docs", root / "README.md"]

    for scan_root in scan_roots:
        if scan_root.is_file():
            total += _fix_file(scan_root, root)
            continue

        if not scan_root.is_dir():
            continue

        for md_file in scan_root.rglob("*.md"):
            total += _fix_file(md_file, root)

    print(f"fix_doc_links_from_redirects: updated {total} link(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
