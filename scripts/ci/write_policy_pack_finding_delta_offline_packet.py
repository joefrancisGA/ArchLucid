#!/usr/bin/env python3
"""Write the WK-12 offline policy-pack finding-delta packet (no live API)."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

SOC2_REL = "docs/samples/policy-packs/soc2-tsc-architecture.json"
CIS_REL = "docs/samples/policy-packs/cis-azure-foundations.json"
FINOPS_REL = "docs/samples/policy-packs/cost-optimization.json"

GOLDEN_TESTS = (
    "dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~BundledPolicyPackDeclarationThemeTests",
    "dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyFilteredGoldenCorpusTests",
    "dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyFilteredDeclarationGoldenCorpusTests",
    "dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyExpectationCoverageGoldenCorpusTests",
)

HONESTY_NOTE = (
    "Bundled packs ship priorityFloor P0. SOC 2 vs CIS Azure declaration rows need P1 "
    "(soc2-003/004 vs cis-az-006; Option B also maps soc2-018 and cis-az-012/027). "
    "SOC 2 assignment alone does not stamp topology identity — CIS Azure sample includes "
    "expectation.topologyCategories.add=identity. FinOps cost.requireBudgetCap is an overlay extra; "
    "it is not implied by SOC 2. Not all 39 engines are policy-aware."
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_pack(root: Path, relative: str) -> dict:
    path = root / relative
    return json.loads(path.read_text(encoding="utf-8"))


def _keys(pack: dict) -> list[str]:
    raw = pack.get("complianceRuleKeys") or []
    return [str(key) for key in raw]


def _extras(pack: dict) -> dict[str, str]:
    defaults = pack.get("advisoryDefaults") or {}
    known = (
        "cost.requireBudgetCap",
        "expectation.topologyCategories.add",
        "priorityFloor",
    )
    extras: dict[str, str] = {}

    for key in known:
        value = defaults.get(key)

        if value is not None and str(value).strip() != "":
            extras[key] = str(value)

    return extras


def build_packet(root: Path) -> dict:
    soc2 = _load_pack(root, SOC2_REL)
    cis = _load_pack(root, CIS_REL)
    finops = _load_pack(root, FINOPS_REL)
    soc2_keys = _keys(soc2)
    cis_keys = _keys(cis)
    only_soc2 = sorted(set(soc2_keys) - set(cis_keys))
    only_cis = sorted(set(cis_keys) - set(soc2_keys))

    return {
        "schema": "archlucid.policy-pack-finding-delta-offline.v1",
        "generatedUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "talkTrack": (
            "Same architecture, two assigned packs: SOC 2 vs CIS Azure change which "
            "compliance and declaration findings fire at P1. Overlay extras change coverage/cost "
            "rows: CIS identity topology extra and FinOps requireBudgetCap."
        ),
        "soc2": {
            "path": SOC2_REL,
            "ruleKeyCount": len(soc2_keys),
            "advisoryExtras": _extras(soc2),
        },
        "cisAzure": {
            "path": CIS_REL,
            "ruleKeyCount": len(cis_keys),
            "advisoryExtras": _extras(cis),
        },
        "finOps": {
            "path": FINOPS_REL,
            "ruleKeyCount": len(_keys(finops)),
            "advisoryExtras": _extras(finops),
        },
        "onlyInSoc2Count": len(only_soc2),
        "onlyInCisAzureCount": len(only_cis),
        "onlyInSoc2Sample": only_soc2[:8],
        "onlyInCisAzureSample": only_cis[:8],
        "offlineGoldenTests": list(GOLDEN_TESTS),
        "honestyNote": HONESTY_NOTE,
        "screenshotChecklist": [
            "Findings list (SOC 2 assignment vs CIS Azure assignment)",
            "Severity column",
            "Pre-finalize / dry-run verdict",
            "Audit FindingsSnapshotSealed or policy assignment row",
        ],
    }


def render_markdown(packet: dict) -> str:
    lines = [
        "# Policy-pack finding-delta offline packet (WK-12)",
        "",
        "> Sales-engineer cite pack. **No live API.** Generated from sample pack JSON in-repo.",
        "",
        f"- **Generated (UTC):** {packet['generatedUtc']}",
        f"- **Talk track:** {packet['talkTrack']}",
        "",
        "## Pack comparison",
        "",
        "| Pack | Rule keys | Overlay extras |",
        "| --- | ---: | --- |",
        (
            f"| SOC 2 (`{packet['soc2']['path']}`) | {packet['soc2']['ruleKeyCount']} | "
            f"`{json.dumps(packet['soc2']['advisoryExtras'], sort_keys=True)}` |"
        ),
        (
            f"| CIS Azure (`{packet['cisAzure']['path']}`) | {packet['cisAzure']['ruleKeyCount']} | "
            f"`{json.dumps(packet['cisAzure']['advisoryExtras'], sort_keys=True)}` |"
        ),
        (
            f"| FinOps (`{packet['finOps']['path']}`) | {packet['finOps']['ruleKeyCount']} | "
            f"`{json.dumps(packet['finOps']['advisoryExtras'], sort_keys=True)}` |"
        ),
        "",
        f"- Keys only in SOC 2: **{packet['onlyInSoc2Count']}** (sample: `{', '.join(packet['onlyInSoc2Sample'])}`)",
        (
            f"- Keys only in CIS Azure: **{packet['onlyInCisAzureCount']}** "
            f"(sample: `{', '.join(packet['onlyInCisAzureSample'])}`)"
        ),
        "",
        "## Honesty",
        "",
        packet["honestyNote"],
        "",
        "## Offline golden tests",
        "",
    ]

    for command in packet["offlineGoldenTests"]:
        lines.append(f"- `{command}`")

    lines.extend(
        [
            "",
            "## Screenshot checklist",
            "",
        ]
    )

    for item in packet["screenshotChecklist"]:
        lines.append(f"- {item}")

    lines.extend(
        [
            "",
            "## Live optional follow-up",
            "",
            "When a committed runId exists: "
            "`.\\scripts\\demo-policy-pack-delta.ps1 -RunId <guid> -ShowFindingDelta "
            "-DeclarationPriorityFloor P1`",
            "",
        ]
    )

    return "\n".join(lines) + "\n"


def write_packet(output_dir: Path, packet: dict) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "finding-delta-offline.json"
    markdown_path = output_dir / "finding-delta-offline.md"
    json_path.write_text(json.dumps(packet, indent=2) + "\n", encoding="utf-8")
    markdown_path.write_text(render_markdown(packet), encoding="utf-8")

    return json_path, markdown_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        default="artifacts/policy-pack-delta-demo/offline",
        help="Directory for finding-delta-offline.md/.json",
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
