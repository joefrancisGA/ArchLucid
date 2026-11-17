#!/usr/bin/env python3
"""Offline SecureNow evidence and exported-question coverage audit.

Read only: no Azure, network, SQL, paid services, or production mutation.
This is NOT a replacement for the production SecureNow path/finding engines.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys
import zipfile

SCHEMA = "securenow.evidence-lab.v1"
MAX_ZIP_BYTES = 128 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 512 * 1024 * 1024
MAX_JSON_ENTRY_BYTES = 128 * 1024 * 1024
OPTIONAL_SOURCES = (
    "role-assignments.json", "network-associations.json", "diagnostic-settings.json",
    "policy-assignments.json", "federated-credentials.json", "entra-group-memberships.json",
    "directory-role-assignments.json", "graph-app-role-assignments.json",
    "effective-network-controls.json", "app-settings-hosts.json",
    "dependency-observations.json", "sql-database-principals.json",
    "defender-summary.json", "defender-assessments.json",
)
COVERAGE_STATES = frozenset(
    {"Collected", "NotCollected", "AccessDenied", "NotConfigured", "Failed", "Unknown"}
)


def normalize(value: object) -> str:
    return str(value or "").strip().lower()


def read_json_file(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def load_package(path: Path) -> dict:
    if path.stat().st_size > MAX_ZIP_BYTES:
        raise ValueError(f"ZIP exceeds {MAX_ZIP_BYTES} bytes: {path}")
    package_sha = hashlib.sha256(path.read_bytes()).hexdigest()
    with zipfile.ZipFile(path) as archive:
        members = archive.infolist()
        names = [member.filename for member in members]
        if len(names) != len(set(names)):
            raise ValueError(f"Duplicate ZIP member names: {path}")
        if any(
            name.startswith("/") or "\\" in name or ".." in Path(name).parts
            for name in names
        ):
            raise ValueError(f"Unsafe ZIP member name: {path}")
        if sum(member.file_size for member in members) > MAX_UNCOMPRESSED_BYTES:
            raise ValueError(f"ZIP expanded content exceeds safety limit: {path}")
        if "manifest.json" not in names or "resources.json" not in names:
            raise ValueError(f"Missing manifest.json or resources.json: {path}")

        def read_json(name: str) -> object:
            entry = archive.getinfo(name)
            if entry.file_size > MAX_JSON_ENTRY_BYTES:
                raise ValueError(f"Oversized JSON member {name}: {path}")
            with archive.open(entry) as stream:
                return json.load(stream)

        manifest = read_json("manifest.json")
        resources = read_json("resources.json")
        if not isinstance(manifest, dict) or manifest.get("schemaVersion") not in (1, 2):
            raise ValueError(f"Unsupported ZIP schema (must be 1 or 2): {path}")
        sub = normalize(manifest.get("subscriptionId"))
        if not sub or not re.fullmatch(r"[a-z0-9_-]{1,80}", sub):
            raise ValueError(f"Expected a safe single-subscription identifier: {path}")
        if not isinstance(manifest.get("collectionTimestamp"), str):
            raise ValueError(f"Missing collectionTimestamp: {path}")
        if not isinstance(resources, list):
            raise ValueError(f"resources.json must be an array: {path}")

        index: dict[str, dict] = {}
        for record in resources:
            if not isinstance(record, dict):
                raise ValueError(f"Invalid resources.json item: {path}")
            resource_id = normalize(
                record.get("resourceId") or record.get("azureResourceId") or record.get("id")
            )
            if resource_id:
                index[resource_id] = {
                    "type": record.get("resourceType") or record.get("type") or "Unknown",
                    "source": "resources.json",
                }
        file_coverage = {
            name: "Present" if name in names else "NotCollectedOrNotPackaged"
            for name in OPTIONAL_SOURCES
        }
        return {
            "subscriptionId": sub,
            "packageSha256": package_sha,
            "captureUtc": manifest["collectionTimestamp"],
            "schemaVersion": manifest["schemaVersion"],
            "collectorVersion": manifest.get("scriptVersion", "unknown"),
            "resourceCount": len(resources),
            "indexedResourceCount": len(index),
            "resources": index,
            "sources": file_coverage,
        }


def get_question_rows(questions_dir: Path | None, sub: str) -> tuple[str, list[dict]]:
    if questions_dir is None:
        return "NotProvided", []
    paths = [
        questions_dir / f"{sub}.questions.json",
        questions_dir / f"{sub}.json",
    ]
    existing = [path for path in paths if path.is_file()]
    if not existing:
        return "NotProvided", []
    data = read_json_file(existing[0])
    if isinstance(data, dict):
        data = data.get("questions")
    if not isinstance(data, list) or any(not isinstance(row, dict) for row in data):
        raise ValueError(f"Invalid exported question array: {existing[0]}")
    for row in data:
        if normalize(row.get("subscriptionId")) not in ("", sub):
            raise ValueError(f"Question from another subscription in {existing[0]}")
    return "Provided", data


def load_coverage(coverage_dir: Path | None, sub: str) -> dict[str, dict]:
    if coverage_dir is None:
        return {}
    path = coverage_dir / f"{sub}.coverage.json"
    if not path.is_file():
        return {}
    data = read_json_file(path)
    if not isinstance(data, dict) or normalize(data.get("subscriptionId")) != sub:
        raise ValueError(f"Coverage manifest subscription mismatch: {path}")
    entries = data.get("sources", [])
    if not isinstance(entries, list):
        raise ValueError(f"Invalid sources array: {path}")
    result = {}
    for item in entries:
        if (
            not isinstance(item, dict)
            or item.get("status") not in COVERAGE_STATES
            or not item.get("source")
        ):
            raise ValueError(f"Invalid coverage entry: {path}")
        result[str(item["source"]).strip()] = {
            "status": item["status"],
            "detail": str(item.get("detail") or "")[:500],
        }
    return result


def evaluate_question(row: dict, package: dict, coverage: dict[str, dict],
                      include_ids: bool) -> dict:
    source = str(row.get("source") or "Unknown")
    question_key = str(row.get("questionKey") or "")
    arm_id = normalize(row.get("resourceId"))
    evidence = package["resources"].get(arm_id)
    identity = arm_id if include_ids else (
        "sha256:" + hashlib.sha256(arm_id.encode()).hexdigest()[:20] if arm_id else ""
    )
    if source == "PolicyPack":
        classification = "HumanJudgmentOrPolicyEvaluationRequired"
        rationale = (
            "Policy intent, acceptance, or a policy-specific evaluation "
            "cannot be concluded from ZIP presence."
        )
    elif source == "InferredConnection":
        classification = "ApplicationEvidenceOrHumanConfirmationRequired"
        rationale = (
            "A proposed connection is not observed traffic; "
            "use allowed runtime evidence or human confirmation."
        )
    elif arm_id and evidence is None:
        classification = "ResourceNotInPackage"
        rationale = (
            "Question resource is absent from this subscription package; "
            "check collection scope before interpreting absence."
        )
    elif normalize(question_key).startswith("orphan-still-needed"):
        classification = "HumanIntentRequired"
        rationale = "Azure inventory cannot determine whether a resource is still needed."
    else:
        classification = "InsufficientRelationshipEvidence"
        rationale = (
            "Resource inventory alone does not establish complete application "
            "or network relationships."
        )
    blocked = sorted(
        name for name, state in coverage.items()
        if state["status"] == "AccessDenied"
    )
    return {
        "questionKey": question_key,
        "questionSource": source,
        "originalStatus": row.get("status", "Open"),
        "evidenceFingerprint": row.get("evidenceFingerprint", ""),
        "resource": identity,
        "resourcePresentInZip": evidence is not None,
        "resourceEvidence": [evidence["source"]] if evidence else [],
        "classification": classification,
        "reason": rationale,
        "recordedAccessDeniedSources": blocked,
        "answerApplied": False,
        "limitation": (
            "No production path engine, policy pack, or SQL-scoped "
            "question generator was executed by this audit."
        ),
    }


def run(packages: list[Path], questions_dir: Path | None,
        coverage_dir: Path | None, expected: Path | None,
        include_ids: bool) -> dict:
    subscriptions = []
    seen: set[str] = set()
    for path in sorted(packages, key=str):
        package = load_package(path)
        sub = package["subscriptionId"]
        if sub in seen:
            raise ValueError(
                f"Duplicate subscription package: {sub}; select one snapshot per subscription"
            )
        seen.add(sub)
        question_status, questions = get_question_rows(questions_dir, sub)
        coverage = load_coverage(coverage_dir, sub)
        results = [
            evaluate_question(row, package, coverage, include_ids)
            for row in questions
        ]
        results.sort(
            key=lambda row: (
                row["questionSource"], row["questionKey"], row["resource"]
            )
        )
        subscriptions.append({
            "subscriptionId": sub,
            "packageSha256": package["packageSha256"],
            "captureUtc": package["captureUtc"],
            "schemaVersion": package["schemaVersion"],
            "collectorVersion": package["collectorVersion"],
            "resourceCount": package["resourceCount"],
            "indexedResourceCount": package["indexedResourceCount"],
            "questionQueueStatus": question_status,
            "questionCount": len(questions) if question_status == "Provided" else None,
            "evidenceFileCoverage": package["sources"],
            "recordedCollectionOutcomes": coverage,
            "questions": results,
        })
    expected_ids = None
    if expected:
        values = read_json_file(expected)
        if not isinstance(values, list) or any(not isinstance(x, str) for x in values):
            raise ValueError(
                "Expected-subscriptions input must be a JSON array of subscription IDs"
            )
        expected_ids = sorted({normalize(x) for x in values})
    return {
        "schema": SCHEMA,
        "kind": "offline-evidence-coverage-audit",
        "execution": "No Azure calls, SQL database, paid AI services, or production state changes",
        "limitations": [
            "Read-only coverage and exported-question audit, NOT full SecureNow analysis replay.",
            "Absent ZIP entries do not prove access denied; present empty arrays do not prove complete collection.",
            "No finding, risk, ownership, or connection is automatically resolved or suppressed.",
            "Question results require an authentic, same-snapshot production question export.",
        ],
        "subscriptions": subscriptions,
        "expectedSubscriptions": expected_ids,
        "notCollectedSubscriptions": (
            sorted(set(expected_ids) - seen) if expected_ids is not None else None
        ),
        "unexpectedSubscriptions": (
            sorted(seen - set(expected_ids)) if expected_ids is not None else None
        ),
    }


def to_markdown(report: dict) -> str:
    lines = [
        "# SecureNow offline evidence coverage audit", "",
        "**Not a security clearance or full analysis replay.**", "",
        f"Subscriptions: {len(report['subscriptions'])}", "",
    ]
    if report["notCollectedSubscriptions"] is not None:
        lines += [
            "Missing expected subscriptions: "
            + (", ".join(report["notCollectedSubscriptions"]) or "none"), "",
        ]
    for item in report["subscriptions"]:
        lines += [
            f"## Subscription \`{item['subscriptionId']}\`", "",
            f"Package SHA-256: \`{item['packageSha256']}\`", "",
            f"Resources: {item['resourceCount']} | "
            f"Question export: {item['questionQueueStatus']} | "
            f"Questions: {item['questionCount'] if item['questionCount'] is not None else 'unknown'}",
            "", "| Question | Classification | Resource in ZIP |",
            "|---|---|---|",
        ]
        for question in item["questions"]:
            lines.append(
                "| " + " | ".join([
                    question["questionKey"].replace("|", "\\|"),
                    question["classification"],
                    str(question["resourcePresentInZip"]),
                ]) + " |"
            )
        lines += [
            "", "Evidence-source presence is a packaging observation, "
            "not an access-permission conclusion.", "",
        ]
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--packages", type=Path, required=True,
        help="Directory of existing Azure extractor ZIP packages",
    )
    parser.add_argument(
        "--questions-dir", type=Path,
        help="Optional <subscriptionId>.questions.json exports from SecureNow",
    )
    parser.add_argument(
        "--coverage-dir", type=Path,
        help="Optional explicit <subscriptionId>.coverage.json collector outcomes",
    )
    parser.add_argument(
        "--expected-subscriptions", type=Path,
        help="JSON array from independent subscription inventory",
    )
    parser.add_argument(
        "--out", type=Path, required=True,
        help="Local output directory (treat as tenant confidential)",
    )
    parser.add_argument(
        "--include-resource-ids", action="store_true",
        help="Output raw ARM resource IDs (default: SHA-256 pseudonyms)",
    )
    args = parser.parse_args(argv)
    if not args.packages.is_dir():
        parser.error("--packages must be a directory")
    packages = sorted(args.packages.glob("*.zip"))
    if not packages:
        parser.error("No .zip files found in --packages")
    try:
        report = run(
            packages, args.questions_dir, args.coverage_dir,
            args.expected_subscriptions, args.include_resource_ids,
        )
        args.out.mkdir(parents=True, exist_ok=True)
        (args.out / "evidence-coverage.json").write_text(
            json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        (args.out / "evidence-coverage.md").write_text(
            to_markdown(report), encoding="utf-8"
        )
    except (ValueError, OSError, json.JSONDecodeError, zipfile.BadZipFile, KeyError) as ex:
        print(f"SecureNow evidence lab: {ex}", file=sys.stderr)
        return 2
    print(
        f"Audited {len(report['subscriptions'])} package(s). "
        f"See {args.out / 'evidence-coverage.json'}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
