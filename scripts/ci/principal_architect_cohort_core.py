"""Shared logic for principal-architect and blind-validation cohort aggregation."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any

_REPO = Path(__file__).resolve().parents[2]
_THRESHOLDS_PATH = _REPO / "scripts" / "ci" / "data" / "principal_architect_cohort_thresholds.v1.json"
_PRINCIPAL_SESSION_SCHEMA = "archlucid.principal-architect-session.v1"
_BLIND_SUMMARY_SCHEMA = "archlucid.blind-insight-validation-summary.v1"
_REPORT_SCHEMA = "archlucid.principal-architect-cohort-report.v1"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_thresholds(path: Path | None = None) -> dict[str, Any]:
    target = path or _THRESHOLDS_PATH
    payload = json.loads(target.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {target}")

    return payload


def safe_int(value: object) -> int:
    try:
        return int(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0


def safe_float(value: object) -> float | None:
    try:
        return float(value)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


def classification_material_total(counts: dict[str, int]) -> int:
    return sum(counts.get(code, 0) for code in ("O", "U", "N", "X", "S"))


def n_share(counts: dict[str, int]) -> float | None:
    material = classification_material_total(counts)

    if material <= 0:
        return None

    return counts.get("N", 0) / material


def x_share(counts: dict[str, int]) -> float | None:
    material = classification_material_total(counts)

    if material <= 0:
        return None

    return counts.get("X", 0) / material


def reuse_is_positive(intent: str, positive_intents: list[str]) -> bool | None:
    normalized = intent.strip().lower()

    if not normalized:
        return None

    return normalized in {value.lower() for value in positive_intents}


def discover_principal_architect_sessions(sessions_dir: Path) -> list[Path]:
    if not sessions_dir.is_dir():
        return []

    return sorted(sessions_dir.rglob("session.json"))


def discover_blind_validation_sessions(sessions_dir: Path) -> list[Path]:
    if not sessions_dir.is_dir():
        return []

    direct = sorted(sessions_dir.glob("*/session-summary.json"))

    if direct:
        return direct

    return sorted(sessions_dir.rglob("session-summary.json"))


def load_principal_architect_session(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    schema = str(payload.get("schema") or "")

    if schema != _PRINCIPAL_SESSION_SCHEMA:
        raise ValueError(f"Unsupported schema in {path}: {schema or '(missing)'}")

    return payload


def load_blind_validation_summary(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    schema = str(payload.get("schema") or "")

    if schema != _BLIND_SUMMARY_SCHEMA:
        raise ValueError(f"Unsupported schema in {path}: {schema or '(missing)'}")

    return payload


def normalize_principal_architect_session(payload: dict[str, Any], source_path: Path) -> dict[str, Any]:
    source_counts = payload.get("sourceCounts") or {}
    arch_counts_raw = source_counts.get("archlucid") if isinstance(source_counts, dict) else {}
    arch_counts = {code: safe_int(arch_counts_raw.get(code)) for code in ("O", "U", "N", "X", "S")} if isinstance(arch_counts_raw, dict) else {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0}
    decision_impact = safe_float(payload.get("decisionImpactMedian"))

    return {
        "sessionId": str(payload.get("sessionId") or source_path.parent.name),
        "sourceKind": "principal-architect",
        "sourcePath": str(source_path.as_posix()),
        "archlucidCounts": arch_counts,
        "materialFindingCount": classification_material_total(arch_counts),
        "nonObviousShare": n_share(arch_counts),
        "incorrectShare": x_share(arch_counts),
        "reuseIntent": str(payload.get("reuseIntent") or ""),
        "decisionImpactMedian": decision_impact,
        "criticalIncorrectCount": arch_counts.get("X", 0),
    }


def pick_archlucid_arm(summary: dict[str, Any], archlucid_keys: set[str]) -> dict[str, Any] | None:
    for arm in summary.get("armSummaries") or []:
        if not isinstance(arm, dict):
            continue

        source_key = str(arm.get("sourceKey") or "").strip()

        if source_key in archlucid_keys:
            return arm

    return None


def normalize_blind_validation_summary(payload: dict[str, Any], source_path: Path, archlucid_keys: set[str]) -> dict[str, Any]:
    arm = pick_archlucid_arm(payload, archlucid_keys)
    counts_raw = arm.get("classificationCounts") if isinstance(arm, dict) else {}
    counts = {code: safe_int(counts_raw.get(code)) for code in ("O", "U", "N", "X", "S")} if isinstance(counts_raw, dict) else {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0}
    means = arm.get("means") if isinstance(arm, dict) else {}
    decision_impact = safe_float(means.get("decisionImpact")) if isinstance(means, dict) else None

    return {
        "sessionId": str(payload.get("sessionId") or source_path.parent.name),
        "sourceKind": "blind-validation",
        "sourcePath": str(source_path.as_posix()),
        "archlucidCounts": counts,
        "materialFindingCount": classification_material_total(counts),
        "nonObviousShare": n_share(counts) if isinstance(arm, dict) else None,
        "incorrectShare": x_share(counts) if isinstance(arm, dict) else None,
        "reuseIntent": str(payload.get("reuseIntent") or ""),
        "decisionImpactMedian": decision_impact,
        "criticalIncorrectCount": counts.get("X", 0),
    }


def load_normalized_sessions(
    principal_dir: Path,
    blind_dir: Path,
    archlucid_keys: list[str],
) -> list[dict[str, Any]]:
    key_set = {value.strip() for value in archlucid_keys if value.strip()}
    sessions: list[dict[str, Any]] = []

    for path in discover_principal_architect_sessions(principal_dir):
        sessions.append(normalize_principal_architect_session(load_principal_architect_session(path), path))

    for path in discover_blind_validation_sessions(blind_dir):
        sessions.append(normalize_blind_validation_summary(load_blind_validation_summary(path), path, key_set))

    return sessions


def evaluate_metric(value: float | None, pass_at: float, fail_below: float, higher_is_better: bool = True) -> str:
    if value is None:
        return "INDETERMINATE"

    if higher_is_better:
        if value >= pass_at:
            return "PASS"

        if value < fail_below:
            return "FAIL"

        return "HOLD"

    if value <= pass_at:
        return "PASS"

    if value > fail_below:
        return "FAIL"

    return "HOLD"


def evaluate_reuse_fraction(positive_count: int, total: int, pass_fraction: float, fail_fraction: float) -> str:
    if total <= 0:
        return "INDETERMINATE"

    fraction = positive_count / total

    if fraction >= pass_fraction:
        return "PASS"

    if fraction <= fail_fraction:
        return "FAIL"

    return "HOLD"


def evaluate_incorrect_count(incorrect_total: int, max_allowed: int) -> str:
    if incorrect_total <= max_allowed:
        return "PASS"

    return "FAIL"


def build_cohort_report(
    sessions: list[dict[str, Any]],
    thresholds: dict[str, Any],
) -> dict[str, Any]:
    min_sessions = safe_int(thresholds.get("minSessionsForEvaluation")) or 3
    positive_intents = list(thresholds.get("reusePositiveIntents") or ["yes", "maybe"])
    archlucid_keys = list(thresholds.get("archlucidSourceKeys") or ["archlucid"])

    aggregate_counts = {"O": 0, "U": 0, "N": 0, "X": 0, "S": 0}
    n_shares: list[float] = []
    x_shares: list[float] = []
    decision_impacts: list[float] = []
    reuse_positive = 0
    reuse_recorded = 0
    session_ids: list[str] = []

    for session in sessions:
        session_ids.append(str(session.get("sessionId") or "unknown"))
        counts = session.get("archlucidCounts") or {}

        for code in aggregate_counts:
            aggregate_counts[code] += safe_int(counts.get(code))

        share = session.get("nonObviousShare")

        if isinstance(share, (int, float)):
            n_shares.append(float(share))

        x_share_value = session.get("incorrectShare")

        if isinstance(x_share_value, (int, float)):
            x_shares.append(float(x_share_value))

        impact = session.get("decisionImpactMedian")

        if isinstance(impact, (int, float)):
            decision_impacts.append(float(impact))

        reuse = reuse_is_positive(str(session.get("reuseIntent") or ""), positive_intents)

        if reuse is not None:
            reuse_recorded += 1

            if reuse:
                reuse_positive += 1

    material_total = classification_material_total(aggregate_counts)
    cohort_n_share = n_share(aggregate_counts)
    cohort_x_share = x_share(aggregate_counts)
    cohort_x_total = aggregate_counts.get("X", 0)
    reuse_fraction = (reuse_positive / reuse_recorded) if reuse_recorded > 0 else None
    decision_impact_median = round(median(decision_impacts), 2) if decision_impacts else None
    session_count = len(sessions)
    messaging_ready = session_count >= min_sessions

    metric_results = {
        "nonObviousShare": {
            "value": round(cohort_n_share, 3) if cohort_n_share is not None else None,
            "passAtOrAbove": thresholds.get("archlucidNonObviousSharePass"),
            "failBelow": thresholds.get("archlucidNonObviousShareFail"),
            "result": "INDETERMINATE",
        },
        "incorrectShare": {
            "value": round(cohort_x_share, 3) if cohort_x_share is not None else None,
            "incorrectFindingCount": cohort_x_total,
            "maxAllowedIncorrect": thresholds.get("archlucidCriticalXMax"),
            "result": "INDETERMINATE",
        },
        "reuseIntent": {
            "positiveCount": reuse_positive,
            "recordedCount": reuse_recorded,
            "positiveFraction": round(reuse_fraction, 3) if reuse_fraction is not None else None,
            "passAtOrAbove": thresholds.get("reusePositivePassFraction"),
            "failAtOrBelow": thresholds.get("reusePositiveFailFraction"),
            "result": "INDETERMINATE",
        },
        "decisionImpactMedian": {
            "value": decision_impact_median,
            "sessionsWithValue": len(decision_impacts),
            "result": "INFORMATIONAL",
        },
    }

    if not messaging_ready:
        disposition = "INSUFFICIENT_EVIDENCE"
        disposition_detail = f"Sample count {session_count} is below minimum {min_sessions} for cohort evaluation."
    else:
        metric_results["nonObviousShare"]["result"] = evaluate_metric(
            cohort_n_share,
            float(thresholds.get("archlucidNonObviousSharePass") or 0.25),
            float(thresholds.get("archlucidNonObviousShareFail") or 0.15),
            higher_is_better=True,
        )
        metric_results["incorrectShare"]["result"] = evaluate_incorrect_count(
            cohort_x_total,
            safe_int(thresholds.get("archlucidCriticalXMax")),
        )
        metric_results["reuseIntent"]["result"] = evaluate_reuse_fraction(
            reuse_positive,
            reuse_recorded,
            float(thresholds.get("reusePositivePassFraction") or 0.6),
            float(thresholds.get("reusePositiveFailFraction") or 0.4),
        )

        evaluated = [
            metric_results["nonObviousShare"]["result"],
            metric_results["incorrectShare"]["result"],
            metric_results["reuseIntent"]["result"],
        ]

        if "FAIL" in evaluated:
            disposition = "FAIL"
            disposition_detail = "One or more cohort thresholds failed."
        elif all(result == "PASS" for result in evaluated):
            disposition = "PASS"
            disposition_detail = "All cohort thresholds passed."
        else:
            disposition = "HOLD"
            disposition_detail = "Cohort metrics are mixed or indeterminate against pass/fail thresholds."

    return {
        "schema": _REPORT_SCHEMA,
        "generatedUtc": utc_now(),
        "sessionCount": session_count,
        "sessionIds": session_ids,
        "minSessionsForEvaluation": min_sessions,
        "messagingReady": messaging_ready,
        "disposition": disposition,
        "dispositionDetail": disposition_detail,
        "sources": {
            "principalArchitectSessionsRoot": thresholds.get("principalArchitectSessionsRoot"),
            "blindValidationSessionsRoot": thresholds.get("blindValidationSessionsRoot"),
            "archlucidSourceKeys": archlucid_keys,
        },
        "sessions": sessions,
        "cohort": {
            "archlucidCounts": aggregate_counts,
            "materialFindingCount": material_total,
            "meanSessionNonObviousShare": round(sum(n_shares) / len(n_shares), 3) if n_shares else None,
            "meanSessionIncorrectShare": round(sum(x_shares) / len(x_shares), 3) if x_shares else None,
        },
        "metrics": metric_results,
        "interpretationGuardrails": list(thresholds.get("interpretationGuardrails") or []),
    }


def render_markdown(report: dict[str, Any]) -> str:
    metrics = report.get("metrics") or {}
    cohort = report.get("cohort") or {}
    counts = cohort.get("archlucidCounts") or {}
    lines = [
        "# Principal-architect validation — cohort batch report",
        "",
        f"**Generated UTC:** {report.get('generatedUtc')}",
        f"**Sessions aggregated:** {report.get('sessionCount')}",
        f"**Minimum for evaluation:** {report.get('minSessionsForEvaluation')}",
        f"**Messaging ready:** {report.get('messagingReady')}",
        f"**Disposition:** {report.get('disposition')}",
        "",
        report.get("dispositionDetail") or "",
        "",
        "## Cohort metrics (ArchLucid findings)",
        "",
        "| Metric | Value | Threshold | Result |",
        "| --- | --- | --- | --- |",
    ]

    n_metric = metrics.get("nonObviousShare") or {}
    lines.append(
        "| Non-obvious share (N-rate) | {value} | pass ≥ {pass_at}, fail < {fail_below} | {result} |".format(
            value=n_metric.get("value"),
            pass_at=n_metric.get("passAtOrAbove"),
            fail_below=n_metric.get("failBelow"),
            result=n_metric.get("result"),
        )
    )

    x_metric = metrics.get("incorrectShare") or {}
    lines.append(
        "| Incorrect share (X-rate) | {value} ({count} findings) | max incorrect {max_allowed} | {result} |".format(
            value=x_metric.get("value"),
            count=x_metric.get("incorrectFindingCount"),
            max_allowed=x_metric.get("maxAllowedIncorrect"),
            result=x_metric.get("result"),
        )
    )

    reuse_metric = metrics.get("reuseIntent") or {}
    lines.append(
        "| Reuse intent (yes/maybe) | {positive}/{recorded} ({fraction}) | pass ≥ {pass_at}, fail ≤ {fail_at} | {result} |".format(
            positive=reuse_metric.get("positiveCount"),
            recorded=reuse_metric.get("recordedCount"),
            fraction=reuse_metric.get("positiveFraction"),
            pass_at=reuse_metric.get("passAtOrAbove"),
            fail_at=reuse_metric.get("failAtOrBelow"),
            result=reuse_metric.get("result"),
        )
    )

    impact_metric = metrics.get("decisionImpactMedian") or {}
    lines.append(
        "| Decision-impact median | {value} ({sessions} sessions) | informational | {result} |".format(
            value=impact_metric.get("value"),
            sessions=impact_metric.get("sessionsWithValue"),
            result=impact_metric.get("result"),
        )
    )

    lines.extend(
        [
            "",
            "## Classification totals (ArchLucid)",
            "",
            f"- O: {counts.get('O')} · U: {counts.get('U')} · N: {counts.get('N')} · X: {counts.get('X')} · S: {counts.get('S')}",
            "",
            "## Sessions",
            "",
            "| Session | Source kind | N-share | X-share | Reuse | Decision impact |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
    )

    for session in report.get("sessions") or []:
        if not isinstance(session, dict):
            continue

        lines.append(
            "| {id} | {kind} | {nshare} | {xshare} | {reuse} | {impact} |".format(
                id=session.get("sessionId"),
                kind=session.get("sourceKind"),
                nshare=session.get("nonObviousShare"),
                xshare=session.get("incorrectShare"),
                reuse=session.get("reuseIntent") or "not recorded",
                impact=session.get("decisionImpactMedian"),
            )
        )

    lines.extend(["", "## Guardrails", ""])

    for guardrail in report.get("interpretationGuardrails") or []:
        lines.append(f"- {guardrail}")

    lines.append("")
    return "\n".join(lines)
