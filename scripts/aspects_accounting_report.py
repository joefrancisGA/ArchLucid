#!/usr/bin/env python3
"""ONE Aspects reporting contract: historical, provisional and Git verified stay apart.

This command never infers reviewed LOC from PR merges, Git candidate source,
a workbook projection, or missing evidence. All SMA25 values are recalculated
from published rates, not copied from workbook formula cells. 700 provisional
observations are NOT 700 verified 900-commit snapshots.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
import math
from pathlib import Path
import re
from statistics import mean
from xml.sax.saxutils import escape

ROOT = Path("docs/engineering/aspects-historical")
SHA = re.compile(r"^[0-9a-f]{40}$")
LEGACY_WINDOW = 900
SMA = 25
TOLERANCE = 1e-8


def rows_from(path: Path) -> tuple[list[dict], str]:
    contents = path.read_bytes()
    try:
        records = [json.loads(s) for s in contents.decode("utf-8").splitlines()
                   if s.strip()]
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError(f"{path}: malformed historical JSONL") from exc
    if not records:
        raise ValueError(f"{path}: historical evidence missing")
    return records, hashlib.sha256(contents).hexdigest()


def numeric(value, name: str, *, integer: bool = False):
    if type(value) is bool or not isinstance(value, (float, int)):
        raise ValueError(f"{name}: expected number")
    if not math.isfinite(value) or value < 0:
        raise ValueError(f"{name}: nonfinite or negative")
    if integer and type(value) is not int:
        raise ValueError(f"{name}: expected integer")
    return value


def compute_rate(defects: int, loc: int, reported: float, name: str) -> float:
    numeric(defects, name + " defects", integer=True)
    numeric(loc, name + " LOC", integer=True)
    numeric(reported, name + " rate")
    if loc == 0 or abs(reported - 1000 * defects / loc) > TOLERANCE:
        raise ValueError(f"{name}: defects/unique LOC arithmetic mismatch")
    return 1000 * defects / loc


def calculated_points(rows: list[dict], *, mode: str) -> list[dict]:
    result = []
    for i, row in enumerate(rows):
        if mode == "historical_900":
            if (row.get("excel_row") != i + 6
                    or row.get("window_first_parent_commits") != LEGACY_WINDOW
                    or row.get("provenance") != "historical_workbook_partial_snapshot"
                    or not isinstance(row.get("head_sha"), str)
                    or SHA.fullmatch(row["head_sha"]) is None
                    or not isinstance(row.get("oldest_sha"), str)
                    or SHA.fullmatch(row["oldest_sha"]) is None):
                raise ValueError(f"historical 900 sample {i + 1} not original or malformed")
            d = row["defects_reported"]
            loc = row["unique_loc_reported"]
            rate = compute_rate(d, loc, row["density_per_kloc_reported"], f"900 row {i + 1}")
            iso = row.get("as_of_utc")
            if not isinstance(iso, str):
                raise ValueError("historical snapshot UTC missing")
            try:
                at = datetime.fromisoformat(iso.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError("historical snapshot UTC invalid") from exc
            if at.tzinfo is None or at.utcoffset() != timezone.utc.utcoffset(at):
                raise ValueError("historical snapshot must have UTC timestamp")
            if result and at < datetime.fromisoformat(result[-1]["as_of_utc"]):
                raise ValueError("historical snapshots not chronologically ordered")
            point = {"observation": i + 1, "as_of_utc": at.isoformat(),
                     "head_sha": row["head_sha"], "oldest_sha": row["oldest_sha"],
                     "defects": d, "unique_loc": loc, "defects_per_kloc": rate,
                     "provenance": "historical_workbook_partial_snapshot"}
        else:
            if (row.get("observation") != i + 1
                    or row.get("provenance") not in (
                        "provisional_backprojection_from_600_series_seed",
                        "provisional_600_series_workbook")):
                raise ValueError(f"700 observation {i + 1} identity/provenance mismatch")
            d, loc = row["cumulative_defects"], row["cumulative_loc"]
            rate = compute_rate(d, loc, row["defects_per_kloc"],
                                f"700 observation {i + 1}")
            if (numeric(row.get("defects"), "event defects", integer=True) > d
                    or numeric(row.get("new_unique_loc"), "event LOC", integer=True) > loc):
                raise ValueError("700 event exceeds cumulative count")
            if i:
                if (d - result[-1]["defects"] != row["defects"]
                        or loc - result[-1]["unique_loc"] != row["new_unique_loc"]):
                    raise ValueError(f"700 observation {i+1}: cumulative changes do not match event")
            expected_provenance = ("provisional_backprojection_from_600_series_seed"
                                   if i < 100 else "provisional_600_series_workbook")
            if row["provenance"] != expected_provenance:
                raise ValueError("700 provisional seed/workbook boundary differs")
            point = {"observation": i + 1, "defects": d, "unique_loc": loc,
                     "new_unique_loc_reported": row["new_unique_loc"],
                     "new_defect_observations_reported": row["defects"],
                     "review_or_defect_id": row.get("review_or_defect_id"),
                     "defects_per_kloc": rate,
                     "provenance": row["provenance"]}
        result.append(point)
        if i >= SMA - 1:
            point["sma25_defects_per_kloc"] = mean(
                entry["defects_per_kloc"] for entry in result[-SMA:])
        else:
            point["sma25_defects_per_kloc"] = None
    return result


def verify_600_suffix(provisional: list[dict], historical600: list[dict]) -> None:
    if len(provisional) != 700 or len(historical600) != 600:
        raise ValueError("exact historical 700/600 series required; no manufactured padding")
    for i, row in enumerate(historical600):
        p = provisional[i + 100]
        if (row.get("observation") != i + 1
                or p["observation"] != i + 101
                or p["provenance"] != "provisional_600_series_workbook"
                or p["defects"] != row.get("cumulative_defects")
                or p["unique_loc"] != row.get("cumulative_loc")
                or p["new_unique_loc_reported"] != row.get("new_unique_loc")
                or p["new_defect_observations_reported"] != row.get("defects")
                or p["review_or_defect_id"] != row.get("review_or_defect_id")
                or abs(p["defects_per_kloc"] -
                       compute_rate(row["cumulative_defects"], row["cumulative_loc"],
                                    row["defects_per_kloc_reported"],
                                    f"600 workbook observation {i+1}")) > TOLERANCE):
            raise ValueError(f"700 provisional tail differs from 600 workbook row {i+1}")


def verified_subset(snapshot: dict | None, *, expected_head: str | None = None) -> dict:
    result = {
        "status": "unavailable_no_current_verified_snapshot",
        "scope": "narrow_incremental_review_ledger_subset",
        "current_head": None, "captured_utc": None,
        "oldest_900_first_parent_sha": None,
        "defects_per_kloc": None, "distinct_defect_ids": None,
        "exact_path_blob_unique_reviewed_loc": None,
        "verified_review_rows": None,
        "distinct_review_observations": None,
        "distinct_reviewed_files": None,
        "new_observations_since_prior": None,
        "new_reviewed_loc": None, "new_line_occurrences": None,
        "repeated_reviewed_loc": None, "new_distinct_defect_ids": None,
        "signed_rate_delta": None, "comparison": "unavailable",
        "freshness": "unavailable", "cross_revision_dedup_complete": False,
    }
    if snapshot is None:
        return result
    if (snapshot.get("schema_version") != 2
            or snapshot.get("method") != "first_parent_verified_path_blob_span_union_v2"
            or snapshot.get("scope") != result["scope"]
            or snapshot.get("cohort", {}).get("status") != "complete"
            or snapshot.get("cohort", {}).get("actual_commits") != 900
            or snapshot.get("status") not in ("source_verified_subset", "unavailable")):
        raise ValueError("current Git-verified snapshot not a complete anchored 900 window")
    # Tie every published live number to the SAME exact as-of master-base Git
    # SHA used by the source-verified snapshot. A copied, older snapshot cannot
    # masquerade as today's update merely because its arithmetic is correct.
    observed_head = snapshot.get("head")
    cohort_head = snapshot["cohort"].get("head_sha")
    if (not isinstance(observed_head, str) or SHA.fullmatch(observed_head) is None
            or cohort_head != observed_head
            or (expected_head is not None and observed_head != expected_head)):
        raise ValueError("current verified snapshot Git head differs from exact expected master-base cohort")
    oldest = snapshot["cohort"].get("oldest_included_sha")
    if (not isinstance(oldest, str) or SHA.fullmatch(oldest) is None):
        raise ValueError("current verified snapshot oldest 900 first-parent SHA missing or invalid")
    captured = snapshot.get("captured_utc")
    try:
        captured_at = datetime.fromisoformat(captured.replace("Z", "+00:00"))
    except (AttributeError, ValueError) as exc:
        raise ValueError("current verified snapshot as-of UTC missing or invalid") from exc
    if captured_at.tzinfo is None or captured_at.utcoffset() != timezone.utc.utcoffset(captured_at):
        raise ValueError("current verified snapshot as-of must be UTC")
    d = snapshot["density"]
    reviewed = snapshot["review"]
    loc = numeric(d["unique_path_blob_reviewed_lines"], "verified LOC", integer=True)
    defect_ids = numeric(d["distinct_confirmed_defects"], "verified defect IDs", integer=True)
    rate = d.get("defects_per_kloc")
    if rate is not None:
        numeric(rate, "verified density")
        if loc == 0 or abs(rate - 1000 * defect_ids / loc) > 0.00001:
            raise ValueError("current verified ledger snapshot density disagrees with numerator/denominator")
    comparison = snapshot.get("comparison", {}).get("status")
    # A missing or stale previous comparable snapshot is UNKNOWN, not zero.
    comparable = comparison == "comparable"
    def optional_nonnegative_int(v, name):
        return None if v is None else numeric(v, name, integer=True)
    result.update({
        "status": "source_verified_subset" if rate is not None else "unavailable",
        "current_head": snapshot.get("head"),
        "captured_utc": captured_at.isoformat(),
        "oldest_900_first_parent_sha": oldest,
        "defects_per_kloc": rate,
        "distinct_defect_ids": defect_ids,
        "exact_path_blob_unique_reviewed_loc": loc,
        "verified_review_rows": numeric(reviewed.get("verified_rows"),
                                         "verified review rows", integer=True),
        "distinct_review_observations": numeric(
            reviewed.get("distinct_verified_observations"),
            "distinct verified observations", integer=True),
        "distinct_reviewed_files": numeric(
            reviewed.get("distinct_reviewed_files"),
            "distinct reviewed files", integer=True),
        "new_observations_since_prior": (
            optional_nonnegative_int(reviewed.get("new_observations_since_prior"),
                                     "new observations") if comparable else None),
        "comparison": comparison or "unavailable",
        "freshness": snapshot.get("freshness"),
        "new_reviewed_loc": (
            optional_nonnegative_int(reviewed.get("new_unique_path_blob_lines_since_prior"),
                                     "new reviewed LOC") if comparable else None),
        "new_line_occurrences": (
            optional_nonnegative_int(reviewed.get("new_line_occurrences_since_prior"),
                                     "new line occurrences") if comparable else None),
        "repeated_reviewed_loc": (
            optional_nonnegative_int(reviewed.get("repeated_line_occurrences_since_prior"),
                                     "repeated reviewed LOC") if comparable else None),
        "new_distinct_defect_ids": (
            optional_nonnegative_int(reviewed.get("new_defects_since_prior"),
                                     "new defect IDs") if comparable else None),
        "signed_rate_delta": (
            d.get("signed_delta") if comparable else None),
    })
    if result["distinct_review_observations"] > result["verified_review_rows"]:
        raise ValueError("distinct verified observations exceed reviewed rows")
    if (result["distinct_defect_ids"] > result["verified_review_rows"]
            or result["distinct_reviewed_files"] > result["verified_review_rows"]):
        raise ValueError("defect/file identity counts exceed reviewed observation rows")
    if (comparable and result["new_observations_since_prior"] is not None
            and result["new_observations_since_prior"] >
                result["distinct_review_observations"]):
        raise ValueError("new review observation delta exceeds current observations")
    if comparable and result["freshness"] == "stale_no_new_verified_evidence":
        # A repeat of identical source evidence MUST never be presented as a
        # fresh measurement, even if the Git HEAD or commit window changed.
        if any(result[k] not in (None, 0) for k in (
            "new_observations_since_prior", "new_reviewed_loc",
            "new_line_occurrences", "repeated_reviewed_loc",
            "new_distinct_defect_ids", "signed_rate_delta")):
            raise ValueError("stale verified evidence cannot report new reviews, defects or density change")
    new = result["new_reviewed_loc"]
    repetitions = result["repeated_reviewed_loc"]
    occurrences = result["new_line_occurrences"]
    if (comparable and new is not None and repetitions is not None
            and occurrences is not None and new + repetitions != occurrences):
        raise ValueError("verified reviewed new + repeats must equal new source-line occurrences")
    return result


def build_report(historical: list[dict], provisional: list[dict],
                 workbook600: list[dict], verified: dict | None,
                 *, inputs: dict[str, str] | None = None,
                 expected_head: str | None = None) -> tuple[dict, list[dict], list[dict]]:
    if len(historical) != 79:
        raise ValueError("expected 79 actual historical 900-window snapshots")
    historical_points = calculated_points(historical, mode="historical_900")
    provisional_points = calculated_points(provisional, mode="provisional_700")
    verify_600_suffix(provisional_points, workbook600)
    latest_historical, latest_provisional = historical_points[-1], provisional_points[-1]
    summary = {
        "schema_version": 1,
        "captured_utc": datetime.now(timezone.utc).isoformat(),
        "publication_contract": "three_disjoint_accounting_populations_no_splicing",
        "provenance_sha256": inputs or {},
        "historical_900": {
            "status": "partial_workbook_historical_only",
            "actual_snapshots": len(historical_points),
            "window_first_parent_commits": 900,
            "latest_as_of_utc": latest_historical["as_of_utc"],
            "latest_head_sha": latest_historical["head_sha"],
            "latest_oldest_sha": latest_historical["oldest_sha"],
            "reported_defect_observations": latest_historical["defects"],
            "reported_unique_reviewed_loc": latest_historical["unique_loc"],
            "recomputed_defects_per_kloc": latest_historical["defects_per_kloc"],
            "recomputed_sma25": latest_historical["sma25_defects_per_kloc"],
            "newer_measurement_in_this_run": False,
        },
        "provisional_700": {
            "status": "historical_workbook_backprojection_and_600_series_not_git_verified",
            "observations": len(provisional_points),
            "backprojected_observations": 100,
            "workbook_observations": 600,
            "latest_reported_defect_observations": latest_provisional["defects"],
            "latest_reported_cumulative_new_loc": latest_provisional["unique_loc"],
            "latest_provisional_defects_per_kloc": latest_provisional["defects_per_kloc"],
            "recomputed_sma25": latest_provisional["sma25_defects_per_kloc"],
            "distinct_defect_ids_independently_verified": None,
            "reviewed_loc_independently_verified": None,
            "not_comparable_to_historical_900": True,
        },
        "current_verified_subset": verified_subset(verified, expected_head=expected_head),
        "limits": [
            "79 historical 900-commit capture points are not 700 distinct 900-commit snapshots.",
            "The 700-point series has 100 backprojected and 600 workbook observations, not Git-verified independent reviewed LOC.",
            "Neither historical rate can update the Git-verified population or vice versa.",
            "Current live new/repeated LOC and new defects are null when no valid comparable prior source-verified snapshot exists.",
            "Exact Git path/blob LOC is not yet fully deduplicated across edited and reverted revisions.",
        ],
    }
    return summary, historical_points, provisional_points


def markdown(report: dict) -> str:
    h, p, v = (report["historical_900"], report["provisional_700"],
               report["current_verified_subset"])
    def fmt(x, n=4):
        return "not available" if x is None else f"{x:,.{n}f}"
    def integer(x):
        return "not available" if x is None else f"{x:,}"
    return "\n".join([
        "# Aspects — authoritative accounting update",
        "",
        f"Generated UTC: {report['captured_utc']}",
        "",
        "## Current Git-verified subset (not full codebase)",
        f"- Status: **{v['status']}**; freshness: **{v['freshness']}**",
        f"- Verified Git head: \`{v['current_head'] or 'unavailable'}\`",
        f"- Source-verified as-of UTC: **{v['captured_utc'] or 'unknown'}**",
        f"- Oldest included 900 first-parent SHA: \`{v['oldest_900_first_parent_sha'] or 'unavailable'}\`",
        f"- Verified distinct defect IDs: **{integer(v['distinct_defect_ids'])}**",
        f"- Verified exact path/blob reviewed LOC: **{integer(v['exact_path_blob_unique_reviewed_loc'])}**",
        f"- Source-verified review rows / distinct observations: **{integer(v['verified_review_rows'])} / {integer(v['distinct_review_observations'])}**",
        f"- Distinct reviewed source files: **{integer(v['distinct_reviewed_files'])}**",
        f"- Subset defect density: **{fmt(v['defects_per_kloc'])} defects/KLOC**",
        f"- Prior comparable capture: **{v['comparison']}**",
        f"- Newly verified review observations: **{integer(v['new_observations_since_prior'])}**",
        f"- Newly verified unique LOC: **{integer(v['new_reviewed_loc'])}**",
        f"- Repeated LOC in new verified observations: **{integer(v['repeated_reviewed_loc'])}**",
        f"- New verified source-line occurrences: **{integer(v['new_line_occurrences'])}**",
        f"- Newly confirmed distinct defect IDs: **{integer(v['new_distinct_defect_ids'])}**",
        f"- Density change against comparable prior: **{fmt(v['signed_rate_delta'])}**",
        "",
        "## Historical 900-commit workbook checkpoints — partial, separate",
        f"- Actual recorded snapshot points: **{h['actual_snapshots']}** (not 700)",
        f"- Last capture: \`{h['latest_as_of_utc']}\` at \`{h['latest_head_sha']}\`",
        f"- Recorded defects / reported unique LOC: **{h['reported_defect_observations']:,} / {h['reported_unique_reviewed_loc']:,}**",
        f"- Recalculated rate: **{fmt(h['recomputed_defects_per_kloc'])} defects/KLOC**",
        f"- Recalculated SMA25: **{fmt(h['recomputed_sma25'])} defects/KLOC**",
        "- This is an unchanged historical observation, NOT today's current verified rate.",
        "",
        "## Historical 700-observation chart — provisional, separate",
        f"- **{p['observations']}** observations: {p['backprojected_observations']} backprojected + {p['workbook_observations']} workbook",
        f"- Last reported defects / cumulative incremental LOC: **{p['latest_reported_defect_observations']:,} / {p['latest_reported_cumulative_new_loc']:,}**",
        f"- Provisional rate: **{fmt(p['latest_provisional_defects_per_kloc'])} defects/KLOC**",
        f"- SMA25: **{fmt(p['recomputed_sma25'])} defects/KLOC**",
        "- This series is not a set of verified 900-commit snapshots.",
        "",
        "## Accounting boundary",
        "The three populations are never added, blended or substituted. No missing points are invented.",
        "If there is no prior comparable verified snapshot, fresh LOC/defect counts are **unknown**, not zero.",
        "The full contemporaneous cross-revision 900-commit denominator and distinct-discovery census remain unverified.",
        "",
    ])


def csv_points(points: list[dict]) -> str:
    fields = (["observation", "defects", "unique_loc", "defects_per_kloc",
               "sma25_defects_per_kloc", "provenance"])
    if "as_of_utc" in points[0]:
        fields += ["as_of_utc", "head_sha", "oldest_sha"]
    else:
        fields += ["new_unique_loc_reported", "new_defect_observations_reported",
                   "review_or_defect_id"]
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for point in points:
        writer.writerow(point)
    return out.getvalue()


def svg_chart(points: list[dict]) -> str:
    """Dependency-free static chart of 700 PROVISIONAL observations and 25-SMA."""
    if len(points) != 700:
        raise ValueError("no fake 700-point chart")
    width, height = 1080, 450
    left, right, top, bottom = 75, 40, 74, 55
    w, h = width - left - right, height - top - bottom
    vals = [p["defects_per_kloc"] for p in points]
    avgs = [p["sma25_defects_per_kloc"] for p in points
            if p["sma25_defects_per_kloc"] is not None]
    lo, hi = min(vals + avgs), max(vals + avgs)
    pad = max(0.006, (hi - lo) * 0.08)
    lo -= pad
    hi += pad
    def xy(i, val):
        return (left + w * i / (len(points) - 1),
                top + h * (hi - val) / (hi - lo))
    def coord_line(items):
        return " ".join(f"{xy(i,v)[0]:.1f},{xy(i,v)[1]:.1f}"
                        for i,v in items)
    raw = coord_line([(i, v) for i,v in enumerate(vals)])
    smooth = coord_line([(i,p["sma25_defects_per_kloc"])
                         for i,p in enumerate(points)
                         if p["sma25_defects_per_kloc"] is not None])
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#fcfcfd"/>',
        '<text x="75" y="29" font-family="sans-serif" font-size="21" fill="#14213d" font-weight="bold">Aspects — 700 historical provisional observations</text>',
        '<text x="75" y="51" font-family="sans-serif" font-size="12" fill="#6b7280">100 backprojected + 600 workbook points · NOT 700 independently verified snapshots</text>',
    ]
    for j in range(5):
        yy = top + j*h/4
        rate = hi - j*(hi-lo)/4
        lines += [f'<line x1="{left}" y1="{yy:.1f}" x2="{width-right}" y2="{yy:.1f}" stroke="#e5e7eb"/>',
                  f'<text x="{left-9}" y="{yy+4:.1f}" text-anchor="end" font-size="12" font-family="sans-serif" fill="#374151">{rate:.3f}</text>']
    lines += [
        f'<line x1="{left+w*100/699:.1f}" y1="{top}" x2="{left+w*100/699:.1f}" y2="{top+h}" stroke="#94a3b8" stroke-dasharray="4 4"/>',
        f'<polyline points="{raw}" fill="none" stroke="#94a3b8" stroke-width="1.45"/>',
        f'<polyline points="{smooth}" fill="none" stroke="#164e9f" stroke-width="2.8"/>',
        f'<text x="{left}" y="{height-23}" font-family="sans-serif" fill="#374151" font-size="12">1</text>',
        f'<text x="{left+w*100/699:.1f}" y="{height-23}" font-family="sans-serif" fill="#374151" font-size="12">101</text>',
        f'<text x="{width-right}" y="{height-23}" font-family="sans-serif" fill="#374151" font-size="12" text-anchor="end">700</text>',
        f'<text x="{width-right}" y="{height-5}" font-family="sans-serif" fill="#164e9f" font-size="12" text-anchor="end">25-point simple moving average</text>',
        '</svg>',
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--historical-900", type=Path,
                   default=ROOT/"aspects-historical-900-snapshots.jsonl")
    p.add_argument("--provisional-700", type=Path,
                   default=ROOT/"aspects-provisional-700-series.jsonl")
    p.add_argument("--historical-600", type=Path,
                   default=ROOT/"aspects-provisional-600-series.jsonl")
    p.add_argument("--verified-snapshot", type=Path, default=None)
    p.add_argument("--expected-head", default=None,
                   help="Exact master-base head expected in source-verified snapshot")
    p.add_argument("--json-out", required=True, type=Path)
    p.add_argument("--markdown-out", required=True, type=Path)
    p.add_argument("--700-csv-out", required=True, type=Path)
    p.add_argument("--900-csv-out", required=True, type=Path)
    p.add_argument("--700-svg-out", required=True, type=Path)
    args = p.parse_args()
    historical, sha79 = rows_from(args.historical_900)
    provisional, sha700 = rows_from(args.provisional_700)
    workbook600, sha600 = rows_from(args.historical_600)
    verified = None
    if args.verified_snapshot is not None:
        if not args.verified_snapshot.exists():
            raise ValueError("explicit verified snapshot file missing")
        verified = json.loads(args.verified_snapshot.read_text(encoding="utf-8"))
    report, rows79, rows700 = build_report(
        historical, provisional, workbook600, verified,
        inputs={"historical_900_sha256":sha79, "provisional_700_sha256":sha700,
                "historical_600_sha256":sha600},
        expected_head=args.expected_head)
    outputs = {
        args.json_out:json.dumps(report,sort_keys=True,indent=2)+"\n",
        args.markdown_out:markdown(report),
        args.__dict__["700_csv_out"]:csv_points(rows700),
        args.__dict__["900_csv_out"]:csv_points(rows79),
        args.__dict__["700_svg_out"]:svg_chart(rows700),
    }
    for path, contents in outputs.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(contents,encoding="utf-8")
    print(json.dumps({"status":"three_disjoint_accounting_populations_validated",
                      "historical900_points":len(rows79),
                      "provisional700_points":len(rows700),
                      "latest_historical_density":report["historical_900"]["recomputed_defects_per_kloc"],
                      "latest_provisional_density":report["provisional_700"]["latest_provisional_defects_per_kloc"],
                      "verified_subset_status":report["current_verified_subset"]["status"]},
                     sort_keys=True))


if __name__=="__main__":
    main()
