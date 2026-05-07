#!/usr/bin/env python3
"""
Emit a Markdown readiness report for data consistency enforcement modes (repo-local default: no DB).

Source material:
  docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md
  docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md

No destructive reconciliation is performed — this script only reads files under the repo and writes Markdown.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


REPO_ROOT = Path(__file__).resolve().parents[1]

KNOWN_MODES = frozenset({"off", "warn", "alert", "quarantine"})

EXPECTED_MIGRATIONS = (
    Path("ArchLucid.Persistence/Migrations/099_DataConsistencyQuarantine.sql"),
    Path("ArchLucid.Persistence/Migrations/134_FK_Authority_Chain_Runs_DbUpParity.sql"),
    Path("ArchLucid.Persistence/Migrations/147_AuthorityChain_RunForeignKeys_NotTrustedWhenMissing.sql"),
)

PROM_METRICS = (
    "archlucid_data_consistency_orphans_detected_total",
    "archlucid_data_consistency_alerts_total",
    "archlucid_data_consistency_orphans_quarantined_total",
)

DOC_DATA_CONSISTENCY = Path("docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md")
DOC_RUNBOOK = Path("docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md")

PATH_SQL_MASTER = Path("ArchLucid.Persistence/Scripts/ArchLucid.sql")
PATH_GRAFANA = Path("infra/grafana/dashboard-archlucid-authority.json")
PATH_PROM_RULES = Path("infra/prometheus/archlucid-alerts.yml")


@dataclass(frozen=True)
class ReadinessRow:
    name: str
    status: str
    detail: str

    def __post_init__(self) -> None:
        allowed = frozenset({"Passed", "Failed", "Skipped", "Not captured"})
        if self.status not in allowed:
            raise ValueError(f"invalid status {self.status!r}")


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


def validate_enforcement_mode(raw: Any) -> tuple[str | None, str | None]:
    """Returns (normalized_mode_or_None, invalid_reason_or_None); None, None means omitted from JSON."""
    if raw is None:
        return (None, None)
    if not isinstance(raw, str):
        return (None, f"mode must be string, got {type(raw).__name__}")

    lowered = raw.strip().lower()

    if lowered not in KNOWN_MODES:
        return (None, f"unknown mode {raw!r} (expect Off | Warn | Alert | Quarantine)")

    return (lowered, None)


def effective_quarantine_inserts(mode: str | None, auto_quarantine: bool | None) -> str:
    if mode is None:
        return (
            "Enforcement Mode not present in merged JSON — host binds default **Warn**; "
            "**AutoQuarantine** default false unless overridden elsewhere."
        )

    if mode == "off":
        return "No quarantine INSERTs — Mode Off (staging suppressed)."

    aq = auto_quarantine is True

    if mode == "quarantine":
        base = "Quarantine INSERTs run per bounded batch"

        return base + ("; AutoQuarantine adds no extra behavior beyond Mode Quarantine semantics." if not aq else " with AutoQuarantine also true.")

    if mode == "alert":
        if aq:
            return "Quarantine INSERTs when orphans exist — Alert mode + AutoQuarantine true."

        return "No automatic quarantine INSERTs — Alert mode with AutoQuarantine false (alerts counter only unless operator changes config)."

    if mode == "warn":
        if aq:
            return "Quarantine INSERTs when orphans exist — Warn mode + AutoQuarantine true (see runbook)."

        return "No quarantine INSERTs — Warn mode with AutoQuarantine false (logs + detection counter)."

    return "See docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md for Mode matrix."


def effective_alert_emits(mode: str | None) -> str:
    if mode is None:
        return (
            "Alert counter increments follow host default **Warn** unless another layer overrides merged JSON — verify deployment profile."
        )

    if mode in {"alert", "quarantine"}:
        return (
            "`archlucid_data_consistency_alerts_total` increments when counts meet AlertThreshold "
            "(Alert / Quarantine enforcement modes)."
        )

    return (
        "Alert counter increments are suppressed by configuration for Off / Warn (detection counter may still run); "
        "see runbook for Mode matrix."
    )


def build_operator_posture_section(
    merged_root: dict[str, Any],
    config_sources: list[str],
    config_errors: list[str],
) -> list[str]:
    lines: list[str] = []

    lines.append("## Intended operator posture (from appsettings JSON)")
    lines.append("")

    if config_errors:
        lines.append("| Source | Detail |")
        lines.append("| --- | --- |")
        for msg in config_errors:
            lines.append("| Configuration load | `{0}` |".format(msg.replace("|", "\\|")))
        lines.append("")
        lines.append("*Posture keys were not synthesized because JSON fragments failed validation.*")

        lines.append("")
        return lines

    if not config_sources:
        lines.append(
            "**Skipped** — no configuration files merged. Pass `--config <path>` or rely on repo default "
            "`ArchLucid.Api/appsettings.json` when present."
        )
        lines.append("")

        return lines

    raw_dc = merged_root.get("DataConsistency")
    dc = raw_dc if isinstance(raw_dc, dict) else {}

    lines.append("| Key | Value |")
    lines.append("| --- | --- |")

    enf = dc.get("Enforcement")
    enf_obj = enf if isinstance(enf, dict) else {}

    mode_norm, mode_err = validate_enforcement_mode(enf_obj.get("Mode"))

    aq_raw = enf_obj.get("AutoQuarantine")
    if isinstance(aq_raw, bool):
        aq_disp = str(aq_raw).lower()

    elif aq_raw is None:
        aq_disp = "(missing — defaults false in host template)"

    else:
        aq_disp = f"(non-boolean: `{aq_raw!r}`)"

    orphan_raw = dc.get("OrphanProbeEnabled")
    orphan_disp = str(orphan_raw).lower() if isinstance(orphan_raw, bool) else repr(orphan_raw)

    lines.append("| `DataConsistency:OrphanProbeEnabled` | " + orphan_disp + " |")

    if mode_err:

        lines.append("| `DataConsistency:Enforcement:Mode` | " + "_invalid_: " + str(mode_err) + " |")

    elif mode_norm:

        lines.append("| `DataConsistency:Enforcement:Mode` | " + mode_norm.upper() + " |")

    else:

        lines.append(
            "| `DataConsistency:Enforcement:Mode` | "
            "(omitted — host-template default Warn; confirm deployment overlays) |"
        )

    lines.append("| `DataConsistency:Enforcement:AutoQuarantine` | " + aq_disp + " |")

    for k in ("MaxRowsPerBatch", "AlertThreshold"):

        v = enf_obj.get(k)

        lines.append("| `DataConsistency:Enforcement:" + k + "` | " + repr(v) + " |")

    merged_from = ", ".join(f"`{p}`" for p in config_sources)
    lines.append("| Merge sources | " + merged_from + " |")
    lines.append("")

    if mode_err:

        lines.append("**Parsing note:** enforcement Mode is invalid; host binding may reject startup until fixed.")
        lines.append("")

    aq_bool = aq_raw if isinstance(aq_raw, bool) else False

    logical_mode_for_effective = mode_norm if mode_norm else "warn"

    lines.append("### Effective behavior (summarized)")
    lines.append("")

    lines.append(effective_alert_emits(logical_mode_for_effective))

    lines.append("")
    lines.append(effective_quarantine_inserts(logical_mode_for_effective if mode_norm else None, aq_bool))

    posture_label = summarize_posture_label(mode_norm, aq_bool)

    lines.append("")
    lines.append(f"### Posture label: **{posture_label}**")
    lines.append("")

    return lines


def summarize_posture_label(mode: str | None, auto_quarantine: bool) -> str:
    if mode is None:
        return (
            "Unspecified Mode in merged appsettings (expect **Warn** + AutoQuarantine false at host template defaults — validate deployment)."
        )

    if mode == "off":
        return "Off (detection may still increment; alerts/quarantine side effects suppressed)."

    if mode == "warn" and not auto_quarantine:
        return "Warn (logs + orphans_detected metric; no alert counter unless configured otherwise)."

    if mode == "warn" and auto_quarantine:
        return "Warn + AutoQuarantine (staging INSERTs possible when orphans exist — confirm runbook)."

    if mode == "alert" and not auto_quarantine:
        return "Alert (alerts metric; staging INSERTs off unless switched to Quarantine or AutoQuarantine)."

    if mode == "alert" and auto_quarantine:
        return "Alert + AutoQuarantine (alerts metric + staging INSERTs when orphans exist)."

    if mode == "quarantine" and not auto_quarantine:
        return "Quarantine (staging INSERT batches + alerts per runbook — AutoQuarantine false)."

    if mode == "quarantine" and auto_quarantine:
        return "Quarantine + AutoQuarantine (staging emphasis; reconcile runbook wording for your tenancy)."

    return "Unresolved — fix Mode binding or omit appsettings parsing."


def quarantine_safe_to_enable_rows(
    mode_norm: str | None,
    auto_quarantine: bool,
    migration_rows_all_passed: bool,
    ddl_quarantine_defined: bool,
) -> tuple[ReadinessRow, ReadinessRow]:
    staging_requested = mode_norm == "quarantine" or auto_quarantine

    struct_ok = migration_rows_all_passed and ddl_quarantine_defined

    if staging_requested and struct_ok:
        safe_struct = Passed(
            "Repo structural prerequisites for staging inserts (DDL + numbered migrations)",
            "ArchLucid.sql defines `dbo.DataConsistencyQuarantine`; DbUp parity scripts `099`, `134`, `147` are present.",
        )
        rationale = ReadinessRow(
            name=(
                "Quarantine / AutoQuarantine safe to enable (operational readiness — excludes live orphan census)"
            ),
            status="Not captured",
            detail=(
                "Schema and repo refs look present, but brownfield orphan volume and FK **trusted** vs **WITH NOCHECK** "
                "state require DBA/SQL verification before treating production as \"clean\". No automated probe here."
            ),
        )

        return safe_struct, rationale

    if staging_requested and not struct_ok:
        return Failed(
            "Quarantine DDL / migration prerequisites (repo-local)",
            "Fix failed migration/DDL readiness rows above before relying on staging inserts.",
        ), ReadinessRow(
            name="Live database orphan / trust state vs `WITH NOCHECK`",
            status="Not captured",
            detail="Requires SQL connectivity and targeted queries — default report path skips DB.",
        )

    return Passed(
        "Quarantine inserts not requested by merged configuration",
        "Mode does not imply automatic staging INSERTs unless you enable Quarantine or AutoQuarantine.",
    ), ReadinessRow(
        name="If enabling Quarantine later: brownfield orphan / FK trust state",
        status="Skipped",
        detail="Not assessed — enable Quarantine in config only after runbook review and DB checks.",
    )


def Passed(name: str, detail: str) -> ReadinessRow:
    return ReadinessRow(name=name, status="Passed", detail=detail)


def Failed(name: str, detail: str) -> ReadinessRow:
    return ReadinessRow(name=name, status="Failed", detail=detail)


def Skipped_(name: str, detail: str) -> ReadinessRow:
    return ReadinessRow(name=name, status="Skipped", detail=detail)


def NotCaptured(name: str, detail: str) -> ReadinessRow:
    return ReadinessRow(name=name, status="Not captured", detail=detail)


def build_readiness_rows(
    repo_root: Path,
    merged_app_settings: dict[str, Any] | None,
    config_errors: list[str],
    config_sources: list[str],
) -> list[ReadinessRow]:
    rows: list[ReadinessRow] = []

    runbook_path = repo_root / DOC_RUNBOOK
    spine_path = repo_root / DOC_DATA_CONSISTENCY
    spine_text = ""

    if spine_path.is_file():
        spine_text = spine_path.read_text(encoding="utf-8")

    rows.append(
        Passed("Operator runbook present", "`" + DOC_RUNBOOK.as_posix() + "`")
        if runbook_path.is_file()
        else Failed("Operator runbook present", f"missing `{DOC_RUNBOOK.as_posix()}`")
    )

    rows.append(
        Passed("Architecture spine doc present", "`" + DOC_DATA_CONSISTENCY.as_posix() + "`")
        if spine_path.is_file()
        else Failed("Architecture spine doc present", f"missing `{DOC_DATA_CONSISTENCY.as_posix()}`")
    )

    rows.append(
        Passed(
            "Architecture doc cites `WITH NOCHECK` brownfield posture",
            "Prevention vs detection section describes legacy orphans vs new writes.",
        )
        if "WITH NOCHECK" in spine_text
        else Failed(
            "Architecture doc cites `WITH NOCHECK` brownfield posture",
            "Missing expected phrase — verify doc regressions.",
        )
    )

    rows.append(
        Passed(
            "Documented posture labels (Warn / Alert / Quarantine / AutoQuarantine)",
            "`docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md` Mode table + spine doc.",
        )
        if all(x in spine_text for x in ("Warn", "Alert", "Quarantine", "AutoQuarantine"))
        else Failed(
            "Documented posture labels (Warn / Alert / Quarantine / AutoQuarantine)",
            "Spine doc missing expected keywords — update docs.",
        )
    )

    sql_master = repo_root / PATH_SQL_MASTER

    ddl_quarantine_defined = sql_master.is_file() and "dbo.DataConsistencyQuarantine" in sql_master.read_text(
        encoding="utf-8"
    )

    rows.append(
        Passed(
            "Master SQL DDL present (`ArchLucid.sql`) with quarantine table definition",
            PATH_SQL_MASTER.as_posix(),
        )
        if ddl_quarantine_defined
        else Failed(
            "Master SQL DDL present (`ArchLucid.sql`) with quarantine table definition",
            "`dbo.DataConsistencyQuarantine` marker missing or file unreadable.",
        )
    )

    migrations_ok = True

    for rel in EXPECTED_MIGRATIONS:
        p = repo_root / rel
        rows.append(
            Passed(f"Migration file present `{rel.as_posix()}`", rel.as_posix()) if p.is_file() else Failed(
                f"Migration file present `{rel.as_posix()}`",
                "Add or restore numbered migration.",
            )
        )

        migrations_ok = migrations_ok and p.is_file()

    grafana_ok = repo_root / PATH_GRAFANA

    prometheus_ok = repo_root / PATH_PROM_RULES

    graf_text = grafana_ok.read_text(encoding="utf-8") if grafana_ok.is_file() else ""
    prom_text = prometheus_ok.read_text(encoding="utf-8") if prometheus_ok.is_file() else ""

    rows.append(
        Passed(
            "Grafana dashboard JSON references data-consistency metrics",
            PATH_GRAFANA.as_posix(),
        )
        if grafana_ok.is_file()
        and all(m in graf_text for m in PROM_METRICS[:2])
        and "orphans_quarantined" in graf_text  # substring match suffices
        else Failed(
            "Grafana dashboard JSON references data-consistency metrics",
            "`infra/grafana/dashboard-archlucid-authority.json` missing or outdated.",
        )
    )

    rows.append(
        Passed(
            "Prometheus rules reference ARCHLUCID data-consistency counters",
            PATH_PROM_RULES.as_posix(),
        )
        if prometheus_ok.is_file() and all(m in prom_text for m in PROM_METRICS)
        else Failed(
            "Prometheus rules reference ARCHLUCID data-consistency counters",
            "`infra/prometheus/archlucid-alerts.yml` missing or stale.",
        )
    )

    rows.append(
        Passed(
            "Metric names documented in this report (Prometheus exposition)",
            " — ".join("`" + m + "`" for m in PROM_METRICS),
        )
    )

    rows.append(
        NotCaptured(
            "Live orphan row counts / quarantine table cardinality",
            "Requires authenticated SQL plane access — omit from repo-local gate.",
        )
    )

    dc_raw = merged_app_settings.get("DataConsistency") if isinstance(merged_app_settings, dict) else None

    dc_obj = dc_raw if isinstance(dc_raw, dict) else {}

    enf = dc_obj.get("Enforcement") if isinstance(dc_obj.get("Enforcement"), dict) else {}

    if config_errors:

        rows.append(
            Failed(
                "Merged appsettings JSON readable",
                "; ".join(config_errors),
            )
        )

    elif not config_sources:

        rows.append(Skipped_("Appsettings posture read", "no configuration paths resolved (missing default file)."))

    else:
        rows.append(Passed("Appsettings readable", ", ".join(f"`{p}`" for p in config_sources)))

        enf_mode, mode_err = validate_enforcement_mode(enf.get("Mode"))

        if mode_err:

            rows.append(Failed("Enforcement Mode literal parses", mode_err))

        elif enf_mode is None:

            rows.append(
                Passed(
                    "Enforcement Mode literal parses",
                    "Key omitted in merged fragments — binds **Warn** at host defaults unless another layer overrides.",
                )
            )

        else:

            rows.append(Passed("Enforcement Mode literal parses", enf_mode.upper()))

    has_clean_config_merge = bool(config_sources) and not config_errors

    if has_clean_config_merge:

        mode_norm_raw, _ = validate_enforcement_mode(enf.get("Mode"))
        aq_read = enf.get("AutoQuarantine")
        aq_parsed = aq_read if isinstance(aq_read, bool) else False

        a_row, b_row = quarantine_safe_to_enable_rows(
            mode_norm_raw,
            aq_parsed,
            migrations_ok,
            ddl_quarantine_defined,
        )
        rows.append(a_row)
        rows.append(b_row)

    else:

        rows.append(
            Skipped_(
                "Quarantine staging prerequisites vs merged config",
                "Fix JSON merge failures or supply `--config`/`appsettings.json` for structural vs posture checks tied to YAML/JSON posture.",
            )
        )

        rows.append(
            NotCaptured(
                "Quarantine posture vs live brownfield orphans",
                "Requires SQL probes after validated configuration merges.",
            )
        )

    return rows


def operator_checklist_markdown() -> list[str]:
    return [
        "## Operator checklist (from runbook)",
        "",
        "Use **["
        + DOC_RUNBOOK.as_posix()
        + "]("
        + DOC_RUNBOOK.as_posix()
        + ")** alongside Prometheus alert names **ArchLucidDataConsistencyOrphansDetected**, "
        "**ArchLucidDataConsistencyAlertsRaised**, **ArchLucidDataConsistencyOrphansQuarantinedActivity**.",
        "",
        "1. Filter **`archlucid_data_consistency_orphans_detected_total`** by **`table`** / **`column`** to see which FK slice drifted versus **`dbo.Runs`**.",
        "2. When **`archlucid_data_consistency_alerts_total`** spikes, confirm **`DataConsistency:Enforcement:Mode`** is Alert or Quarantine "
        "and compare counts to **`AlertThreshold`** on the emitting revision.",
        "3. When **`archlucid_data_consistency_orphans_quarantined_total`** moves, inspect **`dbo.DataConsistencyQuarantine`** "
        "(**`ReasonJson`**, **`TenantId`**) and route through remediation — **never treat quarantine rows as deletes**.",
        "",
    ]


def nocheck_explainer_markdown() -> list[str]:
    return [
        "## `WITH NOCHECK` and brownfield risk (non-negotiable honest summary)",
        "",
        "Authority-chain foreign keys targeting **`dbo.Runs`** may be introduced using **`ALTER TABLE … WITH NOCHECK ADD CONSTRAINT`** "
        "so **legacy orphan rows remain visible** in brownfield catalogs that pre-date full validation.",
        "**New inserts/updates still must satisfy the constraint** once applied — silent healing of historic orphans **does not** happen automatically.",
        "DbUp scripts **134** (trusted parity where possible) and **147** (not-trusted **`WITH NOCHECK`** installs when orphans blocked parity) mirror **`ArchLucid.sql`** semantics.",
        "",
        "**Operational implication:** before calling Quarantine posture **operationally \"safe\"** in production, "
        "**reconcile orphan counts**, review FK trust tooling, and follow **["
        + DOC_RUNBOOK.as_posix()
        + "]("
        + DOC_RUNBOOK.as_posix()
        + ")**.",
        "",
        "**Destructive remediation:** orphan probe / quarantine loops perform **bounded INSERT staging only** "
        "(no automated delete or corrective reconciliation inside the probe executor). Manual remediation stays under existing admin/runbook flows.",
        "",
    ]


def format_report_markdown(
    rows: Iterable[ReadinessRow],
    posture_md: Iterable[str],
) -> str:
    lines: list[str] = [
        "# Data consistency enforcement — mode readiness report",
        "",
        "Repo-local checks by default (**no SQL connectivity**). **Passed** / **Failed** / **Skipped** / **Not captured** — see table.",
        "",
    ]

    lines.extend(posture_md)
    lines.extend(
        [
            "## Readiness table",
            "",
            "| Check | Result | Detail |",
            "| --- | --- | --- |",
        ]
    )

    for row in rows:
        lines.append(f"| {row.name} | **{row.status}** | {row.detail} |")

    lines.append("")
    lines.extend(operator_checklist_markdown())

    lines.append("### References")
    lines.append("")

    lines.extend(
        [
            "| Artifact | Relative path |",
            "| --- | --- |",
            "| Spine doc | `" + DOC_DATA_CONSISTENCY.as_posix() + "` |",
            "| Runbook | `" + DOC_RUNBOOK.as_posix() + "` |",
            "| Master DDL | `" + PATH_SQL_MASTER.as_posix() + "` |",
            "| Grafana (import / sync) | `" + PATH_GRAFANA.as_posix() + "` |",
            "| Prometheus alerts | `" + PATH_PROM_RULES.as_posix() + "` |",
            "",
        ]
    )

    lines.extend(nocheck_explainer_markdown())

    lines.append("")
    lines.append(
        "> **Non-destruction guarantee:** This report generator performs read-only filesystem access and emits Markdown only."
    )

    lines.append("")

    return "\n".join(lines)


def any_failed(rows: Iterable[ReadinessRow]) -> bool:
    return any(r.status == "Failed" for r in rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=REPO_ROOT / "artifacts" / "deployment" / "data-consistency-mode-readiness.md",
        help="Markdown output path",
    )
    parser.add_argument(
        "--config",
        type=Path,
        action="append",
        dest="configs",
        default=None,
        metavar="PATH",
        help=(
            "JSON appsettings fragments merged in order (later wins). "
            "If omitted and `ArchLucid.Api/appsettings.json` exists, that file loads by default."
        ),
    )

    parser.add_argument(
        "--no-default-appsettings",
        action="store_true",
        help="Do not load ArchLucid.Api/appsettings.json when --config is omitted.",
    )

    parser.add_argument(
        "--strict-exit-code",
        action="store_true",
        help="Exit with code 1 when any readiness row is Failed.",
    )

    args = parser.parse_args()
    configs = list(args.configs) if args.configs else None

    if configs is None and not args.no_default_appsettings:
        default_apps = REPO_ROOT / "ArchLucid.Api" / "appsettings.json"
        configs = [default_apps] if default_apps.is_file() else []

    elif configs is None:
        configs = []

    merged: dict[str, Any]

    merged, errs = load_merged_json_objects(configs)

    config_sources_norm = [c.as_posix() for c in configs]

    posture_lines = []
    posture_lines.extend(build_operator_posture_section(merged, config_sources_norm, errs))

    rows = build_readiness_rows(REPO_ROOT, merged, errs, config_sources_norm)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    markdown = format_report_markdown(rows, posture_lines)
    args.out.write_text(markdown, encoding="utf-8")
    print(f"Wrote {args.out}")

    if args.strict_exit_code and any_failed(rows):
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
