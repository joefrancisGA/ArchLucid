#!/usr/bin/env python3
"""Offline pin check for the vendored azurerm v5.6.0 resource catalog (ABQ-51).

Set ARCHLUCID_AZURERM_CATALOG_REMOTE=1 to also diff the vendored slugs against
hashicorp/terraform-provider-azurerm commit daf16e27e2d45d2fb6b7d83644dc201363b05e62.
The unit tests do not call the network.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PIN = "daf16e27e2d45d2fb6b7d83644dc201363b05e62"
EXPECTED_COUNT = 1105
SENTINELS = (
    "aadb2c_directory",
    "storage_account",
    "firewall",
    "lb",
    "linux_virtual_machine",
    "ai_foundry",
    "windows_web_app",
    "workloads_sap_three_tier_virtual_instance",
)
CATALOG_RELATIVE = Path(
    "ArchLucid.Application/Runs/Orchestration/azurerm-resource-types-v5.6.0.txt"
)
HEURISTICS_RELATIVE = Path(
    "ArchLucid.Application/Runs/Orchestration/TopologyProposalTerraformSourceIdHeuristics.cs"
)
RETIRED_RELATIVE = Path(
    "ArchLucid.Application/Runs/Orchestration/TerraformAzurermRetiredResourceAliases.cs"
)
GATE_GLOB = "ArchLucid.Application.Tests/Runs/Orchestration/AgentTopologyProposalMergeGate*.cs"
SOURCE_ID = re.compile(r'"azurerm_([A-Za-z0-9_]+)')
RETIRED_SLUG = re.compile(r'^\s*"([a-z0-9_]+)",?\s*$', re.MULTILINE)
CONTAINS_CHAIN = "normalized.Contains("


def parse_catalog_text(text: str) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    lines = text.splitlines()

    if not lines:
        return [], ["catalog is empty"]

    header = lines[0]

    if PIN not in header or f"count {EXPECTED_COUNT}" not in header:
        errors.append(
            f"header must name commit {PIN} and count {EXPECTED_COUNT}: {header!r}"
        )

    slugs = [line.strip() for line in lines[1:] if line.strip() and not line.startswith("#")]

    if len(slugs) != EXPECTED_COUNT:
        errors.append(f"expected {EXPECTED_COUNT} slugs, found {len(slugs)}")

    if len(slugs) != len(set(slugs)):
        errors.append("catalog slugs are not unique")

    if slugs != sorted(slugs):
        errors.append("catalog slugs are not ordinal-sorted")

    missing = [slug for slug in SENTINELS if slug not in slugs]

    if missing:
        errors.append("missing sentinels: " + ", ".join(missing))

    return slugs, errors


def check_heuristics_text(text: str) -> list[str]:
    if CONTAINS_CHAIN in text:
        return [f"heuristics still contain {CONTAINS_CHAIN!r}"]

    return []


def retired_slugs_from_text(text: str) -> set[str]:
    return set(RETIRED_SLUG.findall(text))


def check_gate_text(file_name: str, text: str, catalog: set[str], retired: set[str]) -> list[str]:
    slugs = {match.lower() for match in SOURCE_ID.findall(text)}
    errors: list[str] = []

    for slug in sorted(slugs):
        if slug in catalog or slug in retired:
            continue

        paired_virtual_machine = (
            slug == "linux_virtual_machine"
            and any(other in catalog and other != "linux_virtual_machine" for other in slugs)
        )

        if paired_virtual_machine:
            continue

        errors.append(f"{file_name} references azurerm_{slug}, which is not in the catalog or retired aliases")

    return errors


def fetch_remote_slugs() -> list[str]:
    headers = {"User-Agent": "archlucid-abq-51", "Accept": "application/vnd.github+json"}

    def get(url: str) -> dict:
        request = urllib.request.Request(url, headers=headers)

        with urllib.request.urlopen(request, timeout=90) as response:
            payload = json.load(response)

        return payload

    commit = get(f"https://api.github.com/repos/hashicorp/terraform-provider-azurerm/git/commits/{PIN}")
    tree_sha = commit["tree"]["sha"]

    def child(sha: str, name: str) -> str:
        tree = get(f"https://api.github.com/repos/hashicorp/terraform-provider-azurerm/git/trees/{sha}")

        if tree.get("truncated"):
            raise RuntimeError(f"git tree truncated before {name}")

        for entry in tree["tree"]:
            if entry["path"] == name:
                return entry["sha"]

        raise RuntimeError(f"missing {name} in tree {sha}")

    resources = child(child(child(tree_sha, "website"), "docs"), "r")
    tree = get(f"https://api.github.com/repos/hashicorp/terraform-provider-azurerm/git/trees/{resources}")

    if tree.get("truncated"):
        raise RuntimeError("website/docs/r tree is truncated")

    slugs: list[str] = []

    for entry in tree["tree"]:
        name = entry["path"]

        if name.endswith(".html.markdown"):
            slugs.append(name[: -len(".html.markdown")])

    return sorted(set(slugs))


def scan(repo_root: Path, *, remote: bool) -> list[str]:
    catalog_path = repo_root / CATALOG_RELATIVE
    heuristics_path = repo_root / HEURISTICS_RELATIVE
    retired_path = repo_root / RETIRED_RELATIVE
    errors: list[str] = []

    if not catalog_path.is_file():
        return [f"missing catalog file {CATALOG_RELATIVE}"]

    slugs, catalog_errors = parse_catalog_text(catalog_path.read_text(encoding="utf-8"))
    errors.extend(catalog_errors)
    catalog = set(slugs)
    errors.extend(check_heuristics_text(heuristics_path.read_text(encoding="utf-8")))
    retired = retired_slugs_from_text(retired_path.read_text(encoding="utf-8"))
    gate_root = repo_root / "ArchLucid.Application.Tests/Runs/Orchestration"

    for path in sorted(gate_root.glob("AgentTopologyProposalMergeGate*.cs")):
        errors.extend(check_gate_text(path.name, path.read_text(encoding="utf-8"), catalog, retired))

    if remote:
        remote_slugs = fetch_remote_slugs()

        if remote_slugs != slugs:
            errors.append(
                f"vendored catalog differs from commit {PIN}: "
                f"local {len(slugs)} remote {len(remote_slugs)}"
            )

    return errors


def main() -> int:
    remote = os.environ.get("ARCHLUCID_AZURERM_CATALOG_REMOTE") == "1"
    errors = scan(REPO_ROOT, remote=remote)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print(f"azurerm catalog pin ok ({EXPECTED_COUNT} slugs, remote={remote})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
