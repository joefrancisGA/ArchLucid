#!/usr/bin/env python3
"""
Emit a Markdown readiness report for OpenTelemetry metric export configuration (repo-local, no network).

Evaluates whether ArchLucid.Api and ArchLucid.Worker have at least one durable export path enabled:
  Application Insights connection string, OTLP endpoint, or Prometheus scrape.

Sources JSON the same order as hosts load files (Api: base, environment, Advanced, SaaS; Worker: base, environment).
Optionally overlays process environment variables using ASP.NET Core's double-underscore key shape (values never printed).
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]

API_DIR = REPO_ROOT / "ArchLucid.Api"
WORKER_DIR = REPO_ROOT / "ArchLucid.Worker"

AGENT_OUTPUT_METRICS: tuple[tuple[str, str], ...] = (
    (
        "archlucid_agent_output_structural_completeness_ratio",
        "Histogram - fraction of expected `AgentResult` JSON keys present (`agent_type`).",
),
    (
        "archlucid_agent_output_semantic_score",
        "Histogram - deterministic semantic quality 0.0-1.0 (`agent_type`).",
),
    (
        "archlucid_agent_output_quality_gate_total",
        "Counter - gate outcomes `accepted` / `warned` / `rejected` (`agent_type`, `outcome`, `gate_mode`).",
),
    (
        "archlucid_agent_output_parse_failures_total",
        "Counter - invalid JSON or non-object `ParsedResultJson` (`agent_type`).",
),
    (
        "archlucid_agent_trace_blob_upload_failures_total",
        "Counter - trace blob exhausted retries (`agent_type`, `blob_type`).",
),
)

CONFIG_KEYS_DOC = (
    "**Application Insights (any one non-empty):** `APPLICATIONINSIGHTS_CONNECTION_STRING`, "
    "`ApplicationInsights:ConnectionString`, `Observability:AzureMonitor:ApplicationInsightsConnectionString`. | "
    "**OTLP:** non-empty `Observability:Otlp:Endpoint` (absolute URI) and `Observability:Otlp:Enabled` not `false`. | "
    "**Prometheus:** `Observability:Prometheus:Enabled` = `true` (scrape endpoint; see `Observability:Prometheus:ScrapePath`)."
)


def deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = dict(base)

    for key, val in override.items():
        existing = out.get(key)

        if isinstance(existing, dict) and isinstance(val, dict):
            out[key] = deep_merge(existing, val)
            continue

        out[key] = val

    return out


def load_merged_json_objects(paths: Iterable[Path]) -> tuple[dict[str, Any], list[str]]:
    merged: dict[str, Any] = {}
    errors: list[str] = []

    for path in paths:
        if not path.is_file():
            errors.append(f"not found: {path}")
            continue

        raw = path.read_text(encoding="utf-8")

        try:
            obj = json.loads(raw)
        except json.JSONDecodeError as ex:
            errors.append(f"{path}: JSON error: {ex}")
            continue

        if not isinstance(obj, dict):
            errors.append(f"{path}: expected JSON object root")
            continue

        merged = deep_merge(merged, obj)

    return merged, errors


def _coerce_leaf_key(parent_path: str, value: str) -> Any:
    leaf = parent_path.split("__")[-1] if "__" in parent_path else parent_path

    if leaf.lower() == "enabled":
        v = value.strip().lower()

        if v in ("true", "1", "yes"):
            return True

        if v in ("false", "0", "no"):
            return False

    if leaf.lower() == "samplingratio":
        try:
            return float(value.strip())
        except ValueError:
            return value

    return value


def _set_nested(target: dict[str, Any], parts: list[str], value: Any) -> None:
    cursor: dict[str, Any] = target

    for part in parts[:-1]:
        nxt = cursor.get(part)

        if not isinstance(nxt, dict):
            nxt = {}
            cursor[part] = nxt

        cursor = nxt

    cursor[parts[-1]] = value


def environment_variables_as_config_layer() -> dict[str, Any]:
    """Build a nested dict from process env (double-underscore keys). Never log values."""
    tree: dict[str, Any] = {}

    for key, raw in os.environ.items():
        if key == "APPLICATIONINSIGHTS_CONNECTION_STRING" and raw.strip():
            tree[key] = raw.strip()
            continue

        if "__" not in key:
            continue

        parts = key.split("__")

        if len(parts) < 2:
            continue

        coerced = _coerce_leaf_key(key, raw)
        _set_nested(tree, parts, coerced)

    return tree


def get_colon(cfg: dict[str, Any], path: str) -> Any:
    cur: Any = cfg

    for segment in path.split(":"):
        if not isinstance(cur, dict):
            return None

        cur = cur.get(segment)

    return cur


def _non_empty_str(val: Any) -> bool:
    return isinstance(val, str) and val.strip() != ""


def _truthy_json(val: Any) -> bool:
    if val is True:
        return True

    if isinstance(val, str) and val.strip().lower() in ("true", "1", "yes"):
        return True

    return False


def analyze_export_paths(cfg: dict[str, Any]) -> tuple[list[str], list[str]]:
    """
    Returns (active_path_labels, warnings_or_notes).

    When at least one durable path is active, omit nag warnings for the other paths so release
    operators get a clean pass signal. When none are active, return detailed remediation lines.
    Console exporter is ignored - not a durable backend for metric export readiness.
    """
    active: list[str] = []
    detail_lines: list[str] = []

    ai_raw = (
        get_colon(cfg, "APPLICATIONINSIGHTS_CONNECTION_STRING"),
        get_colon(cfg, "ApplicationInsights:ConnectionString"),
        get_colon(cfg, "Observability:AzureMonitor:ApplicationInsightsConnectionString"),
    )

    if any(_non_empty_str(x) for x in ai_raw):
        active.append("Application Insights (`APPLICATIONINSIGHTS_CONNECTION_STRING` / `ApplicationInsights:ConnectionString` / `Observability:AzureMonitor:ApplicationInsightsConnectionString`)")
    else:
        detail_lines.append(
            "No Application Insights connection string - set one of: `APPLICATIONINSIGHTS_CONNECTION_STRING`, "
            "`ApplicationInsights:ConnectionString`, `Observability:AzureMonitor:ApplicationInsightsConnectionString`."
        )

    otlp_endpoint = get_colon(cfg, "Observability:Otlp:Endpoint")
    otlp_enabled_override = get_colon(cfg, "Observability:Otlp:Enabled")
    endpoint_ok = _non_empty_str(otlp_endpoint)

    otlp_kill_switch = otlp_enabled_override is False or (
        isinstance(otlp_enabled_override, str) and otlp_enabled_override.strip().lower() in ("false", "0", "no")
    )

    if endpoint_ok and not otlp_kill_switch:
        active.append("OTLP (`Observability:Otlp:Endpoint` + `Observability:Otlp:Enabled` not false)")
    elif not endpoint_ok:
        detail_lines.append(
            "OTLP not configured - set non-empty `Observability:Otlp:Endpoint` (absolute URI) and ensure "
            "`Observability:Otlp:Enabled` is not `false`."
        )
    elif otlp_kill_switch:
        detail_lines.append(
            "OTLP endpoint is set but export is disabled - `Observability:Otlp:Enabled` is false (remove kill-switch or clear endpoint)."
        )

    prom_enabled = _truthy_json(get_colon(cfg, "Observability:Prometheus:Enabled"))

    if prom_enabled:
        active.append("Prometheus scrape (`Observability:Prometheus:Enabled` = true)")
    else:
        detail_lines.append(
            "Prometheus scrape off - set `Observability:Prometheus:Enabled` true and expose scrape only on "
            "trusted networks (keep `RequireScrapeAuthentication` on for edge exposure — see `OBSERVABILITY.md`)."
        )

    if active:
        return active, []

    warnings: list[str] = [
        "**No durable metric export path is active** from merged configuration - agent-output metrics stay in-process.",
    ]
    warnings.extend(detail_lines)

    return active, warnings


def api_config_paths(env: str) -> list[Path]:
    return [
        API_DIR / "appsettings.json",
        API_DIR / f"appsettings.{env}.json",
        API_DIR / "appsettings.Advanced.json",
        API_DIR / "appsettings.SaaS.json",
    ]


def worker_config_paths(env: str) -> list[Path]:
    return [
        WORKER_DIR / "appsettings.json",
        WORKER_DIR / f"appsettings.{env}.json",
    ]


@dataclass(frozen=True)
class HostReport:
    files_attempted: list[Path]
    files_loaded: list[Path]
    load_errors: list[str]
    active_exports: list[str]
    export_warnings: list[str]

    @property
    def has_export(self) -> bool:
        return len(self.active_exports) > 0


def compute_release_verdict(
    *,
    api: HostReport,
    worker: HostReport,
    include_process_environment: bool,
) -> tuple[str, list[str]]:
    """
    PASS — Api and Worker both have ≥1 durable export path and no JSON merge errors.
    WARN — partial coverage, merge noise, or JSON-only ambiguity.
    FAIL — Api lacks a durable export with process environment overlay on (simulates deploy-like check).
    """
    reasons: list[str] = []

    if api.load_errors:
        reasons.append(f"ArchLucid.Api appsettings merge issues ({len(api.load_errors)}) — see Api section.")

    if worker.load_errors:
        reasons.append(f"ArchLucid.Worker appsettings merge issues ({len(worker.load_errors)}) — see Worker section.")

    json_only = not include_process_environment

    if not api.has_export:
        if json_only:
            reasons.append(
                "ArchLucid.Api shows no exporter in **committed JSON layers only** — often a **false negative** "
                "(operators inject `APPLICATIONINSIGHTS_CONNECTION_STRING` / OTLP via env). Re-run **without** "
                "`--no-process-environment` on a shell that mirrors production env, or attach this report from CI as **WARN**."
            )
            if not worker.has_export:
                reasons.append(
                    "ArchLucid.Worker also shows no exporter in JSON-only mode — same caveat; Worker appsettings "
                    "often omit `Observability` entirely in-repo."
                )

            return "WARN", reasons

        reasons.append(
            "ArchLucid.Api has **no** Application Insights connection string, OTLP endpoint, or Prometheus scrape — "
            "**FAIL** for release: `archlucid_agent_output_*` metrics from `/execute` will not reach a backend."
        )

        return "FAIL", reasons

    if not worker.has_export:
        reasons.append(
            "ArchLucid.Worker has no durable export in this merged view — worker-hosted meters (outbox depth, "
            "integration events) may be missing from the same backend unless scraped separately. Treat as **WARN**."
        )

    if api.load_errors or worker.load_errors:
        return "WARN", reasons

    if reasons:
        return "WARN", reasons

    return "PASS", []
def build_host_report(
    *,
    json_paths: list[Path],
    include_process_environment: bool,
) -> HostReport:
    existing = [p for p in json_paths if p.is_file()]
    merged, errors = load_merged_json_objects(existing)
    loaded = list(existing)
    root_prefix = str(REPO_ROOT) + os.sep

    rel_errors = [msg.replace(root_prefix, "").replace("\\", "/") for msg in errors]

    effective = deep_merge(merged, environment_variables_as_config_layer()) if include_process_environment else merged

    active, warnings = analyze_export_paths(effective)

    return HostReport(
        files_attempted=json_paths,
        files_loaded=loaded,
        load_errors=rel_errors,
        active_exports=active,
        export_warnings=warnings,
    )


def render_markdown(
    *,
    env: str,
    api: HostReport,
    worker: HostReport,
    include_process_environment: bool,
    verdict: str,
    verdict_reasons: list[str],
) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    v_upper = verdict.upper()
    lines: list[str] = [
        "# Observability export readiness (repo-local)",
        "",
        f"_Generated {now} (environment label **{env}**)._",
        "",
        "## Summary",
        "",
        f"**Telemetry export readiness verdict:** **{v_upper}**",
        "",
    ]

    if verdict_reasons:
        lines.append("**Why:**")
        lines.append("")

        for r in verdict_reasons:
            lines.append(f"- {r}")

        lines.append("")
    elif v_upper == "PASS":
        lines.extend(
            [
                "**Why:** ArchLucid.Api and ArchLucid.Worker each have at least one durable export path in the merged view, "
                "and appsettings JSON layers merged without errors.",
                "",
            ]
        )

    lines.extend(
        [
            "| Host | Durable export active | Paths detected |",
            "|------|------------------------|----------------|",
            f"| **ArchLucid.Api** | {'**yes**' if api.has_export else '**no**'} | {', '.join(api.active_exports) if api.active_exports else '*none*'} |",
            f"| **ArchLucid.Worker** | {'**yes**' if worker.has_export else '**no**'} | {', '.join(worker.active_exports) if worker.active_exports else '*none*'} |",
            "",
            "**Durable export** means at least one of: Application Insights connection string, OTLP endpoint (not kill-switched), or Prometheus scrape enabled. "
            "Console-only export in Development does not satisfy production trending.",
            "",
            f"Process environment overlay: **{'on' if include_process_environment else 'off'}** (values are never printed).",
            "",
            "### Configuration reference (keys to set)",
            "",
            CONFIG_KEYS_DOC,
            "",
            "## ArchLucid.Api",
            "",
            "### Merged JSON files",
            "",
        ]
    )

    if api.files_loaded:
        lines.extend(f"- `{p.relative_to(REPO_ROOT).as_posix()}`" for p in api.files_loaded)
    else:
        lines.append("- *No appsettings files found on disk for this host.*")

    lines.append("")

    if api.load_errors:
        lines.append("### JSON load issues")
        lines.append("")

        for err in api.load_errors:
            lines.append(f"- WARNING: {err}")

        lines.append("")

    lines.append("### Export path analysis")
    lines.append("")

    if api.has_export:
        for pth in api.active_exports:
            lines.append(f"- OK: {pth}")
    else:
        lines.append("- WARNING: No active export path from merged configuration.")

    lines.append("")

    for w in api.export_warnings:
        lines.append(f"- WARNING: {w}")

    lines.extend(
        [
            "",
            "## ArchLucid.Worker",
            "",
            "### Merged JSON files",
            "",
        ]
    )

    if worker.files_loaded:
        lines.extend(f"- `{p.relative_to(REPO_ROOT).as_posix()}`" for p in worker.files_loaded)
    else:
        lines.append("- *No appsettings files found on disk for this host.*")

    lines.append("")

    if worker.load_errors:
        lines.append("### JSON load issues")
        lines.append("")

        for err in worker.load_errors:
            lines.append(f"- WARNING: {err}")

        lines.append("")

    lines.append("### Export path analysis")
    lines.append("")

    if worker.has_export:
        for pth in worker.active_exports:
            lines.append(f"- OK: {pth}")
    else:
        lines.append("- WARNING: No active export path from merged configuration.")

    lines.append("")

    for w in worker.export_warnings:
        lines.append(f"- WARNING: {w}")

    lines.extend(
        [
            "",
            "Committed **Worker** appsettings omit `Observability` - production typically injects the same keys "
            "via Container App / Key Vault env vars (`APPLICATIONINSIGHTS_CONNECTION_STRING`, "
            "`Observability__Otlp__Endpoint`, etc.). Enable **process environment overlay** above or verify deployment env.",
            "",
            "## Agent-output metrics (after successful execute)",
            "",
            "Emitted from `AgentOutputEvaluationRecorder` into meter **`ArchLucid`**; they appear in your backend only when "
            "a durable export path is active for **ArchLucid.Api** (execute runs on the API host).",
            "",
        ]
    )

    for name, blurb in AGENT_OUTPUT_METRICS:
        lines.append(f"- **`{name}`** - {blurb}")

    lines.extend(
        [
            "",
            "See `docs/library/AGENT_OUTPUT_EVALUATION.md` and `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`.",
            "",
            "## Post-deploy smoke (manual)",
            "",
            "1. Deploy **Api** (and **Worker** if applicable) with at least one export path configured.",
            "2. Run **one** successful architecture **execute** (`POST` … `/execute`) for a real or pilot tenant.",
            "3. In the metrics backend, search for:",
            "   - `archlucid_agent_output_structural_completeness_ratio`",
            "   - `archlucid_agent_output_semantic_score`",
            "   - `archlucid_agent_output_quality_gate_total`",
            "   - `archlucid_agent_output_parse_failures_total`",
            "   - `archlucid_agent_trace_blob_upload_failures_total`",
            "4. Azure Monitor may normalize names - filter by custom metric / `ArchLucid` meter if the UI groups by namespace. "
            "Prometheus and OTLP collectors usually preserve instrument names.",
            "",
            "## Agent-output alert examples (Prometheus / Grafana)",
            "",
            "YAML group **`archlucid-agent-output-quality`** in `infra/prometheus/archlucid-alerts.yml` mirrors suggested PromQL "
            "for **`archlucid_agent_output_quality_gate_total`**, **`archlucid_agent_output_semantic_score`**, "
            "**`archlucid_agent_output_parse_failures_total`**, and **`archlucid_agent_trace_blob_upload_failures_total`**. "
            "Tune windows and thresholds per environment; verify histogram `_bucket` names match your scrape (OTel vs native).",
            "",
            "## Terraform and alert bundles (reference)",
            "",
            "- **Monitoring stack (CPU alerts, optional Azure Monitor managed Prometheus rules, Grafana):** `infra/terraform-monitoring/README.md`",
            "- **OTLP collector (tail sampling):** `infra/terraform-otel-collector/README.md`",
            "- **Prometheus rule bundles:** `infra/prometheus/archlucid-alerts.yml` (includes **authority**, **data consistency**, **explainability**, **agent-output quality** groups) and `infra/prometheus/archlucid-slo-rules.yml` (HTTP SLOs).",
            "",
            "---",
            "",
            f"*Read next: `docs/library/OBSERVABILITY.md` (export paths) and `docs/library/TECH_BACKLOG.md` (TB-004).*",
        ]
    )

    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Markdown readiness report for OTel metric export (offline; optional env overlay).",
    )
    parser.add_argument(
        "--environment",
        default="Production",
        help="Appsettings layer name (e.g. Production, Staging, Development). Default: Production",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output Markdown path (default: stdout only)",
    )
    parser.add_argument(
        "--no-process-environment",
        action="store_true",
        help="Evaluate JSON files only (ignore process environment - simulates clean CI with no deploy secrets).",
    )
    parser.add_argument(
        "--strict-exit-code",
        action="store_true",
        help="Exit 1 unless telemetry verdict is PASS (see Summary — WARN includes JSON-only uncertainty or missing Worker export).",
    )

    args = parser.parse_args()
    env_name: str = args.environment.strip()

    if not env_name:
        print("ERROR: --environment must be non-empty", flush=True)
        return 2

    include_env = not args.no_process_environment

    api_report = build_host_report(
        json_paths=api_config_paths(env_name),
        include_process_environment=include_env,
    )
    worker_report = build_host_report(
        json_paths=worker_config_paths(env_name),
        include_process_environment=include_env,
    )

    verdict, verdict_reasons = compute_release_verdict(
        api=api_report,
        worker=worker_report,
        include_process_environment=include_env,
    )

    body = render_markdown(
        env=env_name,
        api=api_report,
        worker=worker_report,
        include_process_environment=include_env,
        verdict=verdict,
        verdict_reasons=verdict_reasons,
    )

    if args.out is not None:
        out_path: Path = args.out.expanduser().resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(body, encoding="utf-8")

    print(body, end="")

    if args.strict_exit_code and verdict != "PASS":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
