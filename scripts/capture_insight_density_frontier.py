#!/usr/bin/env python3
"""Capture an insight-density frontier fixture from a sealed run (dev/test only)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_SCHEMA = "archlucid.insight-density-frontier-capture.v1"
_CLAIM_BOUNDARY = (
    "Frontier capture fixtures record sealed run metadata for offline novelty measurement. "
    "They are not captured frontier-model transcripts and must not be used to claim ArchLucid beats any named model."
)
_MAX_NOVELTY_DEVIATION = 0.001
_DECISION_GRADE = "decisiongradefinding"
_DID_NOT_THINK_KIND = 0


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _require_dev_only(dev_only: bool) -> None:
    if dev_only or os.environ.get("ARCHLUCID_DEV_CAPTURE") == "1":
        return

    print(
        "Refusing to capture without --dev-only or ARCHLUCID_DEV_CAPTURE=1 (dev/test operator script only).",
        file=sys.stderr,
    )
    raise SystemExit(2)


def _classification_name(raw: Any) -> str:
    if raw is None:
        return "DecisionGradeFinding"

    token = str(raw).strip()

    if token == "":
        return "DecisionGradeFinding"

    if token.casefold() in {"0", "decisiongradefinding"}:
        return "DecisionGradeFinding"

    if token.casefold() in {"1", "checklistcoverage"}:
        return "ChecklistCoverage"

    return token


def _bytes_to_sha256_hex(raw: Any) -> str:
    if raw is None:
        return "0" * 64

    if isinstance(raw, (bytes, bytearray)):
        return raw.hex().lower()

    token = str(raw).strip()

    if token.startswith("0x"):
        token = token[2:]

    if len(token) == 64:
        return token.lower()

    return "0" * 64


def build_capture_document(
    *,
    architecture_package_sha256: str,
    findings_snapshot_id: str,
    captured_utc: str,
    label: str,
    archlucid_findings: list[dict[str, Any]],
    frontier_baseline_findings: list[dict[str, Any]],
    expected_novelty_percentage: float,
    run_id: str | None = None,
    novelty_finding_ids: list[str] | None = None,
    fixture_id: str | None = None,
) -> dict[str, Any]:
    decision_grade_titles = [
        str(row.get("title") or "").strip()
        for row in archlucid_findings
        if _classification_name(row.get("classification")) == "DecisionGradeFinding"
        and str(row.get("title") or "").strip()
    ]

    document: dict[str, Any] = {
        "schema": _SCHEMA,
        "architecturePackageSha256": architecture_package_sha256.lower(),
        "findingsSnapshotId": findings_snapshot_id,
        "capturedUtc": captured_utc,
        "label": label,
        "decisionGradeFindingTitles": decision_grade_titles,
        "archlucidFindings": archlucid_findings,
        "frontierBaseline": {"findings": frontier_baseline_findings},
        "expectedNoveltyPercentage": expected_novelty_percentage,
    }

    if fixture_id:
        document["id"] = fixture_id

    if run_id:
        document["runId"] = run_id

    if novelty_finding_ids:
        document["noveltyFindingIds"] = novelty_finding_ids

    return document


def _load_frontier_delta_module():
    import importlib.util

    path = _repo_root() / "scripts" / "ci" / "insight_density_frontier_delta.py"
    spec = importlib.util.spec_from_file_location("insight_density_frontier_delta", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def evaluate_capture_document(document: dict[str, Any], threshold: float = 0.60) -> float:
    delta = _load_frontier_delta_module()
    archlucid_findings = document.get("archlucidFindings") or []
    baseline_findings = (document.get("frontierBaseline") or {}).get("findings") or []

    decision_grade = [row for row in archlucid_findings if delta._is_decision_grade(row)]

    if not decision_grade:
        return 0.0

    covered = 0

    for finding in decision_grade:
        if delta.is_covered_by_baseline_list(finding, baseline_findings, threshold):
            covered += 1

    novel = len(decision_grade) - covered

    return (novel / len(decision_grade)) * 100.0


def validate_capture_document(document: dict[str, Any]) -> list[str]:
    errors: list[str] = []

    if document.get("schema") != _SCHEMA:
        errors.append(f"schema must be {_SCHEMA}")

    label = str(document.get("label") or "")

    if label not in {"synthetic", "pilot-pending"}:
        errors.append("label must be synthetic or pilot-pending")

    expected = document.get("expectedNoveltyPercentage")

    if not isinstance(expected, (int, float)):
        errors.append("expectedNoveltyPercentage must be numeric")
        return errors

    computed = evaluate_capture_document(document)

    if abs(computed - float(expected)) > _MAX_NOVELTY_DEVIATION:
        errors.append(
            f"expectedNoveltyPercentage {expected} deviates from computed {computed} by more than {_MAX_NOVELTY_DEVIATION}",
        )

    titles = document.get("decisionGradeFindingTitles") or []
    archlucid = document.get("archlucidFindings") or []
    derived_titles = [
        str(row.get("title") or "").strip()
        for row in archlucid
        if _classification_name(row.get("classification")) == "DecisionGradeFinding"
    ]

    if list(titles) != derived_titles:
        errors.append("decisionGradeFindingTitles must match decision-grade archlucidFindings titles")

    return errors


def _capture_from_sql(connection_string: str, run_id: str, label: str) -> dict[str, Any]:
    try:
        import pyodbc
    except ImportError as exc:
        raise RuntimeError("pyodbc is required for SQL capture mode") from exc

    connection = pyodbc.connect(connection_string)
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT RunId, FindingsSnapshotId, PinnedArchitectureVersionContentHashSha256
        FROM dbo.Runs
        WHERE RunId = ?
        """,
        run_id,
    )
    run_row = cursor.fetchone()

    if run_row is None:
        raise RuntimeError(f"Run {run_id} was not found.")

    findings_snapshot_id = str(run_row.FindingsSnapshotId)
    architecture_hash = _bytes_to_sha256_hex(run_row.PinnedArchitectureVersionContentHashSha256)

    cursor.execute(
        """
        SELECT FindingId, EngineType, Category, Title, Classification
        FROM dbo.FindingRecords
        WHERE FindingsSnapshotId = ?
        ORDER BY SortOrder
        """,
        findings_snapshot_id,
    )

    archlucid_findings: list[dict[str, Any]] = []

    for row in cursor.fetchall():
        archlucid_findings.append(
            {
                "findingId": str(row.FindingId),
                "engineType": str(row.EngineType),
                "category": str(row.Category),
                "title": str(row.Title),
                "policyRuleId": None,
                "classification": _classification_name(row.Classification),
            },
        )

    cursor.execute(
        """
        SELECT DISTINCT FindingId
        FROM dbo.FindingInsightSignals
        WHERE RunId = ? AND Kind = ?
        """,
        run_id,
        _DID_NOT_THINK_KIND,
    )
    novelty_finding_ids = [str(row.FindingId) for row in cursor.fetchall()]

    connection.close()

    return build_capture_document(
        architecture_package_sha256=architecture_hash,
        findings_snapshot_id=findings_snapshot_id,
        run_id=str(run_row.RunId),
        captured_utc=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        label=label,
        archlucid_findings=archlucid_findings,
        frontier_baseline_findings=[],
        expected_novelty_percentage=100.0 if archlucid_findings else 0.0,
        novelty_finding_ids=novelty_finding_ids or None,
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", help="Sealed run id to capture (requires --connection-string)")
    parser.add_argument(
        "--connection-string",
        help="ODBC connection string for dev/test SQL capture",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Path to write capture JSON",
    )
    parser.add_argument(
        "--label",
        choices=["synthetic", "pilot-pending"],
        default="pilot-pending",
        help="Capture label (default pilot-pending)",
    )
    parser.add_argument(
        "--validate-fixture",
        type=Path,
        help="Validate an existing capture fixture against the calculator",
    )
    parser.add_argument(
        "--dev-only",
        action="store_true",
        help="Acknowledge dev/test-only operator capture",
    )

    args = parser.parse_args(argv)

    if args.validate_fixture is not None:
        document = json.loads(args.validate_fixture.read_text(encoding="utf-8"))
        errors = validate_capture_document(document)

        if errors:
            for error in errors:
                print(error, file=sys.stderr)

            return 1

        print(f"Validated {_SCHEMA} fixture: {args.validate_fixture}")
        return 0

    if not args.run_id or not args.output:
        parser.error("--run-id and --output are required unless --validate-fixture is supplied")

    _require_dev_only(args.dev_only)

    if not args.connection_string:
        parser.error("--connection-string is required for run capture")

    document = _capture_from_sql(args.connection_string, args.run_id, args.label)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {_SCHEMA} capture to {args.output}")
    print(_CLAIM_BOUNDARY)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
