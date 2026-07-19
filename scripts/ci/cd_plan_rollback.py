#!/usr/bin/env python3
"""Plan CD application rollback (auto or manual) with schema compatibility gate."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from cd_rollback import (  # noqa: E402
    AutoRollbackDecision,
    GitSchemaScanError,
    SCHEMA_REPORT,
    SchemaCompatResult,
    build_rollback_report,
    collect_migrations_added_via_git,
    decide_auto_rollback,
    evaluate_schema_compat,
    load_json_object,
    lkg_has_usable_api,
    lkg_primary_build_id,
    render_rollback_report_markdown,
    validate_target_artifact,
    write_json,
)
from release_evidence_common import repo_root  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("auto", "manual"), required=True)
    parser.add_argument("--environment", required=True)
    parser.add_argument("--failed-build-id", default="")
    parser.add_argument("--lkg-json", type=Path, default=None)
    parser.add_argument("--rollback-build-id", default="", help="Manual mode target BUILD_ID")
    parser.add_argument("--api-digest", default="", help="Resolved API digest for manual target")
    parser.add_argument("--ui-digest", default="", help="Resolved UI digest for manual target")
    parser.add_argument("--ui-required", action="store_true")
    parser.add_argument("--flag-enabled", action="store_true")
    parser.add_argument("--distinct-failed-revision", action="store_true")
    parser.add_argument("--smoke-url-configured", action="store_true")
    parser.add_argument("--skip-git-schema-scan", action="store_true")
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--plan-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    root = repo_root()
    lkg: dict = {}
    lkg_build_id = ""

    if args.lkg_json is not None and args.lkg_json.is_file():
        lkg = load_json_object(args.lkg_json)
        lkg_build_id = lkg_primary_build_id(lkg)

    if args.mode == "manual":
        target_build_id = (args.rollback_build_id or "").strip()
        ok, artifact_reason = validate_target_artifact(
            build_id=target_build_id,
            api_digest=args.api_digest or None,
            ui_digest=args.ui_digest or None,
            ui_required=args.ui_required,
        )

        if not ok:
            report = build_rollback_report(
                environment=args.environment,
                mode="manual",
                failed_build_id=args.failed_build_id or "(current)",
                rollback_target_build_id=target_build_id,
                rollback_result="blocked",
                verification_result="not_run",
                details={"reason": artifact_reason},
            )
            write_json(args.json_out, report)
            args.markdown_out.write_text(render_rollback_report_markdown(report) + "\n", encoding="utf-8")
            write_json(args.plan_out, {"approved": False, "reason": artifact_reason})
            print(f"ERROR: {artifact_reason}", file=sys.stderr)
            return 2

        failed_for_schema = (args.failed_build_id or "").strip() or "HEAD"

        try:
            migrations_added = (
                []
                if args.skip_git_schema_scan
                else collect_migrations_added_via_git(
                    repo_root=root,
                    lkg_build_id=target_build_id,
                    failed_build_id=failed_for_schema,
                )
            )
        except GitSchemaScanError as exc:
            schema = SchemaCompatResult(False, exc.message)
            report = build_rollback_report(
                environment=args.environment,
                mode="manual",
                failed_build_id=failed_for_schema,
                rollback_target_build_id=target_build_id,
                rollback_result="blocked",
                verification_result="not_run",
                schema=schema,
            )
            write_json(args.json_out, report)
            args.markdown_out.write_text(render_rollback_report_markdown(report) + "\n", encoding="utf-8")
            write_json(args.plan_out, {"approved": False, "reason": exc.message})
            print(f"ERROR: {exc.message}", file=sys.stderr)
            return 3

        schema = evaluate_schema_compat(
            lkg_build_id=target_build_id,
            failed_build_id=failed_for_schema,
            migrations_added=migrations_added,
        )

        if not schema.compatible:
            report = build_rollback_report(
                environment=args.environment,
                mode="manual",
                failed_build_id=failed_for_schema,
                rollback_target_build_id=target_build_id,
                rollback_result="blocked",
                verification_result="not_run",
                schema=schema,
            )
            write_json(args.json_out, report)
            args.markdown_out.write_text(render_rollback_report_markdown(report) + "\n", encoding="utf-8")
            write_json(
                args.plan_out,
                {
                    "approved": False,
                    "reason": schema.reason,
                    "destructiveMigrations": list(schema.destructive_migrations),
                },
            )
            print(f"ERROR: {schema.reason}", file=sys.stderr)
            return 3

        plan = {
            "approved": True,
            "mode": "manual",
            "targetBuildId": target_build_id,
            "apiDigest": args.api_digest,
            "uiDigest": args.ui_digest,
            "reason": "manual rollback approved",
        }
        report = build_rollback_report(
            environment=args.environment,
            mode="manual",
            failed_build_id=failed_for_schema,
            rollback_target_build_id=target_build_id,
            rollback_result="planned",
            verification_result="pending",
            schema=schema,
            details=plan,
        )
        write_json(args.json_out, report)
        args.markdown_out.write_text(render_rollback_report_markdown(report) + "\n", encoding="utf-8")
        write_json(args.plan_out, plan)
        print(json.dumps(plan))
        return 0

    # auto mode
    failed_build_id = (args.failed_build_id or "").strip()
    migrations: list[tuple[str, str]] = []
    git_scan_error: str | None = None

    if lkg_build_id and failed_build_id and not args.skip_git_schema_scan:
        try:
            migrations = collect_migrations_added_via_git(
                repo_root=root,
                lkg_build_id=lkg_build_id,
                failed_build_id=failed_build_id,
            )
        except GitSchemaScanError as exc:
            git_scan_error = exc.message

    if git_scan_error is not None:
        schema = SchemaCompatResult(False, git_scan_error)
    else:
        schema = evaluate_schema_compat(
            lkg_build_id=lkg_build_id or "(missing)",
            failed_build_id=failed_build_id or "(missing)",
            migrations_added=migrations,
        )
    decision: AutoRollbackDecision = decide_auto_rollback(
        flag_enabled=args.flag_enabled,
        has_distinct_failed_revision=args.distinct_failed_revision,
        lkg_present=lkg_has_usable_api(lkg),
        schema=schema,
        smoke_url_configured=args.smoke_url_configured,
    )
    plan = {
        "approved": decision.should_run,
        "mode": "auto",
        "reason": decision.reason,
        "targetBuildId": lkg_build_id,
        "targetApiRevision": (lkg.get("components") or {}).get("api", {}).get("revision", "")
        if isinstance(lkg.get("components"), dict)
        else "",
        "targetUiRevision": (lkg.get("components") or {}).get("ui", {}).get("revision", "")
        if isinstance(lkg.get("components"), dict)
        else "",
        "targetWorkerRevision": (lkg.get("components") or {}).get("worker", {}).get("revision", "")
        if isinstance(lkg.get("components"), dict)
        else "",
        "destructiveMigrations": list(schema.destructive_migrations),
    }
    report = build_rollback_report(
        environment=args.environment,
        mode="auto",
        failed_build_id=failed_build_id,
        rollback_target_build_id=lkg_build_id,
        rollback_result="planned" if decision.should_run else "skipped_or_blocked",
        verification_result="pending" if decision.should_run else "not_run",
        schema=schema,
        details={"decisionReason": decision.reason, **plan},
    )

    if report.get("schema") != SCHEMA_REPORT:
        raise SystemExit("internal report schema mismatch")

    write_json(args.json_out, report)
    args.markdown_out.write_text(render_rollback_report_markdown(report) + "\n", encoding="utf-8")
    write_json(args.plan_out, plan)
    print(json.dumps(plan))

    if not decision.should_run:
        # Exit 0 when merely disabled/skipped; exit 3 when schema blocks human attention.
        if not schema.compatible and args.flag_enabled:
            print(f"ERROR: {decision.reason}", file=sys.stderr)
            return 3

        print(f"Auto-rollback not approved: {decision.reason}")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
