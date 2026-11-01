"""Warn-only source guard for the SecureNow cutting-edge Ask slice."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def validate(root: Path = ROOT) -> list[str]:
    topic = (root / "ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskTopicKinds.cs").read_text(
        encoding="utf-8"
    )
    request = (root / "ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskRequest.cs").read_text(
        encoding="utf-8"
    )
    resolver = (
        root / "ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskIntentResolver.cs"
    ).read_text(encoding="utf-8")
    prompt = (
        root / "ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskPromptBuilder.cs"
    ).read_text(encoding="utf-8")
    collector = (
        root / "ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskEvidenceCollector.cs"
    ).read_text(encoding="utf-8")

    errors: list[str] = []
    if 'RankedPath = "RankedPath"' not in topic:
        errors.append("ask topic must include RankedPath")
    if "SecurityEvidencePathId" not in request:
        errors.append("ask request must include SecurityEvidencePathId")

    resolver_id = resolver.find("SecurityEvidencePathId")
    resolver_contains = resolver.find("ContainsAny")
    if resolver_id < 0:
        errors.append("intent resolver must inspect SecurityEvidencePathId")
    elif resolver_contains >= 0 and resolver_id > resolver_contains:
        errors.append("SecurityEvidencePathId must win before keyword topics")

    for sentence in (
        "Do not return a new composite sort.",
        "Do not return a numeric likelihood or probability.",
    ):
        if sentence not in prompt:
            errors.append(f"prompt must contain {sentence!r}")

    for field_name in ('"probability"', '"likelihood"', '"sortScore"'):
        if field_name in prompt:
            errors.append(f"prompt must not add JSON field {field_name}")

    for dependency in (
        "ISecurityEvidencePathRepository",
        "ISecurityEvidencePathRankRepository",
        "ISecurityEvidenceCutPointRepository",
    ):
        if dependency not in collector:
            errors.append(f"collector must use {dependency}")
    for forbidden in ("PathRankingEngine", "CutPointAnalysisEngine"):
        if forbidden in collector:
            errors.append(f"collector must not call {forbidden}")
    if "AskEvidenceRowCap = 50" not in prompt:
        errors.append("Ask evidence cap must remain 50")

    return errors


def main() -> int:
    errors = validate()
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("SecureNow cutting-edge source guard passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
