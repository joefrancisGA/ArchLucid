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
)

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCdPostDeployProductSmoke(unittest.TestCase):
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
