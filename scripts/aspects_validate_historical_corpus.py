#!/usr/bin/env python3
"""Verify the complete immutable Aspects workbook corpus staged in Git.

The historical workbook's "new unique lines" are reported legacy counts.
They do not establish a source-verified cross-commit Git line union. The
historical 900-first-parent snapshots and provisional observation charts
remain separate, never numerically spliced into the new verified subset.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re

WORKBOOK_SHA256 = "9fab94e0cd7d642f84d37ae9b8988e72b34367a479ebdba65fb893349ade0787"
EVENTS_SHA256 = "e8b2b60694dbe401b391de60cf09c3312c27d8dc9d17d47f10ea330e9dd74509"
SOURCE_DIGESTS = {
    "aspects-historical-900-snapshots.jsonl": "943af85f78269c9d8744d6cf03e0f4db9b65069930e3c94615e53dd3e7a830d3",
    "aspects-provisional-600-series.jsonl": "2964f4719e0a50a5a1ee27673d438ea6357a4bd612ae00e9527fb22a2bf3985b",
    "aspects-provisional-700-series.jsonl": "620a45222a36ea71a1af1dcd2f454c0a0a77ba92515474421b2c0faeb9bdddca",
    "aspects-historical-import-manifest.json": "9403fe17d11b2190747186eac9e724e6529923c43e69b96227e8f6d00d45cf3b",
}
CHUNK = re.compile(r"^([0-9]{4})-([0-9]{4})\.jsonl$")
PIN = re.compile(r"^[0-9a-f]{40}$")
EXPECTED_ROWS = 5741
EXPECTED_ZERO_DEFECT = 4864
EXPECTED_DEFECT_OBSERVATIONS = 877
EXPECTED_REVIEWED_OCCURRENCES = 443456
EXPECTED_INCREMENTAL_KNOWN = 402314
EXPECTED_REPEATED_KNOWN = 40019
EXPECTED_MISSING_INCREMENTAL = 30
EXPECTED_PARSABLE_PINS = 4511


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _require(flag: bool, error: str) -> None:
    if not flag:
        raise ValueError(error)


def _load_records(file: Path) -> list[dict]:
    return [json.loads(line) for line in file.read_text(encoding="utf-8").splitlines() if line]


def verify(root: Path) -> dict:
    source = root / "review-events"
    files = sorted(source.glob("*.jsonl"))
    _require(len(files) == 24, f"Expected 24 historical data chunks, found {len(files)}")
    _require(len(list(source.iterdir())) == 24, "Unexpected file in historical review shard directory")

    combined = hashlib.sha256()
    next_ordinal = 0
    zero_defect = total_defects = reviewed = fresh = repeated = unknown = pinned = 0
    ids: set[int] = set()

    for path in files:
        match = CHUNK.fullmatch(path.name)
        _require(match is not None, f"Unexpected shard name {path.name}")
        first, last = map(int, match.groups())
        _require(first == next_ordinal, f"Gap/replay in historical shard ordering at {path.name}")
        _require(last == min(first + 239, EXPECTED_ROWS - 1), f"Incorrect shard length: {path.name}")
        payload = path.read_bytes()
        _require(payload.endswith(b"\n") and b"\r" not in payload, f"Invalid JSONL line ending: {path.name}")
        combined.update(payload)
        events = _load_records(path)
        _require(len(events) == last - first + 1, f"Missing historical reviews in {path.name}")
        for i, item in enumerate(events):
            row = first + i + 7
            _require(item.get("excel_row") == row and row not in ids, f"Missing/replayed Excel row {row}")
            ids.add(row)
            _require(item.get("source_sha256") == WORKBOOK_SHA256, f"Source workbook drift at {row}")
            _require(item.get("sheet") == "Review evidence", f"Worksheet drift at {row}")
            _require(item.get("provenance") == "historical_workbook_reported_unverified",
                     f"Unverified history incorrectly promoted at {row}")
            d = item.get("defects_recorded")
            n = item.get("reviewed_loc_reported")
            new = item.get("new_unique_loc_reported")
            old = item.get("repeated_loc_reported")
            _require(type(d) is int and d >= 0, f"Invalid defect observation at {row}")
            _require(type(n) is int and n >= 0, f"Invalid reviewed LOC at {row}")
            total_defects += d
            zero_defect += d == 0
            reviewed += n
            if new is None:
                _require(old is None, f"Missing LOC incorrectly counted as zero at {row}")
                unknown += 1
            else:
                _require(type(new) is int and 0 <= new <= n, f"Invalid new LOC at {row}")
                _require(type(old) is int and old == n - new, f"Invalid repeated LOC at {row}")
                fresh += new
                repeated += old
            pin = item.get("parsed_pin")
            if pin is not None:
                _require(isinstance(pin, dict) and PIN.fullmatch(pin.get("blob", "")) is not None,
                         f"Bad source blob pin at {row}")
                _require(isinstance(pin.get("path"), str) and pin["path"] != "", f"Bad path at {row}")
                spans = pin.get("spans")
                _require(isinstance(spans, list) and spans, f"Missing spans at {row}")
                _require(all(isinstance(p, list) and len(p) == 2 and
                             all(type(v) is int for v in p) and 0 < p[0] <= p[1] for p in spans),
                         f"Invalid span at {row}")
                pinned += 1
        next_ordinal = last + 1

    _require(next_ordinal == EXPECTED_ROWS and len(ids) == EXPECTED_ROWS, "Historical row count mismatch")
    _require(combined.hexdigest() == EVENTS_SHA256, "Canonical historical corpus SHA256 mismatch")
    for filename, digest in SOURCE_DIGESTS.items():
        path = root / filename
        _require(path.is_file() and _sha256(path.read_bytes()) == digest,
                 f"Missing or modified historical source artifact: {filename}")
    manifest = json.loads((root / "aspects-historical-import-manifest.json").read_text(encoding="utf-8"))
    _require(manifest["source"]["sha256"] == WORKBOOK_SHA256, "Manifest source hash mismatch")
    _require(manifest["events"] == EXPECTED_ROWS, "Manifest population mismatch")
    expected = (EXPECTED_ZERO_DEFECT, EXPECTED_DEFECT_OBSERVATIONS,
                EXPECTED_REVIEWED_OCCURRENCES, EXPECTED_INCREMENTAL_KNOWN,
                EXPECTED_REPEATED_KNOWN, EXPECTED_MISSING_INCREMENTAL,
                EXPECTED_PARSABLE_PINS)
    actual = (zero_defect, total_defects, reviewed, fresh, repeated, unknown, pinned)
    _require(actual == expected, f"Historical review totals drift: {actual} != {expected}")

    snapshots = _load_records(root / "aspects-historical-900-snapshots.jsonl")
    _require(len(snapshots) == 79, "Missing historical snapshots")
    last = snapshots[-1]
    previous = snapshots[-2]
    _require(last["window_first_parent_commits"] == 900 and last["defects_reported"] == 463
             and last["unique_loc_reported"] == 343492, "Historical 900-commit checkpoint changed")
    _require(last["head_sha"] == "15ac3b9abeff23e4fa8cb7a16027bf9b17211251",
             "Historical 900-commit HEAD changed")
    current_rate = 1000 * last["defects_reported"] / last["unique_loc_reported"]
    previous_rate = 1000 * previous["defects_reported"] / previous["unique_loc_reported"]
    _require(abs(current_rate - last["density_per_kloc_reported"]) < 1e-10,
             "Historical 900-commit density mismatch")
    _require(abs(previous_rate - previous["density_per_kloc_reported"]) < 1e-10,
             "Prior historical density mismatch")

    trends = {}
    for count in (600, 700):
        series = _load_records(root / f"aspects-provisional-{count}-series.jsonl")
        _require(len(series) == count, f"Incomplete {count}-observation series")
        _require([x["observation"] for x in series] == list(range(1, count + 1)),
                 f"Out-of-order {count}-observation trend")
        _require(all(x["cumulative_loc"] > 0 and
                     abs(1000 * x["cumulative_defects"] / x["cumulative_loc"] -
                         x["defects_per_kloc_reported" if count == 600 else "defects_per_kloc"]) < 1e-10
                     for x in series), f"Invalid {count}-series cumulative rate")
        _require(series[-1]["cumulative_defects"] == 491 and series[-1]["cumulative_loc"] == 343818,
                 f"Unexpected final provisional {count}-observation total")
        _require(abs(series[-1]["sma_25" if count == 700 else "sma_25_reported"] -
                     sum(x["defects_per_kloc" if count == 700 else "defects_per_kloc_reported"]
                         for x in series[-25:]) / 25) < 1e-10,
                 f"Incorrect provisional {count}-observation SMA-25")
        trends[str(count)] = {"observations": count, "status": "provisional_not_git_window",
                               "latest_defects": 491, "latest_loc": 343818}

    return {
        "status": "historical_corpus_complete_provenance_verified_not_git_span_verified",
        "source_workbook_sha256": WORKBOOK_SHA256,
        "corpus_sha256": EVENTS_SHA256,
        "observations_imported": next_ordinal,
        "zero_defect_observations": zero_defect,
        "defect_observations_not_distinct": total_defects,
        "reviewed_line_occurrences": reviewed,
        "all_history_known_incremental_loc_sum_not_unique_git_union": fresh,
        "known_repeated_loc": repeated,
        "missing_incremental_loc_observations": unknown,
        "parsed_unverified_source_pins": pinned,
        "legacy_900_first_parent": {
            "status": "partial_historical_checkpoint_not_current",
            "head_sha": last["head_sha"],
            "defects": last["defects_reported"],
            "reviewed_loc": last["unique_loc_reported"],
            "rate_per_kloc": current_rate,
            "previous_rate_per_kloc": previous_rate,
            "signed_change_per_kloc": current_rate - previous_rate,
            "timestamp_utc": last["as_of_utc"],
        },
        "trends": trends,
        "notice": "Do not add workbook counts to path/blob verified subset or treat cross-revision pins as verified.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("docs/engineering/aspects-historical"))
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()
    output = verify(args.root)
    result = json.dumps(output, indent=2, sort_keys=True) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(result, encoding="utf-8")
    print(result)


if __name__ == "__main__":
    main()
