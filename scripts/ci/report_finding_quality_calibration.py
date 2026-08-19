#!/usr/bin/env python3
"""Finding-quality calibration rollup (GQ-02 engineering slice — not buyer certification)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_baselines(root: Path) -> list[dict[str, object]]:
    baseline_dir = root / "tests" / "golden-cohort" / "baselines"
    rows: list[dict[str, object]] = []

    if not baseline_dir.is_dir():
        return rows

    for path in sorted(baseline_dir.glob("*.baseline.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        rows.append({"fixtureId": path.stem.replace(".baseline", ""), "baseline": payload})

    return rows


def build_summary(root: Path) -> dict[str, object]:
    baselines = _load_baselines(root)
    packs: dict[str, dict[str, object]] = {}

    for row in baselines:
        baseline = row["baseline"]
        policy_pack = baseline.get("policyPackId") or baseline.get("policyPack")

        if policy_pack is None:
            packs[row["fixtureId"]] = {
                "status": "insufficient-labels",
                "note": "Baseline has no policyPackId — precision/coverage not computed.",
            }
            continue

        structural = baseline.get("structuralCompleteness")
        semantic = baseline.get("semanticScore")
        packs[str(policy_pack)] = {
            "status": "labeled",
            "structuralCompleteness": structural,
            "semanticScore": semantic,
            "fixtureId": row["fixtureId"],
        }

    labeled_count = sum(1 for v in packs.values() if v.get("status") == "labeled")
    insufficient_count = sum(1 for v in packs.values() if v.get("status") == "insufficient-labels")

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "Engineering calibration rollup — not SOC attestation or pack-as-certification.",
        "baselineFixturesScanned": len(baselines),
        "labeledPolicyPacks": labeled_count,
        "insufficientLabels": insufficient_count,
        "perPolicyPack": packs,
    }


def write_reports(root: Path, summary: dict[str, object]) -> None:
    quality_dir = root / "docs" / "quality"
    quality_dir.mkdir(parents=True, exist_ok=True)

    json_path = quality_dir / "finding-quality-calibration-summary.json"
    md_path = quality_dir / "finding-quality-calibration-summary.md"

    json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Finding quality calibration summary",
        "",
        summary["disclaimer"],
        "",
        f"- Baselines scanned: {summary['baselineFixturesScanned']}",
        f"- Labeled policy packs: {summary['labeledPolicyPacks']}",
        f"- Insufficient labels: {summary['insufficientLabels']}",
        "",
        "Per entry:",
        "",
    ]

    for key, value in summary["perPolicyPack"].items():
        lines.append(f"- `{key}`: {value['status']}")

    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    root = repo_root()
    summary = build_summary(root)
    write_reports(root, summary)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
