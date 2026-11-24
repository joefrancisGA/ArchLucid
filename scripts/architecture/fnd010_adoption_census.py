#!/usr/bin/env python3
"""Source-pinned FND-010 adoption census, integrated with FND-017 advisory reporting.

This is not a compiler/control-flow proof. A changed evidence file invalidates its
reviewed conclusion, even when the text-order sentinel still passes.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

STATES = ("conformant", "partial", "gap", "exempt", "unverified")
DEFAULT_BASELINE = "config/architecture/fnd010-adoption-baseline.json"


def git_blob_id(data: bytes) -> str:
    # Git's SHA-1 blob identity is a version marker, not a security signature.
    return hashlib.sha1(f"blob {len(data)}\0".encode() + data, usedforsecurity=False).hexdigest()


def check_order(text: str, start: str, tokens: list[str]) -> bool:
    # A deliberately bounded textual sentinel, not semantic analysis.
    if text.count(start) != 1:
        return False
    start_index = text.index(start) + len(start)
    rest = text[start_index:]
    next_member = re.search(r"(?m)^    (?:public|private|protected|internal)\s", rest)
    section = rest[:next_member.start()] if next_member else rest
    cursor = 0
    for token in tokens:
        found = section.find(token, cursor)
        if found < 0:
            return False
        cursor = found + len(token)
    return True


_HTTP_ATTRIBUTE = re.compile(r"^\s*\[(?:Http(?:Get|Post|Put|Patch|Delete|Head|Options|Trace)|AcceptVerbs)\b")
_PUBLIC_METHOD = re.compile(r"^    public\s+(?:async\s+)?[\w.<>,\[\]? ]+\s+(\w+)\s*\(")


def discover_action_candidates(root: Path) -> tuple[list[dict], list[dict]]:
    """Conservative source discovery, not complete MVC routing or eligibility proof.

    Count method declarations rather than route aliases; report unmapped attributes.
    All discovered but unreviewed candidates remain explicitly unclassified.
    """
    found, unresolved = [], []
    controllers = root / "ArchLucid.Api/Controllers"
    for path in sorted(controllers.rglob("*.cs")):
        relative = path.relative_to(controllers)
        family = relative.with_name(relative.name.split(".", 1)[0] + ".cs").as_posix()
        source_path = path.relative_to(root).as_posix()
        pending = []
        for number, line in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
            if _HTTP_ATTRIBUTE.match(line):
                pending.append(number)
                continue
            if not pending:
                continue
            match = _PUBLIC_METHOD.match(line)
            if match:
                found.append({"controllerFile": family, "source": source_path,
                              "action": match.group(1), "line": number,
                              "httpAttributeLines": pending})
                pending = []
            elif line.startswith("    private ") or line.startswith("    protected ") or line == "}":
                unresolved.append({"source": source_path, "httpAttributeLines": pending})
                pending = []
        if pending:
            unresolved.append({"source": source_path, "httpAttributeLines": pending})
    return found, unresolved


def scan(root: Path, baseline: dict) -> dict:
    if baseline.get("schemaVersion") != 1:
        raise ValueError("Unsupported adoption baseline schema")
    registry = json.loads((root / baseline["registryPath"]).read_text(encoding="utf-8"))
    registry_files = {entry["controller_file"] for entry in registry["entries"]}
    reviewed_files = set()
    seen = set()
    evidence_cache: dict[str, tuple[str | None, str]] = {}
    rows = []

    def source(path: str) -> tuple[str | None, str]:
        if path not in evidence_cache:
            target = root / path
            if not target.is_file():
                evidence_cache[path] = (None, "")
            else:
                data = target.read_bytes()
                evidence_cache[path] = (git_blob_id(data), data.decode("utf-8-sig"))
        return evidence_cache[path]

    for action in baseline["actions"]:
        aid, recorded = action["id"], action["status"]
        if aid in seen or recorded not in STATES or not action["reason"].strip():
            raise ValueError(f"Duplicate or invalid reviewed action: {aid}")
        seen.add(aid)
        reviewed_files.add(action["controllerFile"])
        evidence = action["evidence"]
        paths = {item["path"] for item in evidence}
        if len(paths) != len(evidence) or action["source"] not in paths:
            raise ValueError(f"Invalid evidence coverage for {aid}")
        stale = [item["path"] for item in evidence if source(item["path"])[0] != item["blob"]]
        if action["controllerFile"] not in registry_files:
            stale.append("controller registry membership")
        # Confirm that the reviewed action still has a public declaration. This
        # is a discovery check, not a claim of full ASP.NET route enumeration.
        method = re.escape(action["action"])
        if not re.search(r"(?m)^\s*public\s+(?:async\s+)?[^\n;{}]*\b" + method + r"\s*\(",
                         source(action["source"])[1]):
            stale.append("action declaration")
        order_failures = []
        for check in action.get("orderChecks", []):
            if check["path"] not in paths or not check["tokens"]:
                raise ValueError(f"Unpinned or empty order check: {aid}")
            if not check_order(source(check["path"])[1], check["start"], check["tokens"]):
                order_failures.append({"path": check["path"], "start": check["start"]})
        effective = "unverified" if stale or order_failures else recorded
        rows.append({"id": aid, "recorded": recorded, "effective": effective,
                     "reason": action["reason"], "changedEvidence": sorted(set(stale)),
                     "orderSentinelFailures": order_failures,
                     "pendingPr": action.get("pendingPr")})

    counts = Counter(row["effective"] for row in rows)
    discovered, unresolved = discover_action_candidates(root)
    reviewed_keys = {(a["source"], a["action"]) for a in baseline["actions"]}
    unclassified = [a for a in discovered if (a["source"], a["action"]) not in reviewed_keys]
    eligible = len(rows) - counts["exempt"]
    return {
        "schemaVersion": 1, "mode": "advisory", "baselineCommit": baseline["baselineCommit"],
        "scope": baseline["scope"],
        "controllerRegistryFiles": len(registry_files),
        "controllerFolderCsFiles": len(list((root / "ArchLucid.Api/Controllers").rglob("*.cs"))),
        "representedControllerFiles": len(reviewed_files & registry_files),
        "unrepresentedRegistryFiles": sorted(registry_files - reviewed_files),
        "registryChanged": source(baseline["registryPath"])[0] != baseline["registryBlob"],
        "discoveredHttpActionCandidates": len(discovered),
        "unclassifiedHttpActionCandidates": unclassified,
        "unresolvedHttpAttributes": unresolved,
        "reviewedActionCount": len(rows), "eligibleOrCandidateActions": eligible,
        "counts": {state: counts[state] for state in STATES},
        "conformantFraction": round(counts["conformant"] / eligible, 6) if eligible else None,
        "staleActionCount": sum(bool(row["changedEvidence"] or row["orderSentinelFailures"]) for row in rows),
        "actions": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".")
    parser.add_argument("--baseline", default=DEFAULT_BASELINE)
    parser.add_argument("--output", default="fnd010-adoption-report.json")
    args = parser.parse_args()
    root = Path(args.root)
    baseline = json.loads((root / args.baseline).read_text(encoding="utf-8"))
    result = scan(root, baseline)
    Path(args.output).write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"FND-010 advisory cohort: {result['reviewedActionCount']} actions; "
          f"{result['counts']}; stale={result['staleActionCount']}; "
          f"unrepresented registry files={len(result['unrepresentedRegistryFiles'])}")


if __name__ == "__main__":
    main()
