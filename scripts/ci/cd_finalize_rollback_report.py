#!/usr/bin/env python3
"""Finalize a CD rollback report after execute/verify steps."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from cd_rollback import (  # noqa: E402
    SchemaCompatResult,
    build_rollback_report,
    load_json_object,
    render_rollback_report_markdown,
    write_json,
)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--environment", required=True)
    parser.add_argument("--mode", choices=("auto", "manual"), required=True)
    parser.add_argument("--failed-build-id", default="")
    parser.add_argument("--plan-json", type=Path, required=True)
    parser.add_argument("--prior-report-json", type=Path, default=None)
    parser.add_argument("--verification-result", required=True)
    parser.add_argument("--rollback-result", default="")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    plan = load_json_object(args.plan_json)
    schema = None

    if args.prior_report_json is not None and args.prior_report_json.is_file():
        prior = load_json_object(args.prior_report_json)
        sc = prior.get("schemaCompat")

        if isinstance(sc, dict):
            schema = SchemaCompatResult(
                bool(sc.get("compatible")),
                str(sc.get("reason") or ""),
                tuple(sc.get("destructiveMigrations") or ()),
            )

    verification = args.verification_result
    rollback_result = args.rollback_result.strip()

    if not rollback_result:
        rollback_result = "success" if verification != "failure" else "partial_or_failed_verify"

    report = build_rollback_report(
        environment=args.environment,
        mode=args.mode,
        failed_build_id=args.failed_build_id,
        rollback_target_build_id=str(plan.get("targetBuildId") or ""),
        rollback_result=rollback_result,
        verification_result=verification,
        schema=schema,
        details=plan if isinstance(plan, dict) else {},
    )
    write_json(args.json_out, report)
    args.markdown_out.write_text(render_rollback_report_markdown(report) + "\n", encoding="utf-8")
    print(render_rollback_report_markdown(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
