#!/usr/bin/env python3
"""CD post-deploy product-path smoke: beyond infrastructure HTTP 200.

Reuses the same secrets/URLs as CD health + deployment-evidence. Adds a safe
authenticated DB-backed read, UI process health, and UI→API BFF probe.

Self-test: ``python -m unittest discover -s scripts/ci/tests -p "test_cd_post_deploy_product_smoke.py"``.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable
from urllib.parse import urljoin, urlparse

WORKFLOW_RELATIVE_PATHS = (
    ".github/workflows/cd.yml",
    ".github/workflows/cd-staging-on-merge.yml",
)

WORKFLOW_MARKERS = (
    "cd_post_deploy_product_smoke.py",
    "Smoke — product path",
)

CONTOSO_AUTHORITY_RUN_BASELINE = "6e8c4a10-2b1f-4c9a-9d3e-10b2a4f0c501"

# Public marketing page used for cache-bypass shell BUILD_ID verification (TB-868).
PUBLIC_SHELL_SMOKE_PATH = "/welcome"

BUILD_IDENTITY_HTML_META_NAME = "archlucid:build-commit"

BUILD_IDENTITY_META_PATTERN = re.compile(
    r'<meta\s+[^>]*(?:'
    rf'name=["\']{re.escape(BUILD_IDENTITY_HTML_META_NAME)}["\'][^>]*content=["\']([^"\']+)["\']'
    rf'|content=["\']([^"\']+)["\'][^>]*name=["\']{re.escape(BUILD_IDENTITY_HTML_META_NAME)}["\'])'
    r"[^>]*>",
    re.IGNORECASE,
)

HttpGet = Callable[[str, dict[str, str], float], tuple[int, str]]


@dataclass(frozen=True)
class SmokeCheckResult:
    name: str
    required: bool
    passed: bool
    duration_ms: int
    detail: str
    skipped: bool = False


@dataclass
class SmokeReport:
    environment: str
    expected_build_id: str
    observed_api_build_id: str = ""
    observed_ui_build_id: str = ""
    observed_ui_public_page_build_id: str = ""
    checks: list[SmokeCheckResult] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        for check in self.checks:
            if check.skipped:
                continue

            if check.required and not check.passed:
                return False

        return True

    def summary_markdown(self) -> str:
        lines = [
            "## CD product-path smoke",
            "",
            f"- Environment: `{self.environment}`",
            f"- Expected BUILD_ID: `{self.expected_build_id or '(unset)'}`",
            f"- Observed API commitSha: `{self.observed_api_build_id or '(n/a)'}`",
            f"- Observed UI commitSha: `{self.observed_ui_build_id or '(n/a)'}`",
            f"- Observed UI public-page commitSha: `{self.observed_ui_public_page_build_id or '(n/a)'}`",
            f"- Overall: **{'PASS' if self.ok else 'FAIL'}**",
            "",
            "| Check | Required | Result | Duration (ms) | Detail |",
            "| --- | --- | --- | ---: | --- |",
        ]

        for check in self.checks:
            if check.skipped:
                result = "SKIP"
            elif check.passed:
                result = "PASS"
            else:
                result = "FAIL"

            required = "yes" if check.required else "optional"
            detail = check.detail.replace("|", "\\|").replace("\n", " ")
            lines.append(
                f"| `{check.name}` | {required} | {result} | {check.duration_ms} | {detail} |"
            )

        lines.extend(
            [
                "",
                "### Journey approximated",
                "",
                "Operator opens the UI shell, the BFF reaches the API, and an authenticated "
                "read loads tenant workspaces (SQL-backed) — the start of an operator session "
                "against seeded scope. Does **not** prove review create/commit, paid AI, "
                "notifications, or a full browser login.",
                "",
            ]
        )

        return "\n".join(lines)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize(value: str | None) -> str:
    if value is None:
        return ""

    return str(value).strip()


def is_strict_environment(environment: str) -> bool:
    return normalize(environment).lower() in {"staging", "production"}


def default_http_get(url: str, headers: dict[str, str], timeout_sec: float) -> tuple[int, str]:
    request = urllib.request.Request(url, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(request, timeout=timeout_sec) as response:
            body = response.read().decode("utf-8", errors="replace")
            return int(response.status), body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace") if exc.fp is not None else ""
        return int(exc.code), body
    except Exception as exc:  # noqa: BLE001 — surface transport failures as check detail
        return 0, f"{type(exc).__name__}: {exc}"


def redact_secrets(text: str, api_key: str, bearer_token: str = "") -> str:
    redacted = text

    if api_key:
        redacted = redacted.replace(api_key, "***")

    if bearer_token:
        redacted = redacted.replace(bearer_token, "***")

    return redacted[:400]


def join_url(base: str, path: str) -> str:
    base_n = normalize(base).rstrip("/") + "/"
    path_n = path if path.startswith("/") else f"/{path}"
    return urljoin(base_n, path_n.lstrip("/"))


def extract_static_asset_path(html: str) -> str | None:
    match = re.search(r'(/_next/static/[^"\'\s>]+)', html)

    if match is None:
        return None

    return match.group(1)


def extract_build_identity_from_html(html: str) -> str | None:
    match = BUILD_IDENTITY_META_PATTERN.search(html)

    if match is None:
        return None

    value = (match.group(1) or match.group(2) or "").strip()

    if not value:
        return None

    return value


def cache_bypass_request_headers(*, accept: str) -> dict[str, str]:
    return {
        "Accept": accept,
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache",
    }


def run_with_retries(
    *,
    name: str,
    required: bool,
    attempts: int,
    wait_seconds: float,
    operation: Callable[[], tuple[bool, str]],
) -> SmokeCheckResult:
    max_attempts = max(1, attempts)
    last_detail = ""
    started = time.perf_counter()

    for attempt in range(1, max_attempts + 1):
        ok, detail = operation()
        last_detail = detail

        if ok:
            duration_ms = int((time.perf_counter() - started) * 1000)
            return SmokeCheckResult(name, required, True, duration_ms, detail)

        if attempt < max_attempts:
            time.sleep(max(0.0, wait_seconds))

    duration_ms = int((time.perf_counter() - started) * 1000)
    return SmokeCheckResult(
        name,
        required,
        False,
        duration_ms,
        f"{last_detail} (after {max_attempts} attempt(s))",
    )


def run_product_smoke(
    *,
    environment: str,
    expected_build_id: str,
    api_base_url: str,
    api_key: str,
    bearer_token: str = "",
    ui_base_url: str = "",
    max_attempts: int = 6,
    retry_wait_seconds: float = 10.0,
    timeout_sec: float = 60.0,
    http_get: HttpGet | None = None,
) -> SmokeReport:
    getter = http_get if http_get is not None else default_http_get
    report = SmokeReport(
        environment=normalize(environment) or "unknown",
        expected_build_id=normalize(expected_build_id),
    )
    api_base = normalize(api_base_url)
    key = normalize(api_key)
    bearer = normalize(bearer_token)
    ui_base = normalize(ui_base_url)
    strict = is_strict_environment(environment)
    attempts = max(1, int(max_attempts))
    wait = max(0.0, float(retry_wait_seconds))

    if not api_base:
        detail = "SMOKE_TEST_BASE_URL / --api-base-url is required for staging/production"
        report.checks.append(
            SmokeCheckResult(
                "config_api_base_url",
                required=strict,
                passed=not strict,
                duration_ms=0,
                detail=detail if strict else "API base URL unset — skipping product smoke (dev)",
                skipped=not strict,
            )
        )

        if strict:
            return report

        return report

    if not key and not bearer:
        report.checks.append(
            SmokeCheckResult(
                "config_api_key",
                required=strict,
                passed=not strict,
                duration_ms=0,
                detail="ARCHLUCID_API_KEY or ARCHLUCID_BEARER_TOKEN required for authenticated product read"
                if strict
                else "API key / bearer token unset — skipping authenticated product checks (dev)",
                skipped=not strict,
            )
        )

        if strict:
            return report

    auth_headers = {"Accept": "application/json"}

    if bearer:
        auth_headers["Authorization"] = f"Bearer {bearer}"
    elif key:
        auth_headers["X-Api-Key"] = key

    anon_headers = {"Accept": "application/json"}

    def get(url: str, headers: dict[str, str]) -> tuple[int, str]:
        return getter(url, headers, timeout_sec)

    # --- required API infrastructure (also summarized here for one table) ---
    def check_live() -> tuple[bool, str]:
        code, body = get(join_url(api_base, "/health/live"), anon_headers)
        return code == 200, redact_secrets(f"HTTP {code}", key, bearer)

    report.checks.append(
        run_with_retries(
            name="api_health_live",
            required=True,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_live,
        )
    )

    def check_ready() -> tuple[bool, str]:
        code, body = get(join_url(api_base, "/health/ready"), anon_headers)

        if code != 200:
            return False, redact_secrets(f"HTTP {code}", key, bearer)

        try:
            status = json.loads(body).get("status")
        except json.JSONDecodeError:
            return False, "HTTP 200 but body is not JSON"

        return status == "Healthy", f"HTTP 200 status={status!r}"

    report.checks.append(
        run_with_retries(
            name="api_health_ready",
            required=True,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_ready,
        )
    )

    def check_build_id() -> tuple[bool, str]:
        code, body = get(join_url(api_base, "/version"), anon_headers)

        if code != 200:
            return False, f"HTTP {code}"

        try:
            commit = str(json.loads(body).get("commitSha") or "").strip()
        except json.JSONDecodeError:
            return False, "HTTP 200 but body is not JSON"

        report.observed_api_build_id = commit

        if not report.expected_build_id:
            return False, "expected BUILD_ID unset"

        if commit != report.expected_build_id:
            return False, f"commitSha={commit!r} != BUILD_ID={report.expected_build_id!r}"

        return True, f"commitSha matches BUILD_ID"

    report.checks.append(
        run_with_retries(
            name="api_build_id",
            required=True,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_build_id,
        )
    )

    def check_openapi() -> tuple[bool, str]:
        if not key:
            return False, "API key missing"

        code, body = get(join_url(api_base, "/openapi/v1.json"), auth_headers)

        if code != 200:
            return False, f"HTTP {code}"

        try:
            title = str(json.loads(body).get("info", {}).get("title") or "").strip()
        except json.JSONDecodeError:
            return False, "HTTP 200 but body is not JSON"

        if not title:
            return False, "missing info.title"

        return True, f"title={title!r}"

    report.checks.append(
        run_with_retries(
            name="api_openapi_authenticated",
            required=bool(key) or strict,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_openapi,
        )
    )

    # Authenticated SQL-backed tenant workspace list (non-mutating).
    def check_workspaces() -> tuple[bool, str]:
        if not key:
            return False, "API key missing"

        code, body = get(join_url(api_base, "/v1/tenant/workspaces"), auth_headers)

        if code != 200:
            return False, redact_secrets(f"HTTP {code} {body[:160]}", key, bearer)

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return False, "HTTP 200 but body is not JSON"

        workspaces = payload.get("workspaces")

        if not isinstance(workspaces, list):
            return False, "JSON missing workspaces array"

        return True, f"workspaces={len(workspaces)}"

    report.checks.append(
        run_with_retries(
            name="api_tenant_workspaces_read",
            required=bool(key) or strict,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_workspaces,
        )
    )

    # Why-ArchLucid snapshot: auth + audit-scope SQL read + demo run id constant.
    def check_why_snapshot() -> tuple[bool, str]:
        if not key:
            return False, "API key missing"

        code, body = get(join_url(api_base, "/v1/pilots/why-archlucid-snapshot"), auth_headers)

        if code != 200:
            return False, redact_secrets(f"HTTP {code} {body[:160]}", key, bearer)

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return False, "HTTP 200 but body is not JSON"

        demo_run_id = str(payload.get("demoRunId") or "").strip()

        if not demo_run_id:
            return False, "missing demoRunId"

        return True, f"demoRunId present auditRowCount={payload.get('auditRowCount')}"

    report.checks.append(
        run_with_retries(
            name="api_why_archlucid_snapshot_read",
            required=bool(key) or strict,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_why_snapshot,
        )
    )

    # Contoso baseline: required on hosted CD target=dev (always-seeded showcase); optional elsewhere.
    contoso_required = normalize(environment).lower() == "dev" and bool(key)

    def check_contoso() -> tuple[bool, str]:
        if not key:
            return False, "API key missing"

        path = f"/v1/authority/runs/{CONTOSO_AUTHORITY_RUN_BASELINE}/summary"
        code, body = get(join_url(api_base, path), auth_headers)

        if code == 404:
            detail = "HTTP 404 (demo seed not present)"
            if contoso_required:
                return False, f"{detail} — required on target=dev"

            return False, f"{detail} — optional"

        if code != 200:
            return False, redact_secrets(f"HTTP {code}", key, bearer)

        return True, "Contoso baseline summary HTTP 200"

    report.checks.append(
        run_with_retries(
            name="api_contoso_run_summary",
            required=contoso_required,
            attempts=min(2, attempts) if not contoso_required else attempts,
            wait_seconds=wait,
            operation=check_contoso,
        )
    )

    ui_required = bool(ui_base)

    if not ui_base:
        report.checks.append(
            SmokeCheckResult(
                "ui_base_url",
                required=False,
                passed=True,
                duration_ms=0,
                detail="UI base URL unset — UI product checks skipped",
                skipped=True,
            )
        )
        return report

    def check_ui_health() -> tuple[bool, str]:
        code, body = get(join_url(ui_base, "/api/health"), anon_headers)

        if code != 200:
            return False, f"HTTP {code}"

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            return False, "HTTP 200 but body is not JSON"

        status = str(payload.get("status") or "").strip()
        commit = str(payload.get("commitSha") or "").strip()
        report.observed_ui_build_id = commit

        if status != "Healthy":
            return False, f"status={status!r}"

        return True, f"Healthy commitSha={commit or 'unknown'}"

    report.checks.append(
        run_with_retries(
            name="ui_process_health",
            required=ui_required,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_ui_health,
        )
    )

    def check_ui_bff() -> tuple[bool, str]:
        code, body = get(join_url(ui_base, "/api/proxy/health/ready"), anon_headers)

        if code != 200:
            return False, redact_secrets(f"HTTP {code} {body[:160]}", key, bearer)

        try:
            status = json.loads(body).get("status")
        except json.JSONDecodeError:
            # Some proxy paths may wrap; accept HTTP 200 as BFF reachability.
            return True, "HTTP 200 (non-JSON body accepted for BFF reachability)"

        if status is not None and status != "Healthy":
            return False, f"upstream status={status!r}"

        return True, f"BFF→API ready status={status!r}"

    report.checks.append(
        run_with_retries(
            name="ui_bff_health_ready",
            required=ui_required,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_ui_bff,
        )
    )

    shell_build_required = ui_required and bool(normalize(report.expected_build_id))

    def check_public_shell_build_id() -> tuple[bool, str]:
        if not report.expected_build_id:
            return False, "expected BUILD_ID unset"

        cache_bust_query = f"{PUBLIC_SHELL_SMOKE_PATH}?_shell_smoke={int(time.time())}"
        code, body = get(
            join_url(ui_base, cache_bust_query),
            cache_bypass_request_headers(accept="text/html"),
        )

        if code != 200:
            return False, f"HTTP {code}"

        commit = extract_build_identity_from_html(body) or ""
        report.observed_ui_public_page_build_id = commit

        if not commit:
            return False, f"missing {BUILD_IDENTITY_HTML_META_NAME!r} meta on {PUBLIC_SHELL_SMOKE_PATH}"

        if commit != report.expected_build_id:
            return False, (
                f"public-page commit={commit!r} != BUILD_ID={report.expected_build_id!r}"
            )

        return True, f"{PUBLIC_SHELL_SMOKE_PATH} meta matches BUILD_ID"

    report.checks.append(
        run_with_retries(
            name="ui_public_shell_build_id",
            required=shell_build_required,
            attempts=attempts,
            wait_seconds=wait,
            operation=check_public_shell_build_id,
        )
    )

    def check_homepage() -> tuple[bool, str]:
        code, body = get(join_url(ui_base, "/"), {"Accept": "text/html"})
        return code == 200, f"HTTP {code} bytes={len(body)}"

    report.checks.append(
        run_with_retries(
            name="ui_homepage",
            required=False,
            attempts=min(2, attempts),
            wait_seconds=wait,
            operation=check_homepage,
        )
    )

    def check_static_asset() -> tuple[bool, str]:
        code, html = get(join_url(ui_base, "/"), {"Accept": "text/html"})

        if code != 200:
            return False, f"homepage HTTP {code}"

        asset = extract_static_asset_path(html)

        if asset is None:
            return False, "no /_next/static/… reference in homepage HTML"

        asset_url = join_url(ui_base, asset)
        # Same-origin asset; Host must match UI.
        if urlparse(asset_url).netloc != urlparse(ui_base).netloc:
            return False, "asset URL host mismatch"

        asset_code, _ = get(asset_url, {"Accept": "*/*"})
        return asset_code == 200, f"{asset} → HTTP {asset_code}"

    report.checks.append(
        run_with_retries(
            name="ui_static_asset",
            required=False,
            attempts=1,
            wait_seconds=0,
            operation=check_static_asset,
        )
    )

    return report


def assert_workflows_declare_product_smoke(repo: Path | None = None) -> list[str]:
    root = repo if repo is not None else repo_root()
    errors: list[str] = []

    for relative in WORKFLOW_RELATIVE_PATHS:
        path = root / relative

        if not path.is_file():
            errors.append(f"missing workflow: {relative}")
            continue

        text = path.read_text(encoding="utf-8")

        for marker in WORKFLOW_MARKERS:
            if marker not in text:
                errors.append(f"{relative}: missing marker {marker!r}")

    return errors


def _env(name: str) -> str:
    return normalize(os.environ.get(name))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assert-workflows", action="store_true")
    parser.add_argument("--repo-root", type=Path, default=None)
    parser.add_argument("--environment", default=_env("CD_TARGET_ENVIRONMENT") or _env("ENVIRONMENT") or "dev")
    parser.add_argument("--expected-build-id", default=_env("BUILD_ID") or _env("GITHUB_SHA"))
    parser.add_argument("--api-base-url", default=_env("SMOKE_TEST_BASE_URL"))
    parser.add_argument("--api-key", default=_env("ARCHLUCID_API_KEY"))
    parser.add_argument("--bearer-token", default=_env("ARCHLUCID_BEARER_TOKEN"))
    parser.add_argument("--ui-base-url", default=_env("SMOKE_UI_BASE_URL"))
    parser.add_argument("--max-attempts", type=int, default=int(_env("CD_POST_DEPLOY_MAX_ATTEMPTS") or "6"))
    parser.add_argument(
        "--retry-wait-seconds",
        type=float,
        default=float(_env("CD_POST_DEPLOY_RETRY_WAIT_SECONDS") or "10"),
    )
    parser.add_argument("--timeout-sec", type=float, default=60.0)
    parser.add_argument("--summary-path", type=Path, default=None)
    parser.add_argument("--json-path", type=Path, default=None)
    args = parser.parse_args(argv)

    if args.assert_workflows:
        errors = assert_workflows_declare_product_smoke(args.repo_root)

        if errors:
            print("cd_post_deploy_product_smoke: FAILED — workflow drift:", file=sys.stderr)

            for error in errors:
                print(f"  {error}", file=sys.stderr)

            return 1

        print(
            "cd_post_deploy_product_smoke: OK — CD workflows declare product-path smoke "
            f"({len(WORKFLOW_RELATIVE_PATHS)} file(s))."
        )
        return 0

    report = run_product_smoke(
        environment=args.environment,
        expected_build_id=args.expected_build_id,
        api_base_url=args.api_base_url,
        api_key=args.api_key,
        bearer_token=args.bearer_token,
        ui_base_url=args.ui_base_url,
        max_attempts=args.max_attempts,
        retry_wait_seconds=args.retry_wait_seconds,
        timeout_sec=args.timeout_sec,
    )
    summary = report.summary_markdown()
    print(summary)

    if args.summary_path is not None:
        args.summary_path.parent.mkdir(parents=True, exist_ok=True)
        args.summary_path.write_text(summary, encoding="utf-8")

    if args.json_path is not None:
        payload = {
            "ok": report.ok,
            "environment": report.environment,
            "expectedBuildId": report.expected_build_id,
            "observedApiBuildId": report.observed_api_build_id,
            "observedUiBuildId": report.observed_ui_build_id,
            "observedUiPublicPageBuildId": report.observed_ui_public_page_build_id,
            "checks": [
                {
                    "name": c.name,
                    "required": c.required,
                    "passed": c.passed,
                    "skipped": c.skipped,
                    "durationMs": c.duration_ms,
                    "detail": c.detail,
                }
                for c in report.checks
            ],
        }
        args.json_path.parent.mkdir(parents=True, exist_ok=True)
        args.json_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    step_summary = os.environ.get("GITHUB_STEP_SUMMARY")

    if step_summary:
        with open(step_summary, "a", encoding="utf-8") as handle:
            handle.write(summary)
            handle.write("\n")

    if not report.ok:
        print("::error::CD product-path smoke FAILED — see summary table for required checks.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
