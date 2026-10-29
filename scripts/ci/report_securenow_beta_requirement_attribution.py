#!/usr/bin/env python3
"""Link SecureNow beta requirement candidates to *observed* TRX test executions.

A passing matched test is a candidate signal, NEVER proof of a complete requirement,
live tenant isolation, a staged release, or permission to ship beta.
"""
from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHA = re.compile(r"^[a-fA-F0-9]{40}$")
FILTER = re.compile(r"FullyQualifiedName~([a-zA-Z0-9_]+)")
MAX_TRX = 12 * 1024 * 1024


def test_results(trx_files: list[Path]) -> tuple[dict[str, set[str]], list[str]]:
    observed: dict[str, set[str]] = {}
    problems: list[str] = []
    for path in trx_files:
        if not path.is_file() or path.stat().st_size > MAX_TRX:
            problems.append(f"missing_or_oversized_trx:{path.name}")
            continue
        try:
            root = ET.parse(path).getroot()
        except (ET.ParseError, OSError):
            problems.append(f"unparseable_trx:{path.name}")
            continue
        found = 0
        for node in root.iter():
            if node.tag.rsplit("}", 1)[-1] != "UnitTestResult":
                continue
            name = str(node.attrib.get("testName", ""))
            outcome = str(node.attrib.get("outcome", "")).lower()
            if name and outcome in {"passed", "failed", "notexecuted", "inconclusive", "timeout"}:
                observed.setdefault(name, set()).add(outcome)
                found += 1
        if not found:
            problems.append(f"no_test_results:{path.name}")
    return observed, problems


def build(matrix: dict, *, sha: str, run_id: str, trx_files: list[Path]) -> dict:
    from scripts.ci.check_securenow_beta_evidence import IDS, validate
    errors = validate(matrix)
    if errors or not SHA.fullmatch(sha) or int(sha, 16) == 0 or not re.fullmatch(r"[1-9][0-9]*", run_id):
        raise ValueError("Invalid matrix, commit or Actions run ID: " + "; ".join(errors[:3]))
    observed, problems = test_results(trx_files)
    entries = []
    for req in matrix["requirements"]:
        rid = req["id"]
        filters = FILTER.findall(req.get("candidate_test_command", ""))
        matching = [
            (name, sorted(outcomes)) for name, outcomes in observed.items()
            if any(fragment.lower() in name.lower() for fragment in filters)
        ]
        has_failures = any(set(outcomes) != {"passed"} for _, outcomes in matching)
        if not filters:
            reason = "NO_MAPPED_CANDIDATE_TEST"
        elif not matching:
            reason = "MAPPED_TEST_NOT_OBSERVED"
        elif has_failures:
            reason = "CANDIDATE_TEST_DID_NOT_PASS"
        else:
            reason = "CANDIDATE_TEST_PASSED_REQUIREMENT_UNVERIFIED"
        entries.append({
            "id": rid, "status": "UNKNOWN", "blocker": reason,
            "candidateFilter": filters,
            "observedTests": [{"name": name, "outcomes": outcomes} for name, outcomes in matching],
            "releaseEvidenceVerified": False,
        })
    assert len(entries) == len(IDS)
    return {
        "schemaVersion": 1, "product": "SecureNow",
        "testedSha": sha.lower(), "githubRunId": run_id,
        "sourceMatrix": "docs/securenow/BETA_EVIDENCE_MATRIX.json",
        "evidenceClass": "OBSERVED_TEST_RESULTS_CANDIDATE_ONLY",
        "observedDistinctTests": len(observed),
        "sourceProblems": problems,
        "requirements": entries, "requirementCount": len(entries),
        "fullyVerifiedRequirementCount": 0, "betaReleaseDecision": "NO_GO",
        "ownerLiveGates": ["real Azure Reader collection", "foreign-tenant denial",
                           "staging rollback", "privacy/support", "owner signoff"],
        "notes": "No requirement is promoted to PASS from a TRX filter match. Human/live evidence is additional.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--matrix", type=Path, default=ROOT / "docs/securenow/BETA_EVIDENCE_MATRIX.json")
    parser.add_argument("--trx", type=Path, action="append", default=[])
    parser.add_argument("--sha", required=True)
    parser.add_argument("--run-id", required=True)
    parser.add_argument("--output", type=Path, required=True)
    a = parser.parse_args()
    data = build(json.loads(a.matrix.read_text()), sha=a.sha, run_id=a.run_id, trx_files=a.trx)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    a.output.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"SecureNow requirement attribution: {len(data['requirements'])} HOLD/UNKNOWN, "
          f"{data['observedDistinctTests']} observed tests, NO_GO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
