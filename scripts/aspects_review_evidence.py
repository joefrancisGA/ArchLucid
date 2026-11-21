#!/usr/bin/env python3
"""Record exact Aspects review spans and calculate content-aware unique coverage.

The input is an explicit review observation, NOT a list of files merely fetched.
No density claim is made without first-parent window membership supplied by the caller.
"""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess

SHA = re.compile(r"^[0-9a-f]{40}$")
RANGE = re.compile(r"^([1-9][0-9]*)(?:-([1-9][0-9]*))?$")


def parse_spans(values):
    spans = []
    for value in values:
        match = RANGE.fullmatch(value)
        if not match:
            raise ValueError(f"Invalid line span: {value}")
        start = int(match.group(1))
        end = int(match.group(2) or start)
        if end < start:
            raise ValueError(f"Reversed line span: {value}")
        spans.append((start, end))
    if not spans:
        raise ValueError("At least one actually reviewed line span is required")
    return spans


def normalize_path(value):
    path = Path(value)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise ValueError("Path must be repository-relative without traversal")
    return path.as_posix()


def read_records(path):
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as stream:
        return [json.loads(line) for line in stream if line.strip()]


def record(path, observation):
    if not SHA.fullmatch(observation["baseline"]) or not SHA.fullmatch(observation["blob"]):
        raise ValueError("Baseline and blob must be complete lowercase Git SHAs")
    observation["path"] = normalize_path(observation["path"])
    observation["spans"] = [list(pair) for pair in parse_spans(observation["spans"])]
    observation["verified"] = observation.get("verified") is True
    observation["captured_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()
    # Stable identity makes retries safe. Distinct passes can still review the same spans.
    identity = (observation["baseline"], observation["blob"], observation["path"],
                tuple(map(tuple, observation["spans"])), observation.get("defect_id"), observation["verified"])
    existing = read_records(path)
    for item in existing:
        prior = (item["baseline"], item["blob"], item["path"],
                 tuple(map(tuple, item["spans"])), item.get("defect_id"), item.get("verified") is True)
        if prior == identity:
            return False
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as stream:
        stream.write(json.dumps(observation, sort_keys=True) + "\n")
        stream.flush()
        os.fsync(stream.fileno())
    return True


def coverage(records, baselines):
    # The same file path at different content blobs is NOT silently considered identical.
    # This is an upper-bound on unique reviewed source locations across changed blobs;
    # content lineage mapping is needed for true cross-revision LOC deduplication.
    covered = {}
    defects = set()
    included = 0
    excluded_unverified = 0
    for item in records:
        if item.get("verified") is not True:
            excluded_unverified += 1
            continue
        if item["baseline"] not in baselines:
            continue
        included += 1
        key = (item["path"], item["blob"])
        covered.setdefault(key, set())
        for start, end in item["spans"]:
            covered[key].update(range(start, end + 1))
        if item.get("defect_id"):
            defects.add(item["defect_id"])
    lines = sum(len(values) for values in covered.values())
    return {"included_records": included, "excluded_unverified_records": excluded_unverified,
            "unique_path_blob_lines": lines,
            "confirmed_distinct_defects": len(defects),
            "provisional_density_per_kloc": round(1000 * len(defects) / lines, 6) if lines else None,
            "coverage_warning": "Path/blob interval union is not cross-revision content-lineage deduplication; not a verified whole-codebase density."}



def git(repo, *args):
    return subprocess.run(["git", "-C", str(repo), *args], check=True,
                          capture_output=True, text=True).stdout


def verified_observation(repo, baseline, path, spans, defect_id=None):
    """Fail closed unless spans exist and contain only nonblank source lines at baseline."""
    if not SHA.fullmatch(baseline):
        raise ValueError("A full pinned baseline SHA is required")
    path = normalize_path(path)
    parsed = parse_spans(spans)
    blob = git(repo, "rev-parse", f"{baseline}:{path}").strip()
    if not SHA.fullmatch(blob):
        raise ValueError("Git did not resolve a source blob")
    source = git(repo, "show", f"{baseline}:{path}").splitlines()
    for start, end in parsed:
        if end > len(source):
            raise ValueError(f"Reviewed span exceeds source length: {start}-{end}")
        if any(not line.strip() for line in source[start - 1:end]):
            raise ValueError(f"Reviewed span includes blank lines: {start}-{end}")
    return {"baseline": baseline, "blob": blob, "path": path,
            "spans": spans, "defect_id": defect_id, "verified": True}


def verified_first_parent(repo, head, window):
    if not SHA.fullmatch(head) or window <= 0:
        raise ValueError("Full pinned HEAD SHA and positive window are required")
    history = git(repo, "rev-list", "--first-parent", f"--max-count={window}", head).splitlines()
    if not history or history[0] != head:
        raise ValueError("Unable to verify first-parent history")
    return set(history)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", required=True, type=Path)
    commands = parser.add_subparsers(dest="command", required=True)
    add = commands.add_parser("record", help="Import unverified historical evidence (excluded from density)")
    add.add_argument("--baseline", required=True)
    add.add_argument("--blob", required=True)
    add.add_argument("--path", required=True)
    add.add_argument("--span", required=True, action="append")
    add.add_argument("--defect-id")
    verified = commands.add_parser("record-verified")
    verified.add_argument("--repo", required=True, type=Path)
    verified.add_argument("--baseline", required=True)
    verified.add_argument("--path", required=True)
    verified.add_argument("--span", required=True, action="append")
    verified.add_argument("--defect-id")
    report = commands.add_parser("report")
    report.add_argument("--repo", type=Path)
    report.add_argument("--head")
    report.add_argument("--window", type=int, default=800)
    report.add_argument("--first-parent-shas", type=Path)
    args = parser.parse_args()
    if args.command == "record":
        observation = {"baseline": args.baseline, "blob": args.blob, "path": args.path,
                       "spans": args.span, "defect_id": args.defect_id, "verified": False}
        print(json.dumps({"appended": record(args.ledger, observation)}))
    elif args.command == "record-verified":
        observation = verified_observation(args.repo, args.baseline, args.path, args.span, args.defect_id)
        print(json.dumps({"appended": record(args.ledger, observation)}))
    else:
        if args.repo and args.head:
            baselines = verified_first_parent(args.repo, args.head, args.window)
        elif args.first_parent_shas:
            baselines = set(args.first_parent_shas.read_text(encoding="utf-8").split())
        else:
            raise ValueError("Supply --repo and --head, or --first-parent-shas")
        if not baselines or any(not SHA.fullmatch(sha) for sha in baselines):
            raise ValueError("First-parent SHA file must contain verified full Git SHAs")
        print(json.dumps(coverage(read_records(args.ledger), baselines), indent=2))


if __name__ == "__main__":
    main()
