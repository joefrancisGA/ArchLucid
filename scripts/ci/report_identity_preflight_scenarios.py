#!/usr/bin/env python3
"""Render buyer-safe OIDC/SAML preflight scenario examples for first-pilot proof."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_scenarios(path: Path) -> list[dict[str, object]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    scenarios = payload.get("scenarios")

    if not isinstance(scenarios, list) or len(scenarios) == 0:
        raise ValueError(f"{path} must contain a non-empty scenarios array")

    normalized: list[dict[str, object]] = []

    for item in scenarios:
        if not isinstance(item, dict):
            raise ValueError("each scenario must be an object")

        scenario_id = item.get("id")

        if not isinstance(scenario_id, str) or not scenario_id.strip():
            raise ValueError("scenario id is required")

        title = item.get("title")

        if not isinstance(title, str) or not title.strip():
            raise ValueError(f"scenario {scenario_id} missing title")

        summary = item.get("diagnosticSummary")

        if not isinstance(summary, str) or not summary.strip():
            raise ValueError(f"scenario {scenario_id} missing diagnosticSummary")

        normalized.append(item)

    return normalized


def render_markdown(scenarios: list[dict[str, object]]) -> str:
    lines = [
        "# Identity preflight scenario examples",
        "",
        "> Redacted examples for interpreting `GET /v1/admin/auth/oidc-diagnostics` and SAML configuration diagnostics.",
        "> No secrets, client secrets, or raw tokens appear in these fixtures.",
        "",
        f"Generated (UTC): {datetime.now(timezone.utc).isoformat()}",
        "",
        "| Scenario | Auth mode | Summary | Next action |",
        "| --- | --- | --- | --- |",
    ]

    for scenario in scenarios:
        scenario_id = str(scenario.get("id"))
        title = str(scenario.get("title"))
        auth_mode = str(scenario.get("authMode") or "unknown")
        summary = str(scenario.get("diagnosticSummary")).replace("|", "\\|")
        next_action = _next_action_for_scenario(scenario_id)
        lines.append(f"| {title} | {auth_mode} | {summary} | {next_action} |")

    lines.extend(
        [
            "",
            "## Canonical references",
            "",
            "- [`docs/runbooks/GENERIC_OIDC_SETUP.md`](../../docs/runbooks/GENERIC_OIDC_SETUP.md)",
            "- [`docs/library/CONFIGURATION_REFERENCE.md`](../../docs/library/CONFIGURATION_REFERENCE.md) (ArchLucidAuth + SAML2)",
            "- CLI/API: `archlucid auth diagnostics` · `GET /v1/admin/auth/oidc-diagnostics`",
            "",
        ]
    )

    return "\n".join(lines)


def _next_action_for_scenario(scenario_id: str) -> str:
    mapping = {
        "healthy-oidc-jwtbearer": "Proceed with pilot preflight using JwtBearer tokens from the configured issuer.",
        "failed-oidc-discovery": "Fix issuer URL or outbound network; rerun OIDC diagnostics.",
        "missing-audience": "Set ArchLucidAuth:Audience to match the IdP-issued access token aud claim.",
        "saml-metadata-missing": "Configure ArchLucidAuth:Saml2:IdP metadata URL and signing certificate.",
        "saml-role-claim-unmapped": "Add SAML role claim sources and map to ArchLucid roles.",
    }

    return mapping.get(scenario_id, "Review auth diagnostics output and linked runbooks.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Report identity preflight scenario examples.")
    parser.add_argument(
        "--fixtures",
        type=Path,
        default=Path("scripts/ci/fixtures/identity-preflight-scenarios.json"),
    )
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-summary-out", type=Path, default=None)
    args = parser.parse_args()

    root = repo_root()
    fixture_path = (root / args.fixtures).resolve()
    scenarios = load_scenarios(fixture_path)
    markdown = render_markdown(scenarios)

    markdown_path = args.markdown_out.expanduser().resolve()
    markdown_path.parent.mkdir(parents=True, exist_ok=True)
    markdown_path.write_text(markdown, encoding="utf-8")

    summary = {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": "PASS",
        "scenarioCount": len(scenarios),
        "fixturePath": fixture_path.relative_to(root).as_posix(),
    }

    if args.json_summary_out is not None:
        json_path = args.json_summary_out.expanduser().resolve()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print("identity preflight scenarios: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
