#!/usr/bin/env python3
"""Summarize downloaded hosted-saas-probe probe-result.json artifacts (local files only).

Reads JSON payloads (workflow artifact shape), optional CSV, or a directory of *.json.
Produces a text or markdown rollup. Does not call GitHub, Azure, or other network APIs.

Canonical SLO *targets* are documented in docs/library/API_SLOS.md and docs/library/SLA_TARGETS.md;
this script only *quotes* the published target for comparison — never as a contractual achievement.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

# Published customer-visible availability target (30-day narrative) — keep in sync with API_SLOS / SLA_TARGETS.
TARGET_AVAILABILITY_SLO_PERCENT = 99.9
TARGET_SLO_WINDOW_LABEL = "30-day rolling / monthly (per API_SLOS.md / SLA_TARGETS.md)"


@dataclass(frozen=True)
class RollupModel:
    """Computed rollup suitable for text or markdown rendering."""

    environment_label: str
    window_start_utc: str | None
    window_end_utc: str | None
    total_rows: int
    skipped_count: int
    attempted_count: int
    both_ok_count: int
    failed_probe_count: int
    uptime_percent_of_attempted: float | None
    target_slo_percent: float
    target_slo_window_label: str
    caveats: tuple[str, ...] = field(default_factory=tuple)


def load_payload(path: Path) -> dict:
    if path is None:
        raise ValueError("path is required")

    return json.loads(path.read_text(encoding="utf-8"))


def load_rows_from_csv(path: Path) -> list[dict]:
    """Load CSV with header: probedAtUtc,skipped,live_ok,ready_ok,baseUrl (baseUrl optional)."""

    rows_out: list[dict] = []

    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)

        if reader.fieldnames is None:
            return rows_out

        for raw in reader:
            row: dict = {
                "probedAtUtc": (raw.get("probedAtUtc") or "").strip(),
                "skipped": _parse_bool(raw.get("skipped")),
                "live_ok": _parse_bool(raw.get("live_ok")),
                "ready_ok": _parse_bool(raw.get("ready_ok")),
            }
            base_url = raw.get("baseUrl")

            if base_url is not None and str(base_url).strip() != "":
                row["baseUrl"] = str(base_url).strip()

            rows_out.append(row)

    return rows_out


def _parse_bool(value: object | None) -> bool | None:
    if value is None or value == "":
        return None

    s = str(value).strip().lower()

    if s in ("true", "1", "yes"):
        return True

    if s in ("false", "0", "no"):
        return False

    return None


def _environment_hint_for_base_url(base_url: str | None) -> str | None:
    """Return staging | production | unknown for one URL, or None if no URL."""

    if base_url is None or not str(base_url).strip():
        return None

    parsed = urlparse(str(base_url).strip())
    host = (parsed.hostname or "").lower()

    if not host:
        return "unknown"

    if "staging" in host:
        return "staging"

    if "prod" in host or "production" in host:
        return "production"

    if host.endswith(".archlucid.net") and "staging" not in host:
        return "production"

    return "unknown"


def infer_environment(rows: list[dict]) -> tuple[str, list[str]]:
    """Consensus environment: staging | production | unknown. Secondary caveats if ambiguous."""

    caveats: list[str] = []
    hints: list[str] = []

    for row in rows:
        if row.get("skipped"):
            continue

        hint = _environment_hint_for_base_url(row.get("baseUrl"))

        if hint is not None:
            hints.append(hint)

    if not hints:
        return "unknown", ["No non-skipped probes with baseUrl; environment cannot be inferred."]

    unique = sorted(set(hints))

    if len(unique) > 1:
        caveats.append(
            "Mixed environment hints from baseUrl values; labeled unknown — do not "
            "treat as a single-environment sample or as production evidence."
        )
        return "unknown", caveats

    env = unique[0]

    if env == "unknown":
        caveats.append("baseUrl host did not match staging/production heuristics — verify manually.")

    return env, caveats


def _window_bounds(rows: list[dict]) -> tuple[str | None, str | None]:
    stamps = [str(r.get("probedAtUtc") or "").strip() for r in rows if str(r.get("probedAtUtc") or "").strip()]

    if not stamps:
        return None, None

    return min(stamps), max(stamps)


def build_rollup(rows: list[dict]) -> RollupModel:
    """Aggregate probes into a RollupModel."""

    if rows is None:
        raise ValueError("rows is required")

    env, env_caveats = infer_environment(rows)
    start, end = _window_bounds(rows)
    skipped = sum(1 for r in rows if r.get("skipped"))
    attempted = sum(1 for r in rows if not r.get("skipped"))
    both_ok = sum(
        1
        for r in rows
        if not r.get("skipped") and r.get("live_ok") is True and r.get("ready_ok") is True
    )
    failed = attempted - both_ok
    uptime: float | None = (100.0 * both_ok / attempted) if attempted else None

    caveats: list[str] = list(env_caveats)

    if env == "staging":
        caveats.append(
            "Staging probes must not be presented to buyers as production availability evidence."
        )

    if attempted == 0:
        caveats.append(
            "No attempted probes in this window — uptime does not apply; gather non-skipped runs."
        )
    elif both_ok < attempted:
        caveats.append(
            "Some runs failed live/ready checks; investigate failing probe-result.json rows before any external summary."
        )

    if skipped and attempted:
        caveats.append(
            f"{skipped} run(s) were skipped (e.g. unset ARCHLUCID_STAGING_BASE_URL); excluded from uptime denominator."
        )

    caveats.append(
        "This rollup is synthetic hosted-probe evidence only — not a contractual SLA, not multi-region, "
        "and not a substitute for Prometheus / production error-budget reporting."
    )

    return RollupModel(
        environment_label=env,
        window_start_utc=start,
        window_end_utc=end,
        total_rows=len(rows),
        skipped_count=skipped,
        attempted_count=attempted,
        both_ok_count=both_ok,
        failed_probe_count=failed,
        uptime_percent_of_attempted=uptime,
        target_slo_percent=TARGET_AVAILABILITY_SLO_PERCENT,
        target_slo_window_label=TARGET_SLO_WINDOW_LABEL,
        caveats=tuple(caveats),
    )


def collect_json_paths(paths: list[Path]) -> list[Path]:
    """Expand files and directories (recursive *.json) into a sorted file list."""

    out: list[Path] = []

    for p in paths:
        if p.is_dir():
            out.extend(sorted(p.rglob("*.json")))
        else:
            out.append(p)

    return sorted({q.resolve(): q for q in out}.values())


def load_rows_from_json_paths(paths: list[Path]) -> list[dict]:
    rows: list[dict] = []

    for path in collect_json_paths(paths):
        rows.append(load_payload(path))

    return rows


def read_stdin_rows() -> list[dict]:
    rows: list[dict] = []

    for line in sys.stdin:
        line = line.strip()

        if not line:
            continue

        rows.append(json.loads(line))

    return rows


def render_text(model: RollupModel) -> str:
    lines = [
        f"environment: {model.environment_label}",
        f"window_utc: {model.window_start_utc or 'n/a'} .. {model.window_end_utc or 'n/a'}",
        f"rows_total: {model.total_rows}",
        f"skipped_no_base_url: {model.skipped_count}",
        f"attempted_probe: {model.attempted_count}",
        f"both_endpoints_ok: {model.both_ok_count}",
        f"failed_probe: {model.failed_probe_count}",
        f"target_availability_slo_percent (published target, not claimed achieved): {model.target_slo_percent}",
        f"target_slo_window: {model.target_slo_window_label}",
    ]

    if model.uptime_percent_of_attempted is not None:
        lines.append(f"achieved_uptime_percent_of_attempted_probes: {model.uptime_percent_of_attempted:.4f}")
    else:
        lines.append("achieved_uptime_percent_of_attempted_probes: n/a (insufficient attempted probes)")

    lines.append("caveats:")

    for c in model.caveats:
        lines.append(f"- {c}")

    return "\n".join(lines) + "\n"


def render_markdown(model: RollupModel) -> str:
    """Buyer-safe markdown: never states contractual SLA achievement."""

    uptime_line = (
        f"{model.uptime_percent_of_attempted:.4f}%"
        if model.uptime_percent_of_attempted is not None
        else "**n/a** (no attempted probes — insufficient data)"
    )

    lines = [
        "# Hosted SaaS probe availability rollup",
        "",
        "> **Not a contractual SLA.** This artifact summarizes scheduled HTTP probes only. "
        "It does **not** assert that ArchLucid met any negotiated availability commitment.",
        "",
        "## Scope",
        "",
        f"- **Environment (inferred):** **{model.environment_label}**",
        f"- **Time window (UTC, from probe timestamps):** "
        f"`{model.window_start_utc or 'n/a'}` → `{model.window_end_utc or 'n/a'}`",
        "",
        "## Target SLO (documentation reference only)",
        "",
        f"- **Published availability target:** **{model.target_slo_percent}%** "
        f"({model.target_slo_window_label})",
        "- **Relation to this rollup:** targets above are **not** automatically satisfied by these probes; "
        "compare **achieved probe results** separately.",
        "",
        "## Achieved probe results (this window)",
        "",
        "| Metric | Value |",
        "|--------|-------|",
        f"| Total artifact rows | {model.total_rows} |",
        f"| Skipped runs (no base URL / workflow skip) | {model.skipped_count} |",
        f"| Attempted probes | {model.attempted_count} |",
        f"| Both `/health/live` and `/health/ready` OK | {model.both_ok_count} |",
        f"| Failed probes (attempted − both OK) | {model.failed_probe_count} |",
        f"| **Uptime % (of attempted probes only)** | {uptime_line} |",
        "",
        "## Caveats",
        "",
    ]

    for c in model.caveats:
        lines.append(f"- {c}")

    lines.extend(
        [
            "",
            "## Methodology",
            "",
            "See `docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md` and `.github/workflows/hosted-saas-probe.yml` "
            "(repository-relative paths).",
            "",
        ]
    )

    return "\n".join(lines) + "\n"


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "paths",
        nargs="*",
        type=Path,
        help="probe-result.json files and/or directories of JSON; if empty with no --csv, read stdin (one JSON object per line)",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=None,
        help="optional CSV path (probedAtUtc,skipped,live_ok,ready_ok[,baseUrl]) instead of JSON paths",
    )
    parser.add_argument(
        "--format",
        choices=("markdown", "text"),
        default="markdown",
        help="output format (default: markdown)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="write rollup to this file (UTF-8); default: stdout",
    )
    ns = parser.parse_args(argv)

    if ns.csv is not None:
        rows = load_rows_from_csv(ns.csv)
    elif ns.paths:
        rows = load_rows_from_json_paths(ns.paths)
    else:
        rows = read_stdin_rows()

    model = build_rollup(rows)

    if ns.format == "markdown":
        body = render_markdown(model)
    else:
        body = render_text(model)

    if ns.output is not None:
        ns.output.parent.mkdir(parents=True, exist_ok=True)
        ns.output.write_text(body, encoding="utf-8")
    else:
        sys.stdout.write(body)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
