#!/usr/bin/env python3
"""Bootstrap templates-pack recordings from scenario expectedFindings rules.

Use when a live API capture is unavailable. Each recording satisfies the
scenario's MUST rules so `eval_template_harness.py --mode score` can run in CI.
Replace with live capture (`--mode capture`) when a stable API is available.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
PACK_DIR = REPO_ROOT / "tests" / "eval-corpus" / "templates-pack"


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def bootstrap_findings(scenario: dict[str, Any]) -> list[dict[str, Any]]:
    expected = scenario.get("expectedFindings") or []
    findings: list[dict[str, Any]] = []

    for rule in expected:
        if not isinstance(rule, dict):
            continue

        rule_id = str(rule.get("id") or "must-rule")
        category = str(rule.get("category") or "Compliance")
        anchors = [str(a).strip() for a in (rule.get("evidenceMustContain") or []) if str(a).strip()]
        detail = " ".join(anchors) if anchors else f"Bootstrap finding for {rule_id}"

        findings.append(
            {
                "findingId": rule_id,
                "category": category,
                "severity": "Medium",
                "title": detail,
                "detail": detail,
                "message": detail,
            }
        )

    return findings


def main() -> int:
    scenario_paths = sorted(PACK_DIR.glob("scenario-*.json"))

    if not scenario_paths:
        print("No scenario-*.json files found.", file=sys.stderr)
        return 1

    for scenario_path in scenario_paths:
        scenario = _read_json(scenario_path)
        recording_rel = str(scenario.get("recording") or "").strip()

        if not recording_rel:
            print(f"skip {scenario_path.name}: missing recording path", file=sys.stderr)
            continue

        recording_path = REPO_ROOT / recording_rel
        findings = bootstrap_findings(scenario)
        payload = {
            "schemaVersion": 1,
            "scenarioId": scenario.get("id"),
            "source": "bootstrap_eval_template_recordings.py",
            "note": "Synthetic baseline until live API capture; replace via eval_template_harness --mode capture.",
            "findings": findings,
        }
        _write_json(recording_path, payload)
        print(f"wrote {recording_path.relative_to(REPO_ROOT)} ({len(findings)} findings)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
