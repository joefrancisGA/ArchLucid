#!/usr/bin/env python3
"""Azure CD deployment-target preflight: prove live context matches expected env.

Self-test: ``python -m unittest discover -s scripts/ci/tests -p "test_cd_deploy_target_preflight.py"``.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

WORKFLOW_RELATIVE_PATHS = (
    ".github/workflows/cd.yml",
    ".github/workflows/cd-staging-on-merge.yml",
)

PREFLIGHT_MARKERS = (
    "Azure deployment-target preflight",
    "cd_deploy_target_preflight.py",
    "EXPECTED_AZURE_TENANT_ID",
    "EXPECTED_AZURE_SUBSCRIPTION_ID",
)

AzRunner = Callable[[list[str]], dict[str, Any] | list[Any] | str | None]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def normalize(value: str | None) -> str:
    if value is None:
        return ""

    return str(value).strip()


def resolve_expected(preferred: str | None, fallback: str | None, name: str) -> str:
    """Prefer EXPECTED_* ; fall back to deploy secret/value. No invented defaults."""
    preferred_n = normalize(preferred)

    if preferred_n:
        return preferred_n

    fallback_n = normalize(fallback)

    if fallback_n:
        return fallback_n

    raise ValueError(f"{name} is required (set EXPECTED_* or the matching deploy secret/value)")


def acr_name_from_login_server(login_server: str) -> str:
    server = normalize(login_server).lower()

    if not server:
        raise ValueError("ACR login server is empty")

    return server.split(".", 1)[0]


def default_az_runner(args: list[str]) -> dict[str, Any] | list[Any] | str | None:
    completed = subprocess.run(
        ["az", *args],
        check=False,
        capture_output=True,
        text=True,
    )

    if completed.returncode != 0:
        stderr = (completed.stderr or completed.stdout or "").strip()
        raise RuntimeError(f"az {' '.join(args)} failed: {stderr[:500]}")

    stdout = (completed.stdout or "").strip()

    if not stdout:
        return None

    if "-o" in args and "tsv" in args:
        return stdout

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return stdout


@dataclass
class CheckResult:
    name: str
    status: str
    detail: str


@dataclass
class PreflightReport:
    environment: str
    build_id: str
    checks: list[CheckResult] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def add(self, name: str, status: str, detail: str) -> None:
        self.checks.append(CheckResult(name=name, status=status, detail=detail))

        if status == "FAIL":
            self.errors.append(f"{name}: {detail}")

    @property
    def ok(self) -> bool:
        return len(self.errors) == 0

    def summary_markdown(self) -> str:
        by_name = {check.name: check for check in self.checks}

        def status_of(name: str) -> str:
            check = by_name.get(name)

            if check is None:
                return "n/a"

            return f"{check.status} — {check.detail}"

        lines = [
            "## Azure deployment-target preflight",
            f"- Environment: `{self.environment}`",
            f"- Artifact BUILD_ID: `{self.build_id or 'n/a'}`",
            f"- Tenant validation: {status_of('tenant')}",
            f"- Subscription validation: {status_of('subscription')}",
            f"- Resource-group validation: {status_of('resource_group')}",
            f"- Application-target validation: {status_of('application_targets')}",
        ]

        for check in self.checks:
            if check.name in {"tenant", "subscription", "resource_group", "application_targets"}:
                continue

            lines.append(f"- {check.name}: {check.status} — {check.detail}")

        return "\n".join(lines) + "\n"


def compare_case_insensitive(actual: str, expected: str, label: str) -> None:
    if normalize(actual).lower() != normalize(expected).lower():
        raise ValueError(f"{label} mismatch: live={actual!r} expected={expected!r}")


def compare_exact(actual: str, expected: str, label: str) -> None:
    if normalize(actual) != normalize(expected):
        raise ValueError(f"{label} mismatch: live={actual!r} expected={expected!r}")


def validate_account_context(
    report: PreflightReport,
    *,
    expected_tenant_id: str,
    expected_subscription_id: str,
    az_runner: AzRunner,
) -> dict[str, Any]:
    account = az_runner(["account", "show", "-o", "json"])

    if not isinstance(account, dict):
        raise RuntimeError("az account show did not return a JSON object")

    live_tenant = normalize(str(account.get("tenantId", "")))
    live_sub = normalize(str(account.get("id", "")))

    try:
        compare_exact(live_tenant, expected_tenant_id, "tenant")
        report.add("tenant", "PASS", f"tenantId={live_tenant}")
    except ValueError as exc:
        report.add("tenant", "FAIL", str(exc))

    try:
        compare_exact(live_sub, expected_subscription_id, "subscription")
        report.add("subscription", "PASS", f"subscriptionId={live_sub}")
    except ValueError as exc:
        report.add("subscription", "FAIL", str(exc))

    return account


def validate_resource_group(
    report: PreflightReport,
    *,
    expected_resource_group: str,
    expected_location: str | None,
    az_runner: AzRunner,
) -> dict[str, Any]:
    group = az_runner(["group", "show", "--name", expected_resource_group, "-o", "json"])

    if not isinstance(group, dict):
        raise RuntimeError(f"az group show did not return JSON for {expected_resource_group}")

    live_name = normalize(str(group.get("name", "")))
    live_location = normalize(str(group.get("location", "")))

    try:
        compare_case_insensitive(live_name, expected_resource_group, "resource_group")

        if normalize(expected_location):
            compare_case_insensitive(live_location, expected_location or "", "resource_group.location")
            report.add(
                "resource_group",
                "PASS",
                f"name={live_name} location={live_location}",
            )
        else:
            report.add("resource_group", "PASS", f"name={live_name} location={live_location}")
    except ValueError as exc:
        report.add("resource_group", "FAIL", str(exc))

    return group


def validate_acr(
    report: PreflightReport,
    *,
    expected_acr_login_server: str,
    az_runner: AzRunner,
) -> None:
    registry_name = acr_name_from_login_server(expected_acr_login_server)
    acr = az_runner(["acr", "show", "--name", registry_name, "-o", "json"])

    if not isinstance(acr, dict):
        raise RuntimeError(f"az acr show did not return JSON for {registry_name}")

    live_server = normalize(str(acr.get("loginServer", "")))

    try:
        compare_case_insensitive(live_server, expected_acr_login_server, "acr.loginServer")
        report.add("acr", "PASS", f"loginServer={live_server}")
    except ValueError as exc:
        report.add("acr", "FAIL", str(exc))


def validate_container_app(
    *,
    app_name: str,
    expected_resource_group: str,
    expected_environment_name: str | None,
    az_runner: AzRunner,
) -> str:
    app = az_runner(
        [
            "containerapp",
            "show",
            "--name",
            app_name,
            "--resource-group",
            expected_resource_group,
            "-o",
            "json",
        ]
    )

    if not isinstance(app, dict):
        raise RuntimeError(f"az containerapp show did not return JSON for {app_name}")

    live_rg = normalize(str(app.get("resourceGroup", "")))
    compare_case_insensitive(live_rg, expected_resource_group, f"containerapp[{app_name}].resourceGroup")

    if normalize(expected_environment_name):
        props = app.get("properties") if isinstance(app.get("properties"), dict) else {}
        env_id = normalize(str(props.get("environmentId", "")))
        # environmentId ends with /managedEnvironments/<name>
        env_name = env_id.rstrip("/").split("/")[-1] if env_id else ""
        compare_case_insensitive(
            env_name,
            expected_environment_name or "",
            f"containerapp[{app_name}].environment",
        )

    return app_name


def validate_application_targets(
    report: PreflightReport,
    *,
    expected_resource_group: str,
    expected_acr_login_server: str,
    expected_api_name: str,
    expected_worker_name: str | None,
    expected_ui_name: str | None,
    expected_environment_name: str | None,
    az_runner: AzRunner,
) -> None:
    details: list[str] = []

    try:
        validate_acr(
            report,
            expected_acr_login_server=expected_acr_login_server,
            az_runner=az_runner,
        )
        details.append(f"acr={expected_acr_login_server}")

        validate_container_app(
            app_name=expected_api_name,
            expected_resource_group=expected_resource_group,
            expected_environment_name=expected_environment_name,
            az_runner=az_runner,
        )
        details.append(f"api={expected_api_name}")

        if normalize(expected_worker_name):
            validate_container_app(
                app_name=expected_worker_name or "",
                expected_resource_group=expected_resource_group,
                expected_environment_name=expected_environment_name,
                az_runner=az_runner,
            )
            details.append(f"worker={expected_worker_name}")

        if normalize(expected_ui_name):
            validate_container_app(
                app_name=expected_ui_name or "",
                expected_resource_group=expected_resource_group,
                expected_environment_name=None,
                az_runner=az_runner,
            )
            details.append(f"ui={expected_ui_name}")

        # application_targets aggregates; individual acr check already recorded
        if any(check.name == "acr" and check.status == "FAIL" for check in report.checks):
            report.add("application_targets", "FAIL", "one or more application targets failed")
        else:
            report.add("application_targets", "PASS", ", ".join(details))
    except (ValueError, RuntimeError) as exc:
        report.add("application_targets", "FAIL", str(exc))


def run_preflight(
    *,
    environment: str,
    build_id: str,
    expected_tenant_id: str,
    expected_subscription_id: str,
    check_resources: bool,
    expected_resource_group: str | None = None,
    expected_location: str | None = None,
    expected_acr_login_server: str | None = None,
    expected_api_name: str | None = None,
    expected_worker_name: str | None = None,
    expected_ui_name: str | None = None,
    expected_environment_name: str | None = None,
    az_runner: AzRunner | None = None,
) -> PreflightReport:
    runner = az_runner or default_az_runner
    report = PreflightReport(environment=normalize(environment) or "unknown", build_id=normalize(build_id))

    validate_account_context(
        report,
        expected_tenant_id=expected_tenant_id,
        expected_subscription_id=expected_subscription_id,
        az_runner=runner,
    )

    if not check_resources:
        report.add("resource_group", "SKIP", "resource checks not requested")
        report.add("application_targets", "SKIP", "resource checks not requested")
        return report

    if not normalize(expected_resource_group):
        report.add("resource_group", "FAIL", "expected resource group is required when check_resources=true")
        report.add("application_targets", "FAIL", "skipped because resource group missing")
        return report

    validate_resource_group(
        report,
        expected_resource_group=expected_resource_group or "",
        expected_location=expected_location,
        az_runner=runner,
    )

    if not normalize(expected_acr_login_server) or not normalize(expected_api_name):
        report.add(
            "application_targets",
            "FAIL",
            "ACR login server and Container App API name are required when check_resources=true",
        )
        return report

    validate_application_targets(
        report,
        expected_resource_group=expected_resource_group or "",
        expected_acr_login_server=expected_acr_login_server or "",
        expected_api_name=expected_api_name or "",
        expected_worker_name=expected_worker_name,
        expected_ui_name=expected_ui_name,
        expected_environment_name=expected_environment_name,
        az_runner=runner,
    )

    return report


def assert_workflows_declare_deploy_target_preflight(repo: Path | None = None) -> list[str]:
    root = repo if repo is not None else repo_root()
    errors: list[str] = []

    for relative in WORKFLOW_RELATIVE_PATHS:
        path = root / relative

        if not path.is_file():
            errors.append(f"missing workflow: {relative}")
            continue

        text = path.read_text(encoding="utf-8")

        for marker in PREFLIGHT_MARKERS:
            if marker not in text:
                errors.append(f"{relative}: missing preflight marker {marker!r}")

    return errors


def _env(name: str) -> str | None:
    value = os.environ.get(name)
    return value if value is not None and str(value).strip() else None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assert-workflows", action="store_true")
    parser.add_argument("--repo-root", type=Path, default=None)
    parser.add_argument("--environment", default="")
    parser.add_argument("--build-id", default="")
    parser.add_argument(
        "--check-resources",
        action="store_true",
        help="Also validate RG, ACR, and Container Apps in the active subscription.",
    )
    parser.add_argument("--summary-path", type=Path, default=None)
    parser.add_argument("--expected-tenant-id", default=None)
    parser.add_argument("--expected-subscription-id", default=None)
    parser.add_argument("--expected-resource-group", default=None)
    parser.add_argument("--expected-location", default=None)
    parser.add_argument("--expected-acr-login-server", default=None)
    parser.add_argument("--expected-api-name", default=None)
    parser.add_argument("--expected-worker-name", default=None)
    parser.add_argument("--expected-ui-name", default=None)
    parser.add_argument("--expected-environment-name", default=None)
    args = parser.parse_args(argv)

    if args.assert_workflows:
        errors = assert_workflows_declare_deploy_target_preflight(args.repo_root)

        if errors:
            print("cd_deploy_target_preflight: FAILED — workflow drift:", file=sys.stderr)

            for error in errors:
                print(f"  {error}", file=sys.stderr)

            return 1

        print(
            "cd_deploy_target_preflight: OK — CD workflows declare Azure target preflight "
            f"({len(WORKFLOW_RELATIVE_PATHS)} file(s))."
        )
        return 0

    try:
        expected_tenant = resolve_expected(
            args.expected_tenant_id or _env("EXPECTED_AZURE_TENANT_ID"),
            _env("AZURE_TENANT_ID"),
            "EXPECTED_AZURE_TENANT_ID / AZURE_TENANT_ID",
        )
        expected_subscription = resolve_expected(
            args.expected_subscription_id or _env("EXPECTED_AZURE_SUBSCRIPTION_ID"),
            _env("AZURE_SUBSCRIPTION_ID"),
            "EXPECTED_AZURE_SUBSCRIPTION_ID / AZURE_SUBSCRIPTION_ID",
        )
    except ValueError as exc:
        print(f"cd_deploy_target_preflight: FAILED — {exc}", file=sys.stderr)
        return 1

    expected_rg = None
    expected_acr = None
    expected_api = None
    expected_worker = None
    expected_ui = None
    expected_location = args.expected_location or _env("EXPECTED_AZURE_LOCATION")
    expected_cae = args.expected_environment_name or _env("EXPECTED_CONTAINER_APP_ENVIRONMENT_NAME")

    if args.check_resources:
        try:
            expected_rg = resolve_expected(
                args.expected_resource_group or _env("EXPECTED_AZURE_RESOURCE_GROUP"),
                _env("AZURE_RESOURCE_GROUP"),
                "EXPECTED_AZURE_RESOURCE_GROUP / AZURE_RESOURCE_GROUP",
            )
            expected_acr = resolve_expected(
                args.expected_acr_login_server or _env("EXPECTED_ACR_LOGIN_SERVER"),
                _env("ACR_LOGIN_SERVER"),
                "EXPECTED_ACR_LOGIN_SERVER / ACR_LOGIN_SERVER",
            )
            expected_api = resolve_expected(
                args.expected_api_name or _env("EXPECTED_CONTAINER_APP_API_NAME"),
                _env("CONTAINER_APP_API_NAME"),
                "EXPECTED_CONTAINER_APP_API_NAME / CONTAINER_APP_API_NAME",
            )
            expected_worker = (
                args.expected_worker_name
                or _env("EXPECTED_CONTAINER_APP_WORKER_NAME")
                or _env("CONTAINER_APP_WORKER_NAME")
            )
            expected_ui = (
                args.expected_ui_name
                or _env("EXPECTED_CONTAINER_APP_UI_NAME")
                or _env("CONTAINER_APP_UI_NAME")
            )
        except ValueError as exc:
            print(f"cd_deploy_target_preflight: FAILED — {exc}", file=sys.stderr)
            return 1

    report = run_preflight(
        environment=args.environment or _env("CD_TARGET") or _env("DEPLOY_ENV") or "unknown",
        build_id=args.build_id or _env("BUILD_ID") or "",
        expected_tenant_id=expected_tenant,
        expected_subscription_id=expected_subscription,
        check_resources=args.check_resources,
        expected_resource_group=expected_rg,
        expected_location=expected_location,
        expected_acr_login_server=expected_acr,
        expected_api_name=expected_api,
        expected_worker_name=expected_worker,
        expected_ui_name=expected_ui,
        expected_environment_name=expected_cae,
    )

    summary = report.summary_markdown()
    print(summary, end="")

    if args.summary_path is not None:
        args.summary_path.parent.mkdir(parents=True, exist_ok=True)
        args.summary_path.write_text(summary, encoding="utf-8")

    if not report.ok:
        print("cd_deploy_target_preflight: FAILED — target mismatch:", file=sys.stderr)

        for error in report.errors:
            print(f"  {error}", file=sys.stderr)

        return 1

    print("cd_deploy_target_preflight: OK — active Azure target matches expected environment.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
