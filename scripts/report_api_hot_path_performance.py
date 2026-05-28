#!/usr/bin/env python3
"""Render buyer-safe API hot-path p95 evidence from k6 summary JSON."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def _load_summary(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} is not a JSON object")
    return payload


def _resolve_fields(payload: dict) -> dict:
    schema = payload.get("schema")
    if schema == "archlucid.k6-production-like-summary.v1":
        return {
            "profile": payload.get("profile") or "production-like-k6",
            "mode": payload.get("mode") or "unknown",
            "baseUrl": payload.get("baseUrl") or "(not recorded)",
            "p95Ms": payload.get("p95Ms"),
            "errorRate": payload.get("errorRate"),
            "slowestRouteTag": payload.get("slowestRouteTag") or "*none*",
            "generatedUtc": payload.get("generatedUtc") or "(not recorded)",
            "evidenceClass": payload.get("evidenceClass") or "production-like-k6",
        }

    metrics = payload.get("metrics") or {}
    duration = metrics.get("http_req_duration") or {}
    failed = metrics.get("http_req_failed") or {}
    duration_values = duration.get("values") or {}
    failed_values = failed.get("values") or {}

    return {
        "profile": payload.get("profile") or "k6-summary-export",
        "mode": payload.get("mode") or "unknown",
        "baseUrl": payload.get("baseUrl") or "(not recorded)",
        "p95Ms": duration_values.get("p(95)"),
        "errorRate": failed_values.get("rate"),
        "slowestRouteTag": payload.get("slowestRouteTag") or "*none*",
        "generatedUtc": payload.get("generatedUtc") or "(not recorded)",
        "evidenceClass": payload.get("evidenceClass") or "k6-summary-export",
    }


def _format_rate(value: object) -> str:
    if value is None:
        return "not recorded"
    try:
        return f"{float(value) * 100:.2f}%"
    except (TypeError, ValueError):
        return str(value)


def _format_ms(value: object) -> str:
    if value is None:
        return "not recorded"
    try:
        return f"{float(value):.1f} ms"
    except (TypeError, ValueError):
        return str(value)


def render_markdown(
    *,
    summary_path: Path | None,
    environment_label: str,
    evidence_class: str,
    fields: dict | None,
    status: str,
    detail: str,
) -> str:
    lines = [
        "# API hot-path performance evidence",
        "",
        "This artifact summarizes k6-derived HTTP latency for operator review. "
        "It is **not** a production SLA certificate.",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Status | **{status}** |",
        f"| Environment label | {environment_label} |",
        f"| Evidence class | {evidence_class} |",
        f"| Detail | {detail} |",
    ]

    if summary_path is not None:
        lines.append(f"| Summary source | `{summary_path.as_posix()}` |")

    if fields is not None:
        lines.extend(
            [
                f"| k6 profile | {fields.get('profile')} |",
                f"| Execution mode label | {fields.get('mode')} |",
                f"| Base URL | {fields.get('baseUrl')} |",
                f"| Global HTTP p95 | {_format_ms(fields.get('p95Ms'))} |",
                f"| HTTP failure rate | {_format_rate(fields.get('errorRate'))} |",
                f"| Slowest tagged route | {fields.get('slowestRouteTag')} |",
                f"| Summary generated UTC | {fields.get('generatedUtc')} |",
            ]
        )

    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            "- **CI smoke** and **local Compose** results are regression guards only; do not quote them as customer-facing SLA proof.",
            "- **Production-like** labels still require an explicit target environment and buyer-safe redaction before external sharing.",
            "- Named SQL p95 (`archlucid_query_p95_ms`) remains a separate database hot-path gate in CI.",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--summary", help="k6 summary JSON path")
    parser.add_argument("--markdown-out", required=True, help="Markdown output path")
    parser.add_argument(
        "--environment-label",
        default="unspecified",
        help="Human-readable environment label (local, staging, production-like, ci-smoke)",
    )
    parser.add_argument(
        "--evidence-class",
        default="attached-k6-summary",
        help="Smoke vs production-like evidence class label",
    )
    args = parser.parse_args()

    summary_path = Path(args.summary) if args.summary else None
    out_path = Path(args.markdown_out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if summary_path is None or not summary_path.is_file():
        markdown = render_markdown(
            summary_path=summary_path,
            environment_label=args.environment_label,
            evidence_class=args.evidence_class,
            fields=None,
            status="SKIPPED",
            detail="No k6 summary JSON was supplied or the path was missing.",
        )
        out_path.write_text(markdown, encoding="utf-8")
        print(f"Wrote skipped performance evidence to {out_path}")
        return 0

    fields = _resolve_fields(_load_summary(summary_path))
    fields["evidenceClass"] = args.evidence_class

    p95 = fields.get("p95Ms")
    status = "COLLECTED" if p95 is not None else "PARTIAL"
    detail = (
        "k6 summary parsed successfully."
        if p95 is not None
        else "Summary parsed, but global HTTP p95 was not present."
    )

    markdown = render_markdown(
        summary_path=summary_path,
        environment_label=args.environment_label,
        evidence_class=args.evidence_class,
        fields=fields,
        status=status,
        detail=detail,
    )
    out_path.write_text(markdown, encoding="utf-8")
    print(f"Wrote performance evidence to {out_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(str(exc), file=sys.stderr)
        raise SystemExit(1) from exc
