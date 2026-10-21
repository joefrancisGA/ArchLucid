#!/usr/bin/env python3
"""Split AL_BUG_HUNT_LEDGER.md into four set ledgers and seed per-set run logs.

The catalog JSON is the membership source. Re-run only when the index ledger
still contains ## Zone sections that need to move.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
LEDGER = REPO / "docs/library/AL_BUG_HUNT_LEDGER.md"
RUN_LOG = REPO / "docs/library/AL_BUG_HUNT_RUN_LOG.jsonl"
CATALOG_PATH = REPO / "scripts/agent/al-bug-zone-sets.json"
ZONE_HEADER = re.compile(r"(?m)^## Zone: (.+)$")
PATHS_LINE = re.compile(r"(?m)^- \*\*paths:\*\* (.+)$")
SHARED_LEDGER = "docs/library/AL_BUG_HUNT_LEDGER.md"

SET1 = [
    "topology-proposal-merge",
    "arm-terraform-source-ids",
    "commit-output-integrity",
    "content-safety-admission",
    "storage-vs-data-category",
    "authority-pipeline-payload",
    "technology-ledger-merge",
    "orchestrator-transient-retry",
    "alert-simulation",
    "architecture-recommendation",
    "extraction-router",
    "architecture-intelligence-orchestrator",
    "run-execute-ownership",
    "quick-scan-distributed-concurrency",
    "decisioning",
    "application-analysis",
    "application-pilots",
    "application-agents",
    "agent-runtime-safety",
    "agent-runtime-evaluation",
    "capabilities-cost-mcp",
]

SET2 = [
    "tenant-settings-sql",
    "email-otp-auth",
    "auth-return-path",
    "tenant-erasure",
    "tenant-scoped-analyzer",
    "sql-run-repository",
    "finding-inspect-sql",
    "llm-wallet",
    "finding-disposition",
    "scim-users",
    "identity-provider-config",
    "billing-webhooks",
    "persistence-billing-stripe",
    "api-key-auth",
    "scope-binding-middleware",
    "saml-jwt-bearer",
    "tenant-data-export",
    "itsm-inbound-webhooks",
    "api-authority-admin-controllers",
    "api-governance-tenancy-controllers",
    "api-policy-packs",
    "api-governance-stickiness",
    "api-tenancy-workspaces",
    "api-request-null-collection-elements",
    "application-billing-logic",
    "application-governance-policy",
    "review-recurrence",
    "application-tenancy-lifecycle",
    "persistence-identity",
]

SET3_EXTRA = [
    "archlucid-contracts",
    "infra-evidence-diagrams",
    "securenow-question-queue",
]

SET_META = [
    (1, "Orchestration and topology", SET1),
    (2, "API, identity, tenancy, and governance", SET2),
    (3, "UI and CLI", []),
    (4, "Core, host, persistence, and extraction", []),
]


def parse_zones(text: str) -> tuple[str, list[tuple[str, str]]]:
    matches = list(ZONE_HEADER.finditer(text))
    if not matches:
        raise SystemExit("No zone sections found. The ledger is already split.")
    preface = text[: matches[0].start()]
    zones: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        zone_id = match.group(1).strip()
        zones.append((zone_id, text[match.start() : end]))
    return preface, zones


def assign(zone_ids: list[str]) -> dict[str, int]:
    explicit = {zone_id: 1 for zone_id in SET1}
    explicit.update({zone_id: 2 for zone_id in SET2})
    assigned: dict[str, int] = {}
    unknown: list[str] = []
    for zone_id in zone_ids:
        if zone_id in explicit:
            assigned[zone_id] = explicit[zone_id]
        elif zone_id.startswith("ui-") or zone_id.startswith("cli-") or zone_id in SET3_EXTRA:
            assigned[zone_id] = 3
        else:
            assigned[zone_id] = 4
            unknown.append(zone_id)
    missing = sorted((set(explicit) | set(SET3_EXTRA)) - set(zone_ids))
    if missing:
        raise SystemExit(f"Catalog names missing from the ledger: {missing}")
    print("Set 4 (remainder):")
    for zone_id in unknown:
        print(f"  {zone_id}")
    return assigned


def zone_paths(block: str) -> list[str]:
    match = PATHS_LINE.search(block)
    if not match:
        return []
    return [part.strip().replace("\\", "/") for part in match.group(1).split(";") if part.strip()]


def paths_conflict(left: str, right: str) -> bool:
    if left == SHARED_LEDGER or right == SHARED_LEDGER:
        return False
    a, b = sorted((left.rstrip("/"), right.rstrip("/")), key=len)
    return a == b or b.startswith(a + "/")


def assert_disjoint(blocks: dict[str, str], assignment: dict[str, int]) -> None:
    owned: list[tuple[int, str, str]] = []
    for zone_id, block in blocks.items():
        for path in zone_paths(block):
            owned.append((assignment[zone_id], zone_id, path))
    conflicts: list[str] = []
    for index, (set_a, zone_a, path_a) in enumerate(owned):
        for set_b, zone_b, path_b in owned[index + 1 :]:
            if set_a == set_b or zone_a == zone_b:
                continue
            if paths_conflict(path_a, path_b):
                conflicts.append(
                    f"set {set_a} {zone_a} {path_a} vs set {set_b} {zone_b} {path_b}"
                )
    if conflicts:
        raise SystemExit("Cross-set path overlap:\n" + "\n".join(conflicts))


def retarget_ledger_path(block: str, ledger_rel: str) -> str:
    def replacer(match: re.Match[str]) -> str:
        parts = [part.strip() for part in match.group(1).split(";")]
        rewritten = [ledger_rel if part.replace("\\", "/") == SHARED_LEDGER else part for part in parts]
        return "- **paths:** " + "; ".join(rewritten)

    return PATHS_LINE.sub(replacer, block, count=1)


def build_catalog(assignment: dict[str, int], order: list[str]) -> dict:
    sets = []
    for set_id, title, _explicit in SET_META:
        zones = [zone_id for zone_id in order if assignment[zone_id] == set_id]
        sets.append(
            {
                "id": set_id,
                "title": title,
                "command": f"/al-bug{set_id}",
                "branch": f"bugsmash-{set_id}",
                "ledger": f"docs/library/AL_BUG_HUNT_LEDGER_{set_id}.md",
                "runLog": f"docs/library/AL_BUG_HUNT_RUN_LOG_{set_id}.jsonl",
                "zones": zones,
            }
        )
    return {"sets": sets}


def write_ledgers(preface: str, blocks: dict[str, str], assignment: dict[str, int], catalog: dict) -> None:
    grouped: dict[int, list[str]] = {1: [], 2: [], 3: [], 4: []}
    for set_spec in catalog["sets"]:
        set_id = int(set_spec["id"])
        ledger_rel = set_spec["ledger"]
        for zone_id in set_spec["zones"]:
            grouped[set_id].append(retarget_ledger_path(blocks[zone_id], ledger_rel).rstrip() + "\n")
        header = (
            f"> **Scope:** Hunt ledger for `{set_spec['command']}` ({set_spec['title']}). "
            f"Edit this file only from that command. Sync and push `{set_spec['branch']}`. "
            "Do not edit the other set ledgers in the same hunt.\n\n"
        )
        body = header + "\n".join(grouped[set_id])
        if not body.endswith("\n"):
            body += "\n"
        (REPO / ledger_rel).write_text(body, encoding="utf-8")
        print(f"wrote {ledger_rel} zones={len(set_spec['zones'])} bytes={len(body)}")

    catalog_lines = [
        "## Parallel hunt sets",
        "",
        "Zone bodies live in the set ledgers below. `/al-bug1` through `/al-bug4` each hunt one set, record one run log, and push one branch. The diary under this catalog is history from the shared ledger.",
        "",
        "| Set | Command | Branch | Ledger | Run log |",
        "| --- | --- | --- | --- | --- |",
    ]
    for set_spec in catalog["sets"]:
        catalog_lines.append(
            f"| {set_spec['id']} | `{set_spec['command']}` | `{set_spec['branch']}` | `{set_spec['ledger']}` | `{set_spec['runLog']}` |"
        )
    catalog_lines.append("")
    for set_spec in catalog["sets"]:
        catalog_lines.append(f"### Set {set_spec['id']} — {set_spec['title']}")
        catalog_lines.append("")
        for zone_id in set_spec["zones"]:
            catalog_lines.append(f"- `{zone_id}`")
        catalog_lines.append("")
    catalog_lines.append("## Hunt diary")
    catalog_lines.append("")
    diary = preface
    scope, _, rest = diary.partition("\n")
    index = scope + "\n\n" + "\n".join(catalog_lines) + "\n" + rest.lstrip("\n")
    if not index.endswith("\n"):
        index += "\n"
    LEDGER.write_text(index, encoding="utf-8")
    print(f"wrote index bytes={len(index)}")


def write_run_logs(assignment: dict[str, int], catalog: dict) -> None:
    by_set = {int(item["id"]): [] for item in catalog["sets"]}
    if RUN_LOG.is_file():
        for line in RUN_LOG.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            zone_id = payload.get("zoneId")
            owner = assignment.get(zone_id)
            if owner is None:
                continue
            by_set[owner].append(line)
    for set_spec in catalog["sets"]:
        path = REPO / set_spec["runLog"]
        lines = by_set[int(set_spec["id"])]
        text = ("\n".join(lines) + "\n") if lines else ""
        path.write_text(text, encoding="utf-8")
        print(f"wrote {set_spec['runLog']} lines={len(lines)}")


def main() -> None:
    text = LEDGER.read_text(encoding="utf-8")
    preface, zones = parse_zones(text)
    blocks = {zone_id: block for zone_id, block in zones}
    if len(blocks) != len(zones):
        raise SystemExit("Duplicate zone ids in the ledger.")
    assignment = assign(list(blocks))
    assert_disjoint(blocks, assignment)
    catalog = build_catalog(assignment, [zone_id for zone_id, _block in zones])
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")
    write_ledgers(preface, blocks, assignment, catalog)
    write_run_logs(assignment, catalog)
    counts = {item["id"]: len(item["zones"]) for item in catalog["sets"]}
    print("counts", counts, "total", sum(counts.values()))


if __name__ == "__main__":
    main()
