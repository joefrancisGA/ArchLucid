#!/usr/bin/env python3
"""Check repository-side private-beta readiness contracts before expensive CI."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REQUIRED_BRANCHES = ("main", "master", "RC35")
REQUIRED_SPECS = (
    "archlucid-ui/e2e/live-api-scim-invite-substitute-smoke.spec.ts",
    "archlucid-ui/e2e/live-api-invite-flow.spec.ts",
    "archlucid-ui/e2e/live-api-private-beta-wave-3.spec.ts",
    "archlucid-ui/e2e/live-api-private-beta-access.spec.ts",
)
REQUIRED_RULESET_CONTEXTS = (
    "cohort-real-llm-gate",
    "Security: gitleaks (secret scan)",
    ".NET: fast core (corset)",
    "Operator UI: typecheck (blocking)",
    "CI: beta-readiness wiring guards",
)


def _read(root: Path, relative_path: str) -> str:
    path = root / relative_path

    if not path.is_file():
        return ""

    return path.read_text(encoding="utf-8")


def _check_required_files(root: Path) -> list[str]:
    required_files = (
        ".github/workflows/private-beta-access-on-push.yml",
        ".github/workflows/cd-staging-on-merge.yml",
        ".github/rulesets/golden-cohort-gate-required-check.json",
        "docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md",
        "docs/runbooks/PRIVATE_BETA_OPERATOR_LAUNCH_KIT.md",
        "scripts/ci/report_private_beta_playwright_failure_triage.py",
        "scripts/ci/report_real_mode_evidence_freshness.py",
        "scripts/ci/assert_ship_gate_evidence_schema.py",
        "scripts/ci/check_private_beta_ref_parity.py",
        "scripts/ci/check_private_beta_spend_freeze.py",
        "scripts/ci/private_beta_offboarding_dry_run.py",
        "scripts/ci/report_private_beta_funnel.py",
        "scripts/ci/report_private_beta_rate_limit_diagnostics.py",
        "scripts/ci/report_private_beta_ruleset_drift.py",
        "scripts/ci/build_private_beta_evidence_records.py",
        "scripts/ci/check_private_beta_surface_claim_drift.py",
        "scripts/ci/check_private_beta_access_coverage.py",
        "scripts/ci/check_private_beta_openapi_provisioning_routes.py",
        "scripts/ci/check_private_beta_evidence_consistency.py",
        "scripts/ci/check_private_beta_frozen_branch_pin.py",
    ) + REQUIRED_SPECS

    return [
        f"missing required private-beta readiness file: {relative_path}"
        for relative_path in required_files
        if not (root / relative_path).is_file()
    ]


_AUTH_ROUTING_ENV_KEY = "RateLimiting__AuthRouting__PermitLimit"
_AUTH_ROUTING_CI_PERMIT_VALUE = "500"
_API_START_STEP_NAME = "Start ArchLucid.Api (background, JwtBearer + local PEM)"
_API_RESTART_STEP_NAME = "Restart API after Enterprise grant (refresh tenant-tier cache)"
_JOB_STEP_NAME_PREFIX = "      - name: "


def _iter_job_steps(content: str) -> list[tuple[str, str]]:
    parts = content.split("\n" + _JOB_STEP_NAME_PREFIX)
    steps: list[tuple[str, str]] = []

    for index, part in enumerate(parts):
        if index == 0 and not content.startswith(_JOB_STEP_NAME_PREFIX):
            continue

        body_source = part if index > 0 else part[len(_JOB_STEP_NAME_PREFIX) :]
        name_line, separator, rest = body_source.partition("\n")

        if not separator:
            continue

        steps.append((name_line.strip().strip("\"'"), rest))

    return steps


def _parse_step_env(step_body: str) -> dict[str, str]:
    env: dict[str, str] = {}
    in_env = False

    for line in step_body.splitlines():
        if not in_env:
            if line.startswith("        env:"):
                in_env = True

            continue

        stripped = line.strip()

        # GitHub Actions env maps may include comments between keys.
        if stripped == "" or stripped.startswith("#"):
            continue

        if line.startswith("          ") and ":" in line:
            key, _, raw_value = line.strip().partition(":")
            env[key.strip()] = raw_value.strip().strip("\"'")
            continue

        break

    return env


def _named_step_env(content: str, step_name: str) -> dict[str, str] | None:
    for name, body in _iter_job_steps(content):
        if name == step_name:
            return _parse_step_env(body)

    return None


def _step_has_auth_routing_ci_permit(env: dict[str, str] | None) -> bool:
    if env is None:
        return False

    return env.get(_AUTH_ROUTING_ENV_KEY) == _AUTH_ROUTING_CI_PERMIT_VALUE


def _check_auth_routing_ci_permit(content: str) -> list[str]:
    start_env = _named_step_env(content, _API_START_STEP_NAME)
    restart_env = _named_step_env(content, _API_RESTART_STEP_NAME)

    if start_env is None or restart_env is None:
        return [
            "private-beta workflow must raise the auth-routing invitation-validate rate limit for CI"
        ]

    if not _step_has_auth_routing_ci_permit(start_env) or not _step_has_auth_routing_ci_permit(restart_env):
        return [
            'private-beta workflow must set RateLimiting__AuthRouting__PermitLimit: "500" '
            "in both API-start environment blocks"
        ]

    return []


def _check_workflow(root: Path) -> list[str]:
    content = _read(root, ".github/workflows/private-beta-access-on-push.yml")
    issues: list[str] = []

    if not all(branch in content for branch in REQUIRED_BRANCHES):
        issues.append("private-beta workflow must include main, master, and RC35 push branches")

    if "npm ci --dry-run --ignore-scripts --no-audit --no-fund" not in content:
        issues.append("private-beta workflow must run the npm lockfile preflight")

    if "report_private_beta_playwright_failure_triage.py" not in content:
        issues.append("private-beta workflow must publish the Playwright failure triage rollup")

    if "live-api-private-beta-access.spec.ts" not in content:
        issues.append("private-beta workflow must run the canonical access-path spec")

    issues.extend(_check_auth_routing_ci_permit(content))

    if "report_private_beta_rate_limit_diagnostics.py" not in content:
        issues.append("private-beta workflow must include rate-limit diagnostics wiring")

    if "report_private_beta_ruleset_drift.py" not in content:
        issues.append("private-beta workflow must include ruleset drift diagnostics wiring")

    if "check_private_beta_access_coverage.py" not in content:
        issues.append("private-beta workflow must include access coverage inventory wiring")

    if "check_private_beta_openapi_provisioning_routes.py" not in content:
        issues.append("private-beta workflow must include provisioning OpenAPI route wiring")

    if "check_private_beta_frozen_branch_pin.py" not in content:
        issues.append("private-beta workflow must include frozen-branch pin freshness diagnostics")

    if "RateLimiting__AuthRouting__PermitLimit: \"500\"" not in content:
        issues.append("private-beta workflow must raise auth-routing rate limits for invite-wave CI")

    release_gate = _read(root, ".github/workflows/rc-release-gate.yml")

    if "RateLimiting__AuthRouting__PermitLimit: \"500\"" not in release_gate:
        issues.append("RC release gate must raise auth-routing rate limits for invite-wave CI")

    if "cancel-in-progress: false" not in content:
        issues.append("private-beta workflow must queue active witnesses instead of cancelling them")

    corset = _read(root, ".github/workflows/ui-typecheck-on-push.yml")

    if "cancel-in-progress: false" not in corset:
        issues.append("UI typecheck workflow must queue active witnesses instead of cancelling them")

    return issues


def _check_ruleset(root: Path) -> list[str]:
    path = root / ".github/rulesets/golden-cohort-gate-required-check.json"
    issues: list[str] = []

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"golden-cohort ruleset JSON is invalid: {error}"]

    branches = payload.get("conditions", {}).get("ref_name", {}).get("include", [])

    if "refs/heads/RC35" not in branches:
        issues.append("golden-cohort ruleset JSON must name RC35 as the release-cut target")

    contexts = {
        check.get("context")
        for rule in payload.get("rules", [])
        for check in rule.get("parameters", {}).get("required_status_checks", [])
        if isinstance(check, dict)
    }

    missing_contexts = [context for context in REQUIRED_RULESET_CONTEXTS if context not in contexts]

    if missing_contexts:
        issues.append(f"golden-cohort ruleset JSON is missing contexts: {', '.join(missing_contexts)}")

    return issues


def _check_operator_contracts(root: Path) -> list[str]:
    kit = _read(root, "docs/runbooks/PRIVATE_BETA_OPERATOR_LAUNCH_KIT.md")
    runbook = _read(root, "docs/runbooks/PRIVATE_BETA_TRUNK_SMOKE.md")
    issues: list[str] = []

    required_kit_markers = (
        "Admin.UserInvitationCreated",
        "Architecture.RunCreated",
        "Run.CommitCompleted",
        "AgentExecution__Mode=Simulator",
        "check_buyer_claim_drift.py",
        "report_real_mode_evidence_freshness.py",
        "validate_ship_gate_evidence_index.py",
        "private_beta_offboarding_dry_run.py",
        "report_private_beta_funnel.py",
        "build_private_beta_evidence_records.py",
        "check_private_beta_surface_claim_drift.py",
        "check_private_beta_access_coverage.py",
        "check_private_beta_openapi_provisioning_routes.py",
        "check_private_beta_evidence_consistency.py",
        "Disable the tenant's users or SCIM access",
        "Set the tenant budget to zero or deny execution",
        "tombstone or hard-purge policy",
        "ship-gate-evidence/{runId}/",
    )

    for marker in required_kit_markers:
        if marker not in kit:
            issues.append(f"operator launch kit is missing marker: {marker}")

    if "npm ci --dry-run --ignore-scripts --no-audit --no-fund" not in runbook:
        issues.append("private-beta smoke runbook is missing the lockfile preflight")

    if "Retry the navigation and branded-not-found assertion together" not in runbook:
        issues.append("private-beta smoke runbook is missing dead-review retry guidance")

    otp_helper = _read(root, "archlucid-ui/e2e/helpers/live-email-otp-harness.ts")

    if "not wired in private-beta-access-on-push.yml" not in otp_helper:
        issues.append("email-OTP lane must state its external challenge-code dependency")

    return issues


def _check_staging_dispatch(root: Path) -> list[str]:
    content = _read(root, ".github/workflows/cd-staging-on-merge.yml")
    required_markers = (
        "workflow_dispatch:",
        "target_sha:",
        "github.event_name == 'workflow_dispatch'",
        "github.event.workflow_run.head_branch == 'main'",
        "github.event.workflow_run.head_branch == 'master'",
        "staging-dispatch.json",
        "archlucid.staging-dispatch.v1",
    )

    return [
        f"staging workflow is missing owner-approved RC35 dispatch marker: {marker}"
        for marker in required_markers
        if marker not in content
    ]


def collect_issues(root: Path) -> list[str]:
    issues = _check_required_files(root)

    if not issues:
        issues.extend(_check_workflow(root))
        issues.extend(_check_ruleset(root))
        issues.extend(_check_operator_contracts(root))
        issues.extend(_check_staging_dispatch(root))

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    issues = collect_issues(args.root.resolve())

    if issues:
        for issue in issues:
            print(f"ERROR: {issue}")

        return 1

    print("Private-beta readiness contracts: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
