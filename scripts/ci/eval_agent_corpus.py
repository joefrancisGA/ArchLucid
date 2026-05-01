#!/usr/bin/env python3
"""Offline corpus checks: compare recorded findings against expected / unexpected probes.

Default: informational only (exit 0). Use `--enforce` when you want failures to block CI.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Mapping, Sequence


SEVERITY_RANK: dict[str, int] = {
    "critical": 40,
    "high": 30,
    "medium": 20,
    "low": 10,
    "informational": 5,
    "info": 5,
}


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def _norm_severity(raw: str | None) -> int:
    if raw is None:
        return 0

    return SEVERITY_RANK.get(str(raw).strip().lower(), 10)


def _combined_text(finding: Mapping[str, Any]) -> str:
    parts = [
        str(finding.get("category") or ""),
        str(finding.get("severity") or ""),
        str(finding.get("title") or ""),
        str(finding.get("detail") or ""),
    ]
    blob = " ".join(parts)
    return blob.strip().lower()


def _category_matches(blob_category: str | None, expected_category: str | None) -> bool:
    if expected_category is None:
        return True

    b = (blob_category or "").strip().lower()
    return b == str(expected_category).strip().lower()


def _meets_expected(actual: Sequence[Mapping[str, Any]], rule: Mapping[str, Any]) -> tuple[bool, str]:
    min_rank = _norm_severity(str(rule.get("minimumSeverity")))
    want_cat = str(rule.get("category") or "").strip() or None
    phrases = [str(p).strip().lower() for p in (rule.get("evidenceMustContain") or []) if str(p).strip()]

    if not phrases:
        return False, "expected rule missing evidenceMustContain"

    for fi in actual:
        cat_ok = _category_matches(str(fi.get("category") or ""), want_cat)

        if not cat_ok:
            continue

        if _norm_severity(str(fi.get("severity") or "")) < min_rank:
            continue

        text = _combined_text(fi)

        if all(p in text for p in phrases):
            return True, str(fi.get("findingId") or "(no id)")

    return False, ""


def _unexpected_triggered(actual: Sequence[Mapping[str, Any]], rule: Mapping[str, Any]) -> tuple[bool, str]:
    want_cat = str(rule.get("category") or "").strip() or None
    needles = [str(p).strip().lower() for p in (rule.get("ifContainsAny") or []) if str(p).strip()]

    if not needles:
        return False, ""

    for fi in actual:
        if want_cat is not None and not _category_matches(str(fi.get("category") or ""), want_cat):
            continue

        text = _combined_text(fi)

        if any(n in text for n in needles):
            return True, str(fi.get("findingId") or "(no id)")

    return False, ""


def evaluate_scenario(scenario_path: Path, corpus_root: Path) -> dict[str, Any]:
    scen = _load_json(scenario_path)

    if not isinstance(scen, dict):
        raise ValueError(f"{scenario_path.name} must be an object")

    sid = str(scen.get("id") or scenario_path.stem)
    rec_rel = scen.get("recording")

    if not isinstance(rec_rel, str) or not rec_rel.strip():
        raise ValueError(f"{sid}: recording path required")

    rec_path = (corpus_root / rec_rel).resolve()

    if not rec_path.is_file():
        raise FileNotFoundError(str(rec_path))

    rec = _load_json(rec_path)

    if not isinstance(rec, dict):
        raise ValueError(f"{rec_path.name} must be object")

    raw_findings = rec.get("findings")

    if not isinstance(raw_findings, list):
        raise ValueError(f"{rec_path.name} must contain findings array")

    actual: list[Mapping[str, Any]] = [f for f in raw_findings if isinstance(f, dict)]

    expected_rules = scen.get("expectedFindings") if isinstance(scen.get("expectedFindings"), list) else []
    unexpected_rules = scen.get("unexpectedFindings") if isinstance(scen.get("unexpectedFindings"), list) else []

    hits = 0

    for rule in expected_rules:
        if not isinstance(rule, dict):
            continue

        ok, who = _meets_expected(actual, rule)

        if ok:
            hits += 1

    unexpected_hits: list[str] = []

    for rule in unexpected_rules:
        if not isinstance(rule, dict):
            continue

        bad, who = _unexpected_triggered(actual, rule)

        if bad:
            unexpected_hits.append(who)

    denom = len(expected_rules) if expected_rules else 1
    recall = hits / float(denom)

    return {
        "id": sid,
        "path": str(scenario_path.relative_to(corpus_root)),
        "expectedRules": len(expected_rules),
        "expectedHits": hits,
        "recall": recall,
        "unexpectedHits": unexpected_hits,
        "actualFindings": len(actual),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate tests/eval-corpus scenarios (offline recordings).")
    parser.add_argument(
        "--corpus",
        type=Path,
        default=_repo_root() / "tests" / "eval-corpus",
        help="Corpus root containing manifest.json",
    )
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero when thresholds fail")
    parser.add_argument("--min-recall", type=float, default=0.6, help="Minimum recall for expected rules")
    args = parser.parse_args()

    corpus_root: Path = args.corpus.resolve()

    manifest_path = corpus_root / "manifest.json"

    if not manifest_path.is_file():
        print(f"::error::Missing manifest {manifest_path}", file=sys.stderr)
        return 1

    manifest = _load_json(manifest_path)

    if not isinstance(manifest, dict):
        print("::error::manifest must be object", file=sys.stderr)
        return 1

    scen_list = manifest.get("scenarios")

    if not isinstance(scen_list, list) or not scen_list:
        print("::error::manifest.scenarios[] required", file=sys.stderr)
        return 1

    rows: list[dict[str, Any]] = []
    worst_recall = 1.0

    for rel in scen_list:
        if not isinstance(rel, str) or not rel.strip():
            continue

        scen_path = corpus_root / rel.strip()

        row = evaluate_scenario(scen_path, corpus_root)
        rows.append(row)
        worst_recall = min(worst_recall, float(row["recall"]))

    if not rows:
        print("::error::no scenarios evaluated", file=sys.stderr)
        return 1

    print("scenario\trecall\tunexpected")
    failed = False

    for row in rows:
        print(
            f'{row["id"]}\t{row["recall"]:.2f}\t{len(row["unexpectedHits"])}',
        )

        if float(row["recall"]) + 1e-9 < float(args.min_recall):
            failed = True
            print(f"::warning::recall<{args.min_recall} for {row['id']} ({row['recall']:.2f})", file=sys.stderr)

        if row["unexpectedHits"]:
            failed = True
            print(f"::warning::unexpected triggers on {row['id']}: {row['unexpectedHits']}", file=sys.stderr)

    worst_line = f"(worst recall {worst_recall:.2f} vs min {float(args.min_recall):.2f})"
    print(worst_line)

    if args.enforce and failed:
        print("::error::corpus enforce failed", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
