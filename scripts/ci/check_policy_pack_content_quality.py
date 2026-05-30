#!/usr/bin/env python3
"""Validate bundled default policy pack content quality (assessment improvement #18)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BUNDLED_DIR = REPO_ROOT / "ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled"
MANIFEST_PATH = BUNDLED_DIR / "bundled-policy-packs-v1.manifest.json"
DOC_PATH = REPO_ROOT / "docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md"

REQUIRED_METADATA_KEYS = ("pack.displayName", "pack.description")
FORBIDDEN_CERTIFICATION_PHRASES = (
    "soc 2 certified",
    "gdpr certified",
    "hipaa certified",
    "pci certified",
    "iso 27001 certified",
    "guaranteed compliance",
    "certification achieved",
    "fully compliant with",
    "statutory certification",
)
NEGATION_PREFIXES = ("not ", "no ", "non-", "without ", "does not ", "do not ")


def _line_has_negated_certification_claim(line: str, phrase: str) -> bool:
    lower = line.lower()
    idx = lower.find(phrase)

    if idx < 0:
        return False

    prefix = lower[max(0, idx - 40) : idx]

    return any(token in prefix for token in NEGATION_PREFIXES)


def _collect_certification_violations(text: str, rel_path: str) -> list[str]:
    violations: list[str] = []

    for line_no, line in enumerate(text.splitlines(), start=1):
        lower = line.lower()

        for phrase in FORBIDDEN_CERTIFICATION_PHRASES:
            if phrase in lower and not _line_has_negated_certification_claim(line, phrase):
                violations.append(f"{rel_path}:{line_no}: unsupported certification language {phrase!r}")

    return violations


def policy_pack_content_quality_violations(root: Path) -> list[str]:
    violations: list[str] = []

    if not MANIFEST_PATH.is_file():
        return [f"{MANIFEST_PATH.relative_to(root)}: missing manifest"]

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    content_files: list[str] = manifest.get("contentFiles") or []

    if not content_files:
        violations.append(f"{MANIFEST_PATH.relative_to(root)}: contentFiles is empty")

    seen_rule_keys: dict[str, str] = {}
    seen_display_names: dict[str, str] = {}

    for file_name in content_files:
        pack_path = BUNDLED_DIR / file_name

        if not pack_path.is_file():
            violations.append(f"{pack_path.relative_to(root)}: missing bundled content file")
            continue

        text = pack_path.read_text(encoding="utf-8")
        violations.extend(_collect_certification_violations(text, str(pack_path.relative_to(root))))

        try:
            document = json.loads(text)
        except json.JSONDecodeError as exc:
            violations.append(f"{pack_path.relative_to(root)}: invalid JSON ({exc})")
            continue

        metadata = document.get("metadata") or {}

        for key in REQUIRED_METADATA_KEYS:
            value = metadata.get(key)

            if not isinstance(value, str) or not value.strip():
                violations.append(f"{pack_path.relative_to(root)}: missing metadata key {key!r}")

        display_name = str(metadata.get("pack.displayName", "")).strip()

        if display_name:
            if display_name in seen_display_names:
                violations.append(
                    f"{pack_path.relative_to(root)}: duplicate pack.displayName {display_name!r} "
                    f"(also in {seen_display_names[display_name]})"
                )
            else:
                seen_display_names[display_name] = file_name

        description = str(metadata.get("pack.description", "")).lower()
        has_disclaimer_key = isinstance(metadata.get("frameworkMappingDisclaimer"), str) and metadata[
            "frameworkMappingDisclaimer"
        ].strip()
        has_not_cert_wording = "not certification" in description or "not legal" in description

        if not has_disclaimer_key and not has_not_cert_wording:
            violations.append(
                f"{pack_path.relative_to(root)}: missing frameworkMappingDisclaimer or not-certification wording"
            )

        rule_keys = document.get("complianceRuleKeys") or []

        if not isinstance(rule_keys, list) or len(rule_keys) == 0:
            violations.append(f"{pack_path.relative_to(root)}: complianceRuleKeys must be a non-empty array")

        for rule_key in rule_keys:
            if not isinstance(rule_key, str) or not rule_key.strip():
                violations.append(f"{pack_path.relative_to(root)}: invalid complianceRuleKey entry")
                continue

            normalized = rule_key.strip()

            if normalized in seen_rule_keys:
                violations.append(
                    f"{pack_path.relative_to(root)}: duplicate complianceRuleKey {normalized!r} "
                    f"(also in {seen_rule_keys[normalized]})"
                )
            else:
                seen_rule_keys[normalized] = file_name

        curated_rel = metadata.get("curatedRulesArtifact")

        if isinstance(curated_rel, str) and curated_rel.strip():
            curated_path = root / curated_rel.strip()

            if not curated_path.is_file():
                violations.append(f"{pack_path.relative_to(root)}: curatedRulesArtifact missing at {curated_rel}")
                continue

            curated = json.loads(curated_path.read_text(encoding="utf-8"))
            rules = curated.get("rules") or []
            curated_ids = {str(rule.get("id", "")).strip() for rule in rules if isinstance(rule, dict)}
            curated_ids.discard("")

            expected_ids = {str(key).strip() for key in rule_keys if isinstance(key, str)}

            if expected_ids != curated_ids:
                violations.append(
                    f"{pack_path.relative_to(root)}: complianceRuleKeys mismatch curated rules "
                    f"(expected {len(expected_ids)}, curated {len(curated_ids)})"
                )

            for rule in rules:
                if not isinstance(rule, dict):
                    continue

                rule_id = str(rule.get("id", "")).strip()
                rationale = str(rule.get("description", "")).strip()

                if not rule_id:
                    violations.append(f"{curated_path.relative_to(root)}: rule missing id")
                    continue

                if not rationale:
                    violations.append(f"{curated_path.relative_to(root)}: rule {rule_id!r} missing rationale/description")

                mappings = rule.get("frameworkMappings") or []

                if mappings and not has_disclaimer_key:
                    violations.append(
                        f"{curated_path.relative_to(root)}: rule {rule_id!r} has frameworkMappings "
                        f"but pack {file_name} lacks frameworkMappingDisclaimer"
                    )

    manifest_count = len(content_files)
    on_disk_count = len(list(BUNDLED_DIR.glob("*.json"))) - 1  # exclude manifest file

    if manifest_count != on_disk_count:
        violations.append(
            f"bundled manifest lists {manifest_count} content files but {on_disk_count} pack JSON files exist"
        )

    if DOC_PATH.is_file():
        doc_text = DOC_PATH.read_text(encoding="utf-8")
        match = re.search(r"manifest still ships\s+\*\*(\d+)\*\*", doc_text, flags=re.IGNORECASE)

        if match is not None:
            documented_count = int(match.group(1))

            if documented_count != manifest_count:
                violations.append(
                    f"{DOC_PATH.relative_to(root)}: documented bundled count {documented_count} "
                    f"!= manifest contentFiles {manifest_count}"
                )

    return violations


def main() -> int:
    violations = policy_pack_content_quality_violations(REPO_ROOT)

    if violations:
        print("Policy pack content quality FAILED:", file=sys.stderr)

        for item in violations:
            print(f"  - {item}", file=sys.stderr)

        return 1

    print("Policy pack content quality: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
