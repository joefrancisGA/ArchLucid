#!/usr/bin/env python3
"""Write the TB-885 / DX-18 policy-pack compounding-evidence ledger (offline fixture)."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

FIXTURE_REL = "tests/fixtures/policy-compounding-ledger/compounding-ledger-fixture.json"
SCHEMA = "archlucid.policy-pack-compounding-evidence-ledger.v1"
CLAIM_BOUNDARY = "Internal differentiability instrument — not a buyer compounding rate."


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_fixture(root: Path) -> dict:
    path = root / FIXTURE_REL
    return json.loads(path.read_text(encoding="utf-8"))


def build_packet(root: Path) -> dict:
    fixture = load_fixture(root)

    return {
        "schema": SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "policyPackId": fixture["policyPackId"],
        "runId": fixture["runId"],
        "olderVersionLabel": fixture["olderVersion"],
        "newerVersionLabel": fixture["newerVersion"],
        "olderGateBlocked": False,
        "newerGateBlocked": True,
        "incrementalCatch": {
            "addedComplianceRuleKeys": [fixture["addedComplianceRuleKey"]],
            "removedComplianceRuleKeys": [],
            "findingsNewlyBlockingCommit": [fixture["incrementalCatchFindingId"]],
            "findingsNoLongerBlockingCommit": [],
            "sponsorReportLinesAdded": [],
            "sponsorReportLinesRemoved": [],
            "gateBlockedFlipped": fixture["gateBlockedFlipped"],
        },
        "changeLogCitations": [
            {
                "changeLogId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                "changeType": "VersionPublished",
                "summaryText": (
                    f"Version '{fixture['newerVersion']}' published for pack "
                    f"'{fixture['policyPackId']}'."
                ),
                "changedUtc": "2026-09-07T20:00:00Z",
            }
        ],
        "claimBoundaryText": CLAIM_BOUNDARY,
        "fixtureLabel": fixture["fixtureLabel"],
        "fixturePath": FIXTURE_REL,
        "csharpRegressionFilter": (
            "FullyQualifiedName~PolicyPackCompoundingEvidenceLedgerTests"
        ),
    }


def render_markdown(packet: dict) -> str:
    catch = packet["incrementalCatch"]
    lines = [
        "# Policy-pack compounding-evidence ledger (TB-885 / DX-18)",
        "",
        "> Internal differentiability instrument — **not** a buyer compounding rate.",
        "",
        f"- **Schema:** `{packet['schema']}`",
        f"- **Generated (UTC):** {packet['generatedUtc']}",
        f"- **Policy pack id:** `{packet['policyPackId']}`",
        f"- **Historical run id:** `{packet['runId']}`",
        (
            f"- **Older version:** `{packet['olderVersionLabel']}` "
            f"(gate blocked: {packet['olderGateBlocked']})"
        ),
        (
            f"- **Newer version:** `{packet['newerVersionLabel']}` "
            f"(gate blocked: {packet['newerGateBlocked']})"
        ),
        f"- **Fixture:** `{packet['fixtureLabel']}`",
        "",
        "## Incremental catch (newer vs older on same run)",
        "",
        f"- **Gate blocked flipped:** {catch['gateBlockedFlipped']}",
        (
            "- **Added compliance rule keys:** "
            f"{', '.join(catch['addedComplianceRuleKeys'])}"
        ),
        (
            "- **Findings newly blocking commit:** "
            f"{', '.join(catch['findingsNewlyBlockingCommit'])}"
        ),
        "",
        "## Change-log citations",
        "",
    ]

    for citation in packet["changeLogCitations"]:
        lines.append(
            f"- `{citation['changeLogId']}` `{citation['changeType']}` — "
            f"{citation['summaryText']}"
        )

    lines.extend(
        [
            "",
            "## Claim boundary",
            "",
            packet["claimBoundaryText"],
            "",
            "## C# regression",
            "",
            f"`dotnet test ArchLucid.Application.Tests --filter \"{packet['csharpRegressionFilter']}\"`",
            "",
        ]
    )

    return "\n".join(lines) + "\n"


def write_packet(output_dir: Path, packet: dict) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "policy-pack-compounding-evidence-ledger.json"
    markdown_path = output_dir / "policy-pack-compounding-evidence-ledger.md"
    json_path.write_text(json.dumps(packet, indent=2) + "\n", encoding="utf-8")
    markdown_path.write_text(render_markdown(packet), encoding="utf-8")

    return json_path, markdown_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default="docs/quality",
        help="Directory for policy-pack-compounding-evidence-ledger.md/.json",
    )
    args = parser.parse_args(argv)
    root = repo_root()
    packet = build_packet(root)
    out_dir = Path(args.out)

    if not out_dir.is_absolute():
        out_dir = root / out_dir

    json_path, markdown_path = write_packet(out_dir, packet)
    print(f"Wrote {markdown_path}")
    print(f"Wrote {json_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
