"""Unit tests for CD post-deploy product-path smoke."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from cd_post_deploy_product_smoke import (  # noqa: E402
    BUILD_IDENTITY_HTML_META_NAME,
    CONTOSO_AUTHORITY_RUN_BASELINE,
    PUBLIC_SHELL_SMOKE_PATH,
    assert_workflows_declare_product_smoke,
    extract_build_identity_from_html,
    extract_static_asset_path,
    is_strict_environment,
    join_url,
    main,
    run_product_smoke,
    SmokeReport,
    SmokeCheckResult,
    run_with_retries,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCdPostDeployProductSmoke(unittest.TestCase):
    def test_invalid_retry_and_timeout_config_is_a_failed_smoke(self) -> None:
        variants = [
            {"max_attempts": 0}, {"max_attempts": -1}, {"max_attempts": 101},
            {"retry_wait_seconds": float("nan")},
            {"retry_wait_seconds": float("inf")},
            {"retry_wait_seconds": float("-inf")},
            {"retry_wait_seconds": -0.1},
            {"timeout_sec": float("nan")},
            {"timeout_sec": float("inf")},
            {"timeout_sec": 0},
            {"timeout_sec": -1},
        ]
        for config in variants:
            with self.subTest(config=config):
                report = run_product_smoke(
                    environment="staging", expected_build_id="abc",
                    api_base_url="https://api.example.com", api_key="test-key",
                    http_get=lambda *_args: (_ for _ in ()).throw(
                        AssertionError("invalid config must not perform HTTP")
                    ),
                    **config,
                )
                self.assertFalse(report.ok)
                self.assertEqual(report.checks[0].name, "config_retry_controls")

    def test_ui_present_requires_homepage_and_static_asset(self) -> None:
        def getter(url, _headers, _timeout):
            if url.endswith("/health/ready"):
                return 200, '{"status":"Healthy"}'
            if url.endswith("/version"):
                return 200, '{"commitSha":"abc"}'
            if url.endswith("/openapi/v1.json"):
                return 200, '{"info":{"title":"ArchLucid API"}}'
            if url.endswith("/v1/tenant/workspaces"):
                return 200, '{"workspaces":[]}'
            if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                return 200, '{"demoRunId":"demo"}'
            if url.endswith("/api/health"):
                return 200, '{"status":"Healthy","commitSha":"abc"}'
            if url.endswith("/api/proxy/health/ready"):
                return 200, '{"status":"Healthy"}'
            if "/welcome" in url:
                return 200, '<meta name="archlucid:build-commit" content="abc">'
            if url.endswith("/"):
                return 404, "missing UI"
            return 200, "{}"
        report = run_product_smoke(
            environment="staging", expected_build_id="abc",
            api_base_url="https://api.example.com", api_key="key",
            ui_base_url="https://ui.example.com", max_attempts=1,
            retry_wait_seconds=0, http_get=getter,
        )
        homepage = next(check for check in report.checks if check.name == "ui_homepage")
        asset = next(check for check in report.checks if check.name == "ui_static_asset")
        self.assertTrue(homepage.required)
        self.assertTrue(asset.required)
        self.assertFalse(homepage.passed)
        self.assertFalse(asset.passed)
        self.assertFalse(report.ok)

    def test_ui_health_rejects_revision_mismatch(self) -> None:
        def getter(url, _headers, _timeout):
            if url.endswith("/api/health"):
                return 200, '{"status":"Healthy","commitSha":"stale"}'
            if url.endswith("/health/ready") or url.endswith("/api/proxy/health/ready"):
                return 200, '{"status":"Healthy"}'
            if url.endswith("/version"):
                return 200, '{"commitSha":"abc"}'
            if url.endswith("/openapi/v1.json"):
                return 200, '{"info":{"title":"ArchLucid API"}}'
            if url.endswith("/v1/tenant/workspaces"):
                return 200, '{"workspaces":[]}'
            if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                return 200, '{"demoRunId":"demo"}'
            return 404, ""
        report = run_product_smoke(
            environment="staging", expected_build_id="abc",
            api_base_url="https://api.example.com", api_key="key",
            ui_base_url="https://ui.example.com",
            max_attempts=1, retry_wait_seconds=0, http_get=getter,
        )
        health = next(check for check in report.checks if check.name == "ui_process_health")
        self.assertTrue(health.required)
        self.assertFalse(health.passed)
        self.assertIn("does not match", health.detail)

    def test_staging_deployment_rejects_insecure_or_misdirected_origins(self) -> None:
        invalid = (
            "http://api.example.com",
            "https://operator:secret@api.example.com",
            "https://api.example.com?unexpected=true",
            "https://api.example.com#fragment",
            "file:///tmp/health",
            "//api.example.com",
            "https://api.example.com:invalid",
        )
        for target in invalid:
            with self.subTest(target=target):
                report = run_product_smoke(
                    environment="staging", expected_build_id="abc",
                    api_base_url=target, api_key="key", max_attempts=1,
                    http_get=lambda *_args: (_ for _ in ()).throw(
                        AssertionError("unsafe origin must not trigger HTTP")
                    ),
                )
                self.assertFalse(report.ok)
                self.assertEqual(report.checks[0].name, "config_api_base_url")

    def test_ui_origin_is_validated_independently(self) -> None:
        report = run_product_smoke(
            environment="staging", expected_build_id="abc",
            api_base_url="https://api.example.com",
            ui_base_url="http://ui.example.com", api_key="key",
            http_get=lambda *_args: (_ for _ in ()).throw(
                AssertionError("unsafe UI origin must not trigger HTTP")
            ),
        )
        self.assertFalse(report.ok)
        self.assertEqual(report.checks[0].name, "config_ui_base_url")

    def test_empty_smoke_report_cannot_pass(self) -> None:
        report = SmokeReport(environment="production", expected_build_id="abc")
        self.assertFalse(report.ok)

    def test_required_skipped_smoke_check_cannot_report_pass(self) -> None:
        report = SmokeReport(environment="staging", expected_build_id="abc")
        report.checks.append(SmokeCheckResult(
            name="authenticated_read", required=True, passed=True,
            duration_ms=0, detail="not executed", skipped=True,
        ))
        self.assertFalse(report.ok)

    def test_optional_skipped_smoke_check_remains_allowed(self) -> None:
        report = SmokeReport(environment="dev", expected_build_id="abc")
        report.checks.append(SmokeCheckResult(
            name="optional_preview", required=False, passed=False,
            duration_ms=0, detail="not executed", skipped=True,
        ))
        self.assertTrue(report.ok)

    def test_malformed_required_api_json_fails_without_crashing(self) -> None:
        build_id = "a" * 40
        for url_suffix in ("/health/ready", "/version", "/openapi/v1.json",
                           "/v1/tenant/workspaces", "/v1/pilots/why-archlucid-snapshot"):
            with self.subTest(url=url_suffix):
                def getter(url, _headers, _timeout):
                    if url.endswith(url_suffix):
                        return 200, "[]"
                    if url.endswith("/health/ready"):
                        return 200, '{"status":"Healthy"}'
                    if url.endswith("/version"):
                        return 200, json.dumps({"commitSha": build_id})
                    if url.endswith("/openapi/v1.json"):
                        return 200, '{"info":{"title":"ArchLucid API"}}'
                    if url.endswith("/v1/tenant/workspaces"):
                        return 200, '{"workspaces":[]}'
                    if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                        return 200, '{"demoRunId":"demo"}'
                    return 200, "{}"
                report = run_product_smoke(
                    environment="staging", expected_build_id=build_id,
                    api_base_url="https://api.example.com", api_key="test-key",
                    max_attempts=1, retry_wait_seconds=0, http_get=getter,
                )
                self.assertFalse(report.ok)
                self.assertTrue(any(check.required and not check.passed for check in report.checks))

    def test_probe_exception_is_reported_as_failed_check(self) -> None:
        attempts = [0]
        def unavailable():
            attempts[0] += 1
            raise RuntimeError("sensitive transport details")
        result = run_with_retries(
            name="api_health_ready", required=True, attempts=2,
            wait_seconds=0, operation=unavailable,
        )
        self.assertFalse(result.passed)
        self.assertEqual(attempts[0], 2)
        self.assertIn("RuntimeError", result.detail)
        self.assertNotIn("sensitive transport details", result.detail)

    def test_bff_200_without_healthy_json_cannot_pass(self) -> None:
        for response in ("not-json", "[]", "{}", '{"status":"Degraded"}'):
            with self.subTest(response=response):
                def getter(url, _headers, _timeout):
                    if url.endswith("/api/proxy/health/ready"):
                        return 200, response
                    if url.endswith("/health/ready"):
                        return 200, '{"status":"Healthy"}'
                    if url.endswith("/version"):
                        return 200, '{"commitSha":"abc"}'
                    if url.endswith("/openapi/v1.json"):
                        return 200, '{"info":{"title":"ArchLucid API"}}'
                    if url.endswith("/v1/tenant/workspaces"):
                        return 200, '{"workspaces":[]}'
                    if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                        return 200, '{"demoRunId":"demo"}'
                    if url.endswith("/api/health"):
                        return 200, '{"status":"Healthy","commitSha":"abc"}'
                    return 200, "{}"
                report = run_product_smoke(
                    environment="staging", expected_build_id="abc",
                    api_base_url="https://api.example.com", api_key="key",
                    ui_base_url="https://ui.example.com",
                    max_attempts=1, retry_wait_seconds=0, http_get=getter,
                )
                bff = next(check for check in report.checks if check.name == "ui_bff_health_ready")
                self.assertTrue(bff.required)
                self.assertFalse(bff.passed)
                self.assertFalse(report.ok)

    def test_bearer_only_staging_runs_authenticated_probes(self) -> None:
        observed_auth = []
        def getter(url, headers, _timeout):
            if url.endswith(("/openapi/v1.json", "/v1/tenant/workspaces",
                             "/v1/pilots/why-archlucid-snapshot")):
                observed_auth.append(headers.get("Authorization"))
            if url.endswith("/health/ready"):
                return 200, '{"status":"Healthy"}'
            if url.endswith("/version"):
                return 200, '{"commitSha":"abc"}'
            if url.endswith("/openapi/v1.json"):
                return 200, '{"info":{"title":"ArchLucid API"}}'
            if url.endswith("/v1/tenant/workspaces"):
                return 200, '{"workspaces":[]}'
            if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                return 200, '{"demoRunId":"demo"}'
            return 200, "{}"
        report = run_product_smoke(
            environment="staging", expected_build_id="abc",
            api_base_url="https://api.example.com",
            api_key="", bearer_token="test-token",
            max_attempts=1, retry_wait_seconds=0, http_get=getter,
        )
        required_reads = {"api_openapi_authenticated", "api_tenant_workspaces_read",
                          "api_why_archlucid_snapshot_read"}
        self.assertTrue(all(check.passed for check in report.checks
                            if check.name in required_reads), report.summary_markdown())
        self.assertEqual(observed_auth, ["Bearer test-token"] * 3)

    def test_strict_environments(self) -> None:
        self.assertTrue(is_strict_environment("staging"))
        self.assertTrue(is_strict_environment("Production"))
        self.assertFalse(is_strict_environment("dev"))

    def test_join_url_and_static_extract(self) -> None:
        self.assertEqual(
            join_url("https://api.example.com", "/health/ready"),
            "https://api.example.com/health/ready",
        )
        self.assertEqual(
            extract_static_asset_path('<script src="/_next/static/chunks/main.js"></script>'),
            "/_next/static/chunks/main.js",
        )
        self.assertEqual(
            extract_build_identity_from_html(
                f'<meta name="{BUILD_IDENTITY_HTML_META_NAME}" content="abc123" />'
            ),
            "abc123",
        )

    def test_public_shell_smoke_path_constant(self) -> None:
        self.assertEqual(PUBLIC_SHELL_SMOKE_PATH, "/welcome")

    def test_dev_skips_when_api_url_missing(self) -> None:
        report = run_product_smoke(
            environment="dev",
            expected_build_id="abc",
            api_base_url="",
            api_key="",
            http_get=lambda *_a, **_k: (_ for _ in ()).throw(AssertionError("no http")),
        )

        self.assertTrue(report.ok)
        self.assertTrue(any(c.skipped and c.name == "config_api_base_url" for c in report.checks))

    def test_staging_fails_when_api_url_missing(self) -> None:
        report = run_product_smoke(
            environment="staging",
            expected_build_id="abc",
            api_base_url="",
            api_key="key",
            http_get=lambda *_a, **_k: (200, "{}"),
        )

        self.assertFalse(report.ok)

    def test_full_pass_with_ui(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"
        responses: dict[str, tuple[int, str]] = {
            "/health/live": (200, '{"status":"Healthy"}'),
            "/health/ready": (200, '{"status":"Healthy"}'),
            "/version": (200, json.dumps({"commitSha": build_id})),
            "/openapi/v1.json": (200, json.dumps({"info": {"title": "ArchLucid API"}})),
            "/v1/tenant/workspaces": (200, json.dumps({"workspaces": [{"workspaceId": "w1"}]})),
            "/v1/pilots/why-archlucid-snapshot": (
                200,
                json.dumps({"demoRunId": "demo", "auditRowCount": 2}),
            ),
            f"/v1/authority/runs/{CONTOSO_AUTHORITY_RUN_BASELINE}/summary": (200, "{}"),
            "/api/health": (
                200,
                json.dumps({"status": "Healthy", "commitSha": build_id}),
            ),
            "/api/proxy/health/ready": (200, json.dumps({"status": "Healthy"})),
            "/": (
                200,
                (
                    '<html><head>'
                    f'<meta name="{BUILD_IDENTITY_HTML_META_NAME}" content="{build_id}" />'
                    '</head><script src="/_next/static/chunks/main-abc.js"></script></html>'
                ),
            ),
            f"{PUBLIC_SHELL_SMOKE_PATH}": (
                200,
                f'<html><head><meta name="{BUILD_IDENTITY_HTML_META_NAME}" content="{build_id}" /></head></html>',
            ),
            "/_next/static/chunks/main-abc.js": (200, "/*js*/"),
        }

        def http_get(url: str, _headers: dict[str, str], _timeout: float) -> tuple[int, str]:
            path = url.split("://", 1)[-1]
            path = "/" + path.split("/", 1)[1] if "/" in path else "/"
            path = path.split("?", 1)[0]

            for suffix, payload in responses.items():
                if path == suffix or path.endswith(suffix):
                    return payload

            return 404, "missing"

        report = run_product_smoke(
            environment="staging",
            expected_build_id=build_id,
            api_base_url="https://api.example.com",
            api_key="secret-key",
            ui_base_url="https://ui.example.com",
            max_attempts=1,
            retry_wait_seconds=0,
            http_get=http_get,
        )

        self.assertTrue(report.ok, report.summary_markdown())
        self.assertEqual(report.observed_api_build_id, build_id)
        self.assertEqual(report.observed_ui_build_id, build_id)
        self.assertEqual(report.observed_ui_public_page_build_id, build_id)
        self.assertIn("ui_public_shell_build_id", report.summary_markdown())
        self.assertIn("Journey approximated", report.summary_markdown())
        self.assertIn("api_tenant_workspaces_read", report.summary_markdown())

    def test_dev_requires_contoso_summary_when_api_key_present(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"

        def http_get(url: str, _headers: dict[str, str], _timeout: float) -> tuple[int, str]:
            if url.endswith("/health/live") or url.endswith("/health/ready"):
                return 200, '{"status":"Healthy"}'

            if url.endswith("/version"):
                return 200, json.dumps({"commitSha": build_id})

            if url.endswith("/openapi/v1.json"):
                return 200, json.dumps({"info": {"title": "ArchLucid API"}})

            if url.endswith("/v1/tenant/workspaces"):
                return 200, json.dumps({"workspaces": []})

            if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                return 200, json.dumps({"demoRunId": "demo", "auditRowCount": 0})

            if f"/v1/authority/runs/{CONTOSO_AUTHORITY_RUN_BASELINE}/summary" in url:
                return 404, ""

            return 404, ""

        report = run_product_smoke(
            environment="dev",
            expected_build_id=build_id,
            api_base_url="https://api.example.com",
            api_key="secret-key",
            max_attempts=1,
            retry_wait_seconds=0,
            http_get=http_get,
        )

        self.assertFalse(report.ok)
        contoso = [c for c in report.checks if c.name == "api_contoso_run_summary"][0]
        self.assertTrue(contoso.required)
        self.assertFalse(contoso.passed)

    def test_staging_contoso_summary_optional_on_404(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"

        def http_get(url: str, _headers: dict[str, str], _timeout: float) -> tuple[int, str]:
            if url.endswith("/health/live") or url.endswith("/health/ready"):
                return 200, '{"status":"Healthy"}'

            if url.endswith("/version"):
                return 200, json.dumps({"commitSha": build_id})

            if url.endswith("/openapi/v1.json"):
                return 200, json.dumps({"info": {"title": "ArchLucid API"}})

            if url.endswith("/v1/tenant/workspaces"):
                return 200, json.dumps({"workspaces": []})

            if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                return 200, json.dumps({"demoRunId": "demo", "auditRowCount": 0})

            if f"/v1/authority/runs/{CONTOSO_AUTHORITY_RUN_BASELINE}/summary" in url:
                return 404, ""

            return 404, ""

        report = run_product_smoke(
            environment="staging",
            expected_build_id=build_id,
            api_base_url="https://api.example.com",
            api_key="secret-key",
            max_attempts=1,
            retry_wait_seconds=0,
            http_get=http_get,
        )

        self.assertTrue(report.ok, report.summary_markdown())
        contoso = [c for c in report.checks if c.name == "api_contoso_run_summary"][0]
        self.assertFalse(contoso.required)
        self.assertFalse(contoso.passed)

    def test_required_product_read_failure_fails_report(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"

        def http_get(url: str, _headers: dict[str, str], _timeout: float) -> tuple[int, str]:
            if url.endswith("/health/live") or url.endswith("/health/ready"):
                return 200, '{"status":"Healthy"}'

            if url.endswith("/version"):
                return 200, json.dumps({"commitSha": build_id})

            if url.endswith("/openapi/v1.json"):
                return 200, json.dumps({"info": {"title": "ArchLucid API"}})

            if url.endswith("/v1/tenant/workspaces"):
                return 403, '{"title":"Forbidden"}'

            if url.endswith("/v1/pilots/why-archlucid-snapshot"):
                return 200, json.dumps({"demoRunId": "demo", "auditRowCount": 0})

            return 404, ""

        report = run_product_smoke(
            environment="production",
            expected_build_id=build_id,
            api_base_url="https://api.example.com",
            api_key="secret-key",
            max_attempts=1,
            retry_wait_seconds=0,
            http_get=http_get,
        )

        self.assertFalse(report.ok)
        failed = [c for c in report.checks if c.name == "api_tenant_workspaces_read"][0]
        self.assertFalse(failed.passed)
        self.assertNotIn("secret-key", failed.detail)

    def test_assert_workflows_detects_missing_markers(self) -> None:
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            wf = root / ".github" / "workflows"
            wf.mkdir(parents=True)
            (wf / "cd.yml").write_text("# empty\n", encoding="utf-8")
            (wf / "cd-staging-on-merge.yml").write_text("# empty\n", encoding="utf-8")
            errors = assert_workflows_declare_product_smoke(root)
            self.assertTrue(any("missing marker" in e for e in errors))

    def test_assert_workflows_on_real_repo(self) -> None:
        errors = assert_workflows_declare_product_smoke(REPO_ROOT)
        self.assertEqual(errors, [])
        self.assertEqual(main(["--assert-workflows", "--repo-root", str(REPO_ROOT)]), 0)


if __name__ == "__main__":
    unittest.main()
