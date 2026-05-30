#!/usr/bin/env python3
"""Production-like Azure pilot proof rollup — configured vs measured vs not enabled."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path | None) -> dict | None:
    if path is None or not path.is_file():
        return None

    return json.loads(path.read_text(encoding="utf-8"))


def terraform_reference_rows(root: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    templates = root / "deploy" / "customer-templates" / "terraform"

    if templates.is_dir():
        rows.append(
            {
                "signal": "customer-terraform-templates",
                "source": templates.as_posix(),
                "note": "IaC templates exist — enabling controls requires your subscription apply, not repo presence alone.",
            },
        )

    minimal_doc = root / "docs" / "runbooks" / "MINIMAL_AZURE_PILOT_DEPLOYMENT.md"

    if minimal_doc.is_file():
        rows.append(
            {
                "signal": "minimal-azure-pilot-runbook",
                "source": minimal_doc.as_posix(),
                "note": "Canonical minimal resource list and validation checklist.",
            },
        )

    return rows


def build_summary(*, proof_dir: Path | None, root: Path) -> dict[str, object]:
    configured: list[dict[str, str]] = []
    measured: list[dict[str, str]] = []
    not_enabled: list[dict[str, str]] = []

    configured.extend(terraform_reference_rows(root))
    configured.extend(
        [
            {
                "signal": "single-region-v1",
                "source": "docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md",
                "note": "Preferred region US East when unconstrained; not multi-region active/active.",
            },
            {
                "signal": "key-vault-recommended",
                "source": "docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md",
                "note": "Key Vault recommended for secrets — must be wired in tenant deployment.",
            },
            {
                "signal": "application-insights",
                "source": "docs/library/PERFORMANCE.md",
                "note": "Telemetry export target when hosted pilot is production-like.",
            },
        ],
    )

    not_enabled.extend(
        [
            {
                "signal": "private-endpoints-waf",
                "source": "docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md",
                "note": "Optional V1 — do not claim enabled without deployment evidence.",
            },
            {
                "signal": "redis-hot-path",
                "source": "docs/library/PERFORMANCE.md",
                "note": "Optional cache — not required for first pilot.",
            },
            {
                "signal": "multi-region-active-active",
                "source": "docs/library/V1_DEFERRED.md",
                "note": "Explicitly deferred — not a V1 pilot proof requirement.",
            },
        ],
    )

    if proof_dir is not None:
        config_lint = load_json(proof_dir / "config-lint-production-like-hosted-pilot.json")

        if config_lint is not None:
            ok = config_lint.get("ok") is True
            proof_disposition = str(config_lint.get("proofDisposition") or ("READY" if ok else "HOLD"))
            measured.append(
                {
                    "signal": "production-like-config-lint",
                    "source": "config-lint-production-like-hosted-pilot.json",
                    "note": f"Measured in proof folder — proofDisposition={proof_disposition}.",
                },
            )

        telemetry = load_json(proof_dir / "observability-export-readiness.json")

        if telemetry is not None:
            measured.append(
                {
                    "signal": "telemetry-export-readiness",
                    "source": "observability-export-readiness.json",
                    "note": f"Verdict={telemetry.get('verdict', 'unknown')}.",
                },
            )

        data_summary = load_json(proof_dir / "data-consistency-readiness" / "data-consistency-summary.json")

        if data_summary is not None:
            measured.append(
                {
                    "signal": "data-consistency-readiness",
                    "source": "data-consistency-readiness/data-consistency-summary.json",
                    "note": f"Status={data_summary.get('dataConsistencyStatus', 'unknown')}.",
                },
            )

    disposition = "PASS" if measured else "WARN"

    return {
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "configuredTargets": configured,
        "measuredEvidence": measured,
        "notEnabledAssumptions": not_enabled,
        "handoffRule": "Terraform or template presence does not prove a control is enabled in the buyer subscription.",
    }


def format_markdown(summary: dict[str, object]) -> str:
    lines = [
        "# Production-like Azure pilot proof",
        "",
        "Implementation-team handoff: **configured** IaC references, **measured** proof-folder signals, and **not enabled** assumptions.",
        "",
        f"| Disposition | **{summary['disposition']}** |",
        "",
        f"**Rule:** {summary['handoffRule']}",
        "",
        "## Configured targets (IaC / docs)",
        "",
    ]

    for row in summary.get("configuredTargets") or []:
        lines.append(f"- **{row['signal']}** — {row['note']} (`{row['source']}`)")

    lines.extend(["", "## Measured evidence (this proof folder)", ""])

    measured = summary.get("measuredEvidence") or []

    if not measured:
        lines.append("- None — rerun proof with `-ProductionLikeHostedPilot` or `-SponsorHandoff`.")
    else:
        for row in measured:
            lines.append(f"- **{row['signal']}** — {row['note']}")

    lines.extend(["", "## Not enabled / optional (honest bounds)", ""])

    for row in summary.get("notEnabledAssumptions") or []:
        lines.append(f"- **{row['signal']}** — {row['note']} (`{row['source']}`)")

    lines.extend(
        [
            "",
            "Commands: see [`MINIMAL_AZURE_PILOT_DEPLOYMENT.md`](../runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md).",
            "",
        ],
    )

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--proof-directory", type=Path, default=None)
    parser.add_argument("--markdown-out", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    args = parser.parse_args()

    summary = build_summary(proof_dir=args.proof_directory, root=repo_root())
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(format_markdown(summary), encoding="utf-8")
    print(f"production-like azure pilot proof: {summary['disposition']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
