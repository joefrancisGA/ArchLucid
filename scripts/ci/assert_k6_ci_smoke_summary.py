#!/usr/bin/env python3
"""Fail CI if k6 summary-export JSON exceeds http_req_failed rate or p(95) latency.

Supports modes:
  1. **Global** (default): checks overall ``http_req_duration`` p(95) against ``--max-p95-ms``.
  2. **Per-tag CI smoke** (``--per-tag-ci-smoke``): checks per-``k6ci`` tag p(95) against caps
     matching ``tests/load/ci-smoke.js``. Falls back to global if tagged metrics are absent.
  3. **Per-tag operator path / Core Pilot smoke** (``--per-tag-k6-api-smoke``): checks per-``k6api``
     tag against caps matching ``tests/load/k6-api-smoke.js`` (respects
     ``ARCHLUCID_K6_OPERATOR_MINIMAL`` — omit extended caps when minimal).

Caps for modes **2** and **3** follow ``ARCHLUCID_K6_P95_*`` env overrides when set (same names as workflows).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Per-tag p95 caps (ms) — MUST stay aligned with defaults in tests/load/ci-smoke.js P95_MS and
# ARCHLUCID_K6_* env overrides used by .github/workflows/ci.yml (see docs/library/API_SLOS.md tiers).
_CI_SMOKE_TAG_CAPS: dict[str, float] = {
    "http_req_duration{k6ci:health_live}": 300.0,
    "http_req_duration{k6ci:health_ready}": 1200.0,
    "http_req_duration{k6ci:create_run}": 6600.0,
    "http_req_duration{k6ci:list_runs}": 928.0,
    "http_req_duration{k6ci:audit_search}": 928.0,
    "http_req_duration{k6ci:version}": 928.0,
    "http_req_duration{k6ci:list_for_get_run}": 928.0,
    "http_req_duration{k6ci:get_run_detail}": 928.0,
    "http_req_duration{k6ci:client_error_telemetry}": 928.0,
}


def _env_float(key: str, default: str) -> float:
    raw = os.environ.get(key)
    if raw is None or raw.strip() == "":
        return float(default)
    return float(raw)


def _k6_api_smoke_tag_caps() -> dict[str, float]:
    """Caps for tests/load/k6-api-smoke.js — MUST stay aligned with that script's P95_MS + thresholds."""
    tier2 = _env_float("ARCHLUCID_K6_P95_TIER2_MS", "800")
    tier3 = _env_float("ARCHLUCID_K6_P95_TIER3_MS", "8000")
    hr = _env_float("ARCHLUCID_K6_P95_HEALTH_READY_MS", "1200")
    seed_raw = os.environ.get("ARCHLUCID_K6_P95_SEED_FAKE_MS")
    seed = float(seed_raw) if seed_raw not in (None, "") else tier3
    commit_raw = os.environ.get("ARCHLUCID_K6_P95_COMMIT_MS")
    commit = float(commit_raw) if commit_raw not in (None, "") else tier3
    caps: dict[str, float] = {
        "http_req_duration{k6api:health_ready}": hr,
        "http_req_duration{k6api:version}": tier2,
        "http_req_duration{k6api:create_run}": tier3,
        "http_req_duration{k6api:list_authority_runs}": tier2,
    }
    minimal_raw = os.environ.get("ARCHLUCID_K6_OPERATOR_MINIMAL", "")
    minimal = minimal_raw.strip() in ("1", "true", "True")

    if not minimal:
        caps["http_req_duration{k6api:run_status}"] = tier2
        caps["http_req_duration{k6api:seed_fake}"] = seed
        caps["http_req_duration{k6api:pilot_commit}"] = commit
        caps["http_req_duration{k6api:artifacts_list}"] = tier2

    return caps


def _metric_values(payload: dict, metric_name: str) -> dict:
    metrics = payload.get("metrics")
    if not isinstance(metrics, dict):
        return {}

    block = metrics.get(metric_name)
    if not isinstance(block, dict):
        return {}

    values = block.get("values")
    if isinstance(values, dict):
        return values

    trend_keys = ("rate", "count", "med", "p(50)", "p(95)", "p(99)")
    return {key: block[key] for key in trend_keys if key in block}


def _float(values: dict, *keys: str) -> float | None:
    for key in keys:
        if key in values and values[key] is not None:
            try:
                return float(values[key])
            except (TypeError, ValueError):
                return None
    return None


def _check_per_tag(
    payload: dict,
    errors: list[str],
    caps: dict[str, float],
) -> bool:
    """Check per-tag p95 caps. Returns True if at least one tagged metric was found."""
    found_any = False

    for metric_name, cap_ms in caps.items():
        values = _metric_values(payload, metric_name)
        p95 = _float(values, "p(95)")

        if p95 is None:
            continue

        found_any = True

        if p95 > cap_ms + 1e-9:
            errors.append(
                f"{metric_name} p(95) {p95:.1f} ms exceeds cap {cap_ms:.0f} ms",
            )

    return found_any


def _print_k6_api_budget_summary(payload: dict, caps: dict[str, float]) -> None:
    """One-line-per-tag summary for job logs (pass uses measured p95 vs cap)."""
    print("Core Pilot operator-path smoke budget (CI/pilot; not contractual SLOs):")

    for metric_name in sorted(caps.keys()):
        cap_ms = caps[metric_name]
        values = _metric_values(payload, metric_name)
        p95 = _float(values, "p(95)")

        if p95 is None:
            print(f"  {metric_name}: no samples — SKIP")
            continue

        status = "PASS" if p95 <= cap_ms + 1e-9 else "FAIL"
        print(f"  {metric_name}: p(95)={p95:.1f} ms cap={cap_ms:.0f} ms [{status}]")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("summary_json", type=Path, help="k6 --summary-export JSON path")
    parser.add_argument(
        "--max-failed-rate",
        type=float,
        default=0.0,
        help="Maximum allowed http_req_failed rate (default: 0 — no failed checks)",
    )
    parser.add_argument(
        "--max-p95-ms",
        type=float,
        default=1500.0,
        help="Maximum allowed global http_req_duration p(95) in ms (fallback when --per-tag-ci-smoke tags are missing)",
    )
    parser.add_argument(
        "--per-tag-ci-smoke",
        action="store_true",
        default=False,
        help="Enforce per-k6ci-tag p95 caps matching tests/load/ci-smoke.js thresholds; falls back to global --max-p95-ms if tags are absent",
    )
    parser.add_argument(
        "--per-tag-k6-api-smoke",
        action="store_true",
        default=False,
        help="Enforce per-k6api-tag p95 caps matching tests/load/k6-api-smoke.js (honours ARCHLUCID_K6_OPERATOR_MINIMAL)",
    )
    args = parser.parse_args()

    if args.per_tag_ci_smoke and args.per_tag_k6_api_smoke:
        print(
            "error: --per-tag-ci-smoke and --per-tag-k6-api-smoke are mutually exclusive",
            file=sys.stderr,
        )
        return 2

    path: Path = args.summary_json
    if not path.is_file():
        print(f"error: missing k6 summary file: {path}", file=sys.stderr)
        return 2

    payload = json.loads(path.read_text(encoding="utf-8"))
    failed = _metric_values(payload, "http_req_failed")

    failed_rate = _float(failed, "rate")

    errors: list[str] = []

    if failed_rate is not None and failed_rate > args.max_failed_rate + 1e-12:
        errors.append(
            f"http_req_failed rate {failed_rate:.6f} exceeds cap {args.max_failed_rate:.6f}",
        )

    if args.per_tag_ci_smoke:
        found = _check_per_tag(payload, errors, _CI_SMOKE_TAG_CAPS)

        if not found:
            print(
                "warning: --per-tag-ci-smoke requested but no tagged metrics found; "
                "falling back to global --max-p95-ms",
                file=sys.stderr,
            )
            duration = _metric_values(payload, "http_req_duration")
            p95_ms = _float(duration, "p(95)")

            if p95_ms is not None and p95_ms > args.max_p95_ms + 1e-9:
                errors.append(
                    f"http_req_duration p(95) {p95_ms:.1f} ms exceeds cap {args.max_p95_ms:.0f} ms (global fallback)",
                )
    elif args.per_tag_k6_api_smoke:
        caps = _k6_api_smoke_tag_caps()
        found = _check_per_tag(payload, errors, caps)

        if not found:
            print(
                "warning: --per-tag-k6-api-smoke requested but no k6api tagged metrics found; "
                "falling back to global --max-p95-ms",
                file=sys.stderr,
            )
            duration = _metric_values(payload, "http_req_duration")
            p95_ms = _float(duration, "p(95)")

            if p95_ms is not None and p95_ms > args.max_p95_ms + 1e-9:
                errors.append(
                    f"http_req_duration p(95) {p95_ms:.1f} ms exceeds cap {args.max_p95_ms:.0f} ms (global fallback)",
                )
        elif not errors:
            _print_k6_api_budget_summary(payload, caps)
    else:
        duration = _metric_values(payload, "http_req_duration")
        p95_ms = _float(duration, "p(95)")

        if p95_ms is not None and p95_ms > args.max_p95_ms + 1e-9:
            errors.append(
                f"http_req_duration p(95) {p95_ms:.1f} ms exceeds cap {args.max_p95_ms:.0f} ms",
            )

    if errors:
        print("k6 smoke gate failed:", file=sys.stderr)
        for line in errors:
            print(f"  - {line}", file=sys.stderr)
        return 1

    if args.per_tag_ci_smoke:
        mode = "per-tag-ci-smoke"
    elif args.per_tag_k6_api_smoke:
        mode = "per-tag-k6-api-smoke"
    else:
        mode = "global"

    print(f"k6 smoke gate OK ({mode}; http_req_failed rate={failed_rate!s})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
