#!/usr/bin/env python3
"""The four /al-bug zone sets partition the catalog and keep shared paths together."""

from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
AGENT = REPO / "scripts" / "agent"
_SPEC = importlib.util.spec_from_file_location(
    "split_al_bug_zone_sets",
    AGENT / "split-al-bug-zone-sets.py",
)
assert _SPEC is not None and _SPEC.loader is not None
_SPLIT = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(_SPLIT)
SHARED_LEDGER = _SPLIT.SHARED_LEDGER
paths_conflict = _SPLIT.paths_conflict
zone_paths = _SPLIT.zone_paths

ZONE_HEADER = re.compile(r"(?m)^## Zone: (.+)$")
CATALOG_PATH = AGENT / "al-bug-zone-sets.json"
INDEX = REPO / "docs/library/AL_BUG_HUNT_LEDGER.md"


def _zones_in(path: Path) -> list[str]:
    return [match.group(1).strip() for match in ZONE_HEADER.finditer(path.read_text(encoding="utf-8"))]


def test_sets_partition_every_zone_once() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    sets = catalog["sets"]
    assert [item["id"] for item in sets] == [1, 2, 3, 4]
    seen: list[str] = []
    for item in sets:
        ledger = REPO / item["ledger"]
        run_log = REPO / item["runLog"]
        assert ledger.is_file()
        assert run_log.is_file()
        assert item["branch"] == f"bugsmash-{item['id']}"
        assert item["command"] == f"/al-bug{item['id']}"
        file_zones = _zones_in(ledger)
        assert file_zones == item["zones"]
        seen.extend(file_zones)
    assert len(seen) == len(set(seen))
    assert seen
    assert _zones_in(INDEX) == []


def test_shared_production_paths_stay_in_one_set() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    owned: list[tuple[int, str, str]] = []
    for item in catalog["sets"]:
        text = (REPO / item["ledger"]).read_text(encoding="utf-8")
        for zone_id in item["zones"]:
            match = re.search(rf"(?ms)^## Zone: {re.escape(zone_id)}\n(.*?)(?=^## Zone: |\Z)", text)
            assert match is not None
            for path in zone_paths("## Zone: " + zone_id + "\n" + match.group(1)):
                owned.append((int(item["id"]), zone_id, path))
    for index, (set_a, zone_a, path_a) in enumerate(owned):
        for set_b, zone_b, path_b in owned[index + 1 :]:
            if set_a == set_b or zone_a == zone_b:
                continue
            assert not paths_conflict(path_a, path_b), (
                f"{zone_a} {path_a} overlaps {zone_b} {path_b}"
            )
    assert SHARED_LEDGER


def test_topology_pair_shares_set_1() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    set1 = set(catalog["sets"][0]["zones"])
    assert "topology-proposal-merge" in set1
    assert "arm-terraform-source-ids" in set1


def test_set_run_logs_only_contain_member_zones() -> None:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    for item in catalog["sets"]:
        allowed = set(item["zones"])
        log_path = REPO / item["runLog"]
        for line in log_path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            payload = json.loads(line)
            assert payload["zoneId"] in allowed
