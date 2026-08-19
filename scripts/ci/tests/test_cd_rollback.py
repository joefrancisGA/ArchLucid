"""Tests for CD application rollback helpers."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI = Path(__file__).resolve().parents[1]
_REPO = Path(__file__).resolve().parents[3]

if str(_CI) not in sys.path:
    sys.path.insert(0, str(_CI))

import cd_capture_last_known_good as capture  # noqa: E402
import cd_plan_rollback as plan  # noqa: E402
from cd_post_deploy_product_smoke import BUILD_IDENTITY_HTML_META_NAME  # noqa: E402
from cd_rollback import (  # noqa: E402
    GitSchemaScanError,
    build_component_record,
    build_lkg_payload,
    build_rollback_report,
    collect_migrations_added_via_git,
    decide_auto_rollback,
    evaluate_schema_compat,
    extract_digest_from_image,
    lkg_has_usable_api,
    render_rollback_report_markdown,
    sql_looks_destructive,
    validate_target_artifact,
    verify_runtime_build_id,
    verify_ui_public_shell_build_id,
)


class CdRollbackTests(unittest.TestCase):
    def test_extract_digest_from_image(self) -> None:
        digest = "sha256:" + ("ab" * 32)
        image = f"myacr.azurecr.io/archlucid-api@{digest}"
        self.assertEqual(extract_digest_from_image(image), digest)
        self.assertIsNone(extract_digest_from_image("myacr.azurecr.io/archlucid-api:abc123"))

    def test_successful_auto_rollback_decision(self) -> None:
        schema = evaluate_schema_compat(
            lkg_build_id="aaa",
            failed_build_id="bbb",
            migrations_added=[("ArchLucid.Persistence/Migrations/300_AddIndex.sql", "CREATE INDEX IX ON dbo.T(Id);")],
        )
        self.assertTrue(schema.compatible)
        decision = decide_auto_rollback(
            flag_enabled=True,
            has_distinct_failed_revision=True,
            lkg_present=True,
            schema=schema,
            smoke_url_configured=True,
        )
        self.assertTrue(decision.should_run)

    def test_missing_rollback_artifact(self) -> None:
        ok, reason = validate_target_artifact(
            build_id="abc123",
            api_digest=None,
            ui_digest=None,
            ui_required=False,
        )
        self.assertFalse(ok)
        self.assertIn("API digest missing", reason)

    def test_rollback_health_build_id_failure(self) -> None:
        ok, reason = verify_runtime_build_id(expected="goodsha", observed="badsha")
        self.assertFalse(ok)
        self.assertIn("!= expected", reason)

    def test_schema_incompatibility_blocks(self) -> None:
        self.assertTrue(sql_looks_destructive("ALTER TABLE dbo.Runs DROP COLUMN Legacy;"))
        schema = evaluate_schema_compat(
            lkg_build_id="old",
            failed_build_id="new",
            migrations_added=[
                (
                    "ArchLucid.Persistence/Migrations/301_DropLegacy.sql",
                    "ALTER TABLE dbo.Runs DROP COLUMN LegacyCol;",
                )
            ],
        )
        self.assertFalse(schema.compatible)
        decision = decide_auto_rollback(
            flag_enabled=True,
            has_distinct_failed_revision=True,
            lkg_present=True,
            schema=schema,
            smoke_url_configured=True,
        )
        self.assertFalse(decision.should_run)
        self.assertIn("Schema gate", decision.reason)

    def test_capture_and_plan_happy_path(self) -> None:
        digest = "sha256:" + ("cd" * 32)

        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            lkg_path = temp / "lkg.json"
            exit_code = capture.main(
                [
                    "--environment",
                    "dev",
                    "--json-out",
                    str(lkg_path),
                    "--api-app",
                    "archlucid-api",
                    "--api-revision",
                    "archlucid-api--good",
                    "--api-image",
                    f"acr.azurecr.io/archlucid-api@{digest}",
                    "--api-env-json",
                    json.dumps([{"name": "ARCHLUCID_BUILD_COMMIT_SHA", "value": "goodsha"}]),
                ]
            )
            self.assertEqual(exit_code, 0)
            lkg = json.loads(lkg_path.read_text(encoding="utf-8"))
            self.assertTrue(lkg_has_usable_api(lkg))

            report_json = temp / "report.json"
            report_md = temp / "report.md"
            plan_out = temp / "plan.json"
            exit_code = plan.main(
                [
                    "--mode",
                    "auto",
                    "--environment",
                    "dev",
                    "--failed-build-id",
                    "badsha",
                    "--lkg-json",
                    str(lkg_path),
                    "--flag-enabled",
                    "--distinct-failed-revision",
                    "--smoke-url-configured",
                    "--skip-git-schema-scan",
                    "--json-out",
                    str(report_json),
                    "--markdown-out",
                    str(report_md),
                    "--plan-out",
                    str(plan_out),
                ]
            )
            self.assertEqual(exit_code, 0)
            plan_payload = json.loads(plan_out.read_text(encoding="utf-8"))
            self.assertTrue(plan_payload["approved"])
            self.assertEqual(plan_payload["targetBuildId"], "goodsha")
            markdown = report_md.read_text(encoding="utf-8")
            self.assertIn("Failed BUILD_ID", markdown)

    def test_manual_missing_artifact_exit_code(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            exit_code = plan.main(
                [
                    "--mode",
                    "manual",
                    "--environment",
                    "production",
                    "--rollback-build-id",
                    "abc123",
                    "--json-out",
                    str(temp / "r.json"),
                    "--markdown-out",
                    str(temp / "r.md"),
                    "--plan-out",
                    str(temp / "p.json"),
                ]
            )
            self.assertEqual(exit_code, 2)

    def test_report_markdown_includes_core_fields(self) -> None:
        report = build_rollback_report(
            environment="staging",
            mode="auto",
            failed_build_id="fail1",
            rollback_target_build_id="good1",
            rollback_result="success",
            verification_result="success",
        )
        md = render_rollback_report_markdown(report)
        self.assertIn("fail1", md)
        self.assertIn("good1", md)
        self.assertIn("success", md)

    def test_component_record_shape(self) -> None:
        digest = "sha256:" + ("11" * 32)
        record = build_component_record(
            role="api",
            app_name="archlucid-api",
            revision="r1",
            image=f"reg/archlucid-api@{digest}",
            build_id="abc",
        )
        payload = build_lkg_payload(environment="dev", api=record)
        self.assertEqual(payload["components"]["api"]["digest"], digest)

    def test_ui_public_shell_build_id_verify(self) -> None:
        html = f'<meta name="{BUILD_IDENTITY_HTML_META_NAME}" content="goodsha" />'
        ok, reason = verify_ui_public_shell_build_id(expected="goodsha", html=html)
        self.assertTrue(ok)
        self.assertIn("matches", reason)
        bad_ok, _ = verify_ui_public_shell_build_id(expected="goodsha", html="<html></html>")
        self.assertFalse(bad_ok)

    def test_schema_scan_fails_closed_when_git_unreachable(self) -> None:
        def _boom(sha: str) -> None:
            raise GitSchemaScanError(f"Cannot resolve git SHA {sha!r} for schema gate")

        with self.assertRaises(GitSchemaScanError):
            collect_migrations_added_via_git(
                repo_root=_REPO,
                lkg_build_id="aaa",
                failed_build_id="bbb",
                ensure_reachable=_boom,
            )

    def test_plan_blocks_when_schema_scan_cannot_resolve_sha(self) -> None:
        digest = "sha256:" + ("ef" * 32)

        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            lkg_path = temp / "lkg.json"
            capture.main(
                [
                    "--environment",
                    "staging",
                    "--json-out",
                    str(lkg_path),
                    "--api-app",
                    "archlucid-api",
                    "--api-revision",
                    "archlucid-api--good",
                    "--api-image",
                    f"acr.azurecr.io/archlucid-api@{digest}",
                    "--api-env-json",
                    json.dumps([{"name": "ARCHLUCID_BUILD_COMMIT_SHA", "value": "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef"}]),
                ]
            )
            # Use a SHA that will not exist in the object store after ensure/fetch attempts.
            exit_code = plan.main(
                [
                    "--mode",
                    "auto",
                    "--environment",
                    "staging",
                    "--failed-build-id",
                    "ffffffffffffffffffffffffffffffffffffffff",
                    "--lkg-json",
                    str(lkg_path),
                    "--flag-enabled",
                    "--distinct-failed-revision",
                    "--smoke-url-configured",
                    "--json-out",
                    str(temp / "r.json"),
                    "--markdown-out",
                    str(temp / "r.md"),
                    "--plan-out",
                    str(temp / "p.json"),
                ]
            )
            self.assertEqual(exit_code, 3)
            plan_payload = json.loads((temp / "p.json").read_text(encoding="utf-8"))
            self.assertFalse(plan_payload["approved"])
            reason = str(plan_payload.get("reason") or "").lower()
            self.assertTrue(
                "cannot resolve" in reason or "schema gate" in reason,
                msg=plan_payload.get("reason"),
            )


if __name__ == "__main__":
    unittest.main()
