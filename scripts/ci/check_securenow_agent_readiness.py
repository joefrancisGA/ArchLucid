"""Warn-only source guard for the SecureNow AI/Agent Readiness path explanation slice."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def validate(root: Path = ROOT) -> list[str]:
    panel = (
        root / "archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx"
    ).read_text(encoding="utf-8")
    service = (
        root
        / "ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationService.cs"
    ).read_text(encoding="utf-8")
    ask = (
        root
        / "ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs"
    ).read_text(encoding="utf-8")
    copy = (
        root / "archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts"
    ).read_text(encoding="utf-8")

    errors: list[str] = []
    if "useAgentExecutionMode" not in panel:
        errors.append("Path inspect must read the agent execution mode")
    if "useSimulatorForExplanation" not in panel:
        errors.append("Path inspect must derive the simulator/live explanation mode")
    if 'mode === "Real"' not in panel or "? false" not in panel or ": true" not in panel:
        errors.append("Path inspect must use live mode only for a loaded Real session")
    if "BuildSimulatorExplanation" not in service:
        errors.append("live explanation failure must fall back to BuildSimulatorExplanation")
    if "ModelOutputRejection" not in service:
        errors.append("explanation service must persist ModelOutputRejection")
    if "PathExplanationMaxOutputTokens = 800" not in service:
        errors.append("path explanation must define an 800-token cap")
    if "InfraEvidenceAskTopicKinds.RankedPath" not in ask or "maxTokens: maxTokens" not in ask:
        errors.append("RankedPath Ask must select the bounded maxTokens value")
    if "Model — cited stored path" not in copy:
        errors.append("path inspect copy must include the model provenance label")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("SecureNow AI/Agent Readiness source guard passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
