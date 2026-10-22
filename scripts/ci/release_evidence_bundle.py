#!/usr/bin/env python3
"""Canonical release evidence bundle manifest emit + validate (T2-10)."""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

_MANIFEST_SCHEMA = "archlucid.release-evidence-bundle.v1"
_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))
from release_evidence_profile_helpers import load_profiles as _load_profiles_from_helpers

_PROFILES_PATH = _CI_DIR / "data" / "release_evidence_bundle_profiles.v1.json"
_REAL_LLM_EVIDENCE_SCHEMA = "archlucid.real-llm-evidence-gate.v2"
_REAL_LLM_EVIDENCE_FILE = "real-llm-evidence-gate.json"
_REAL_LLM_EVIDENCE_STALE_AFTER_DAYS = 30
_REQUIRED_REAL_AGENT_PATHS = frozenset({"topology", "cost", "compliance", "critic"})
_BUYER_RC_REQUIRED_FILES: tuple[str, ...] = (
    "real-mode-claim-gate.json",
    "real-mode-claim-gate.md",
    "real-mode-evidence-freshness.json",
    "rc-go-no-go-verdict.json",
)
_BUYER_RC_OPTIONAL_WAIVER_FILES: tuple[str, ...] = (
    "simulator-only-override.md",
)


@dataclass(frozen=True)
class MissingRequirement:
    kind: str
    target: str
    detail: str

    def as_dict(self) -> dict[str, str]:
        return {"kind": self.kind, "target": self.target, "detail": self.detail}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_profiles() -> dict[str, Any]:
    return _load_profiles_from_helpers()


def sha256_hex(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def list_bundle_files(bundle_dir: Path, *, exclude_manifest: str) -> list[Path]:
    files: list[Path] = []

    for path in sorted(bundle_dir.rglob("*")):
        if not path.is_file():
            continue

        if path.name.lower() == exclude_manifest.lower():
            continue

        files.append(path.relative_to(bundle_dir))

    return files


def build_artifact_rows(bundle_dir: Path, relative_paths: list[Path], *, exclude_manifest: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    for relative in relative_paths:
        full_path = bundle_dir / relative

        if not full_path.is_file():
            continue

        content = full_path.read_bytes()
        rows.append(
            {
                "path": relative.as_posix(),
                "sha256": sha256_hex(content),
                "sizeBytes": len(content),
            }
        )

    return rows


def pattern_matches(bundle_dir: Path, pattern: str) -> list[str]:
    matches: list[str] = []

    for path in bundle_dir.rglob("*"):
        if not path.is_file():
            continue

        relative = path.relative_to(bundle_dir).as_posix()

        if fnmatch.fnmatch(relative, pattern):
            matches.append(relative)

    return sorted(matches)


def _parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None

    normalized = value.strip().replace("Z", "+00:00")

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def _normalize_agent_path(value: Any) -> str:
    if isinstance(value, str):
        return value.strip().lower()

    if isinstance(value, int):
        return {1: "topology", 2: "cost", 3: "compliance", 4: "critic"}.get(value, str(value))

    return ""


def _extract_agent_path_name(agent_path: Any) -> str:
    if not isinstance(agent_path, dict):
        return ""

    for key in ("agentPath", "agentName", "agentType", "name", "path", "code"):
        normalized = _normalize_agent_path(agent_path.get(key))

        if normalized:
            return normalized

    return ""


def evaluate_real_mode_ai_evidence(bundle_dir: Path) -> dict[str, Any]:
    evidence_path = bundle_dir / _REAL_LLM_EVIDENCE_FILE
    override_path = bundle_dir / "simulator-only-override.md"

    if not evidence_path.is_file():
        return {
            "status": "MISSING",
            "artifact": _REAL_LLM_EVIDENCE_FILE,
            "claimBoundary": "No real-mode AI evidence artifact attached. Release is simulator-only unless an approved simulator-only override is present.",
            "isCurrent": False,
            "daysOld": None,
            "simulatorOnlyOverridePresent": override_path.is_file(),
            "detail": "missing real-llm-evidence-gate.json",
        }

    try:
        evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {
            "status": "HOLD",
            "artifact": _REAL_LLM_EVIDENCE_FILE,
            "claimBoundary": "Real-mode AI quality gate is HOLD. Release claims are limited to simulator-only or partial-real-mode posture.",
            "isCurrent": False,
            "daysOld": None,
            "simulatorOnlyOverridePresent": override_path.is_file(),
            "detail": "real-llm-evidence-gate.json is not valid JSON",
        }

    generated = _parse_datetime(evidence.get("generatedUtc"))
    now = datetime.now(timezone.utc)
    age = now - generated if generated is not None else None
    days_old = age.days if age is not None else None
    is_current = age is not None and age <= timedelta(days=_REAL_LLM_EVIDENCE_STALE_AFTER_DAYS)
    schema = evidence.get("schema")
    outcome = str(evidence.get("overallOutcome", "")).upper()
    execution_mode = str(evidence.get("executionMode", "")).lower()
    agent_paths = evidence.get("agentPaths", [])
    present_paths = {
        _extract_agent_path_name(agent_path)
        for agent_path in agent_paths
        if _extract_agent_path_name(agent_path)
    } if isinstance(agent_paths, list) else set()
    missing_paths = sorted(_REQUIRED_REAL_AGENT_PATHS - present_paths)

    if schema != _REAL_LLM_EVIDENCE_SCHEMA:
        status = "HOLD"
        detail = f"schema mismatch: expected {_REAL_LLM_EVIDENCE_SCHEMA}, found {schema or '(missing)'}"
        claim_boundary = "Real-mode AI quality gate is HOLD. Release claims are limited to simulator-only or partial-real-mode posture."
    elif not is_current:
        status = "STALE"
        detail = f"artifact older than {_REAL_LLM_EVIDENCE_STALE_AFTER_DAYS} days or missing generatedUtc"
        claim_boundary = "Real-mode AI evidence artifact is stale. Re-run Invoke-RealLlmEvidenceGate.ps1 before claiming current real-mode status."
    elif outcome == "PASS" and execution_mode == "real" and not missing_paths:
        status = "PASS"
        detail = "full real-mode AI evidence is current and covers Topology, Cost, Compliance, and Critic"
        claim_boundary = "Full real-mode AI evidence: Topology, Cost, Compliance, and Critic agents all passed the real-mode quality gate."
    elif outcome == "WARN":
        status = "WARN"
        detail = "partial or marginal real-mode AI evidence"
        claim_boundary = "Partial real-mode AI evidence. Review per-agent status before making release claims."
    else:
        status = "HOLD"
        detail = "real-mode AI gate is not PASS/WARN current evidence"
        claim_boundary = "Real-mode AI quality gate is HOLD. Release claims are limited to simulator-only or partial-real-mode posture."

    return {
        "status": status,
        "artifact": _REAL_LLM_EVIDENCE_FILE,
        "claimBoundary": claim_boundary,
        "isCurrent": is_current,
        "daysOld": days_old,
        "generatedUtc": evidence.get("generatedUtc"),
        "overallOutcome": outcome or None,
        "executionMode": execution_mode or None,
        "missingAgentPaths": missing_paths,
        "simulatorOnlyOverridePresent": override_path.is_file(),
        "detail": detail,
    }


def _evaluate_strict_rc_machine_outputs(bundle_dir: Path) -> list[MissingRequirement]:
    missing: list[MissingRequirement] = []

    confidence_path = bundle_dir / "release-confidence-rollup.json"
    confidence = None

    if confidence_path.is_file():
        try:
            confidence = json.loads(confidence_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            missing.append(
                MissingRequirement(
                    kind="strictRcMachineOutput",
                    target="release-confidence-rollup.json",
                    detail="unreadable — strict RC requires strictDisposition and strictBlockingReasons",
                )
            )
    else:
        missing.append(
            MissingRequirement(
                kind="strictRcMachineOutput",
                target="release-confidence-rollup.json",
                detail="missing — run build_release_confidence_rollup.py --strict-rc",
            )
        )

    if confidence is not None:
        strict_disposition = str(confidence.get("strictDisposition") or "").upper()

        if strict_disposition != "PASS":
            reasons = confidence.get("strictBlockingReasons") or []
            detail = f"strictDisposition={strict_disposition or 'MISSING'}"

            if isinstance(reasons, list) and reasons:
                detail += f"; strictBlockingReasons={reasons[:5]}"

            missing.append(
                MissingRequirement(
                    kind="strictRcMachineOutput",
                    target="release-confidence-rollup.json",
                    detail=detail,
                )
            )

    signoff_path = bundle_dir / "rc-evidence-signoff-bundle.json"
    signoff = None

    if signoff_path.is_file():
        try:
            signoff = json.loads(signoff_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            missing.append(
                MissingRequirement(
                    kind="strictRcMachineOutput",
                    target="rc-evidence-signoff-bundle.json",
                    detail="unreadable — strict RC signoff bundle required",
                )
            )
    else:
        missing.append(
            MissingRequirement(
                kind="strictRcMachineOutput",
                target="rc-evidence-signoff-bundle.json",
                detail="missing — run build_rc_evidence_signoff_bundle.py --strict-rc",
            )
        )

    if signoff is not None:
        overall = str(signoff.get("overallDisposition") or "").upper()

        if overall != "PASS":
            skipped = signoff.get("skippedHighRiskGates") or []
            detail = f"overallDisposition={overall or 'MISSING'}"

            if isinstance(skipped, list) and skipped:
                detail += f"; skippedHighRiskGates={skipped[:8]}"

            missing.append(
                MissingRequirement(
                    kind="strictRcMachineOutput",
                    target="rc-evidence-signoff-bundle.json",
                    detail=detail,
                )
            )

        references = signoff.get("references") if isinstance(signoff.get("references"), dict) else {}

        for ref_key, ref_file in (
            ("releaseConfidenceRollup", "release-confidence-rollup.json"),
            ("rcGoNoGoVerdict", "rc-go-no-go-verdict.json"),
        ):
            if ref_key not in references:
                missing.append(
                    MissingRequirement(
                        kind="strictRcMachineOutput",
                        target="rc-evidence-signoff-bundle.json",
                        detail=f"references.{ref_key} must reference {ref_file} for machine-readable RC handoff",
                    )
                )

    parity_path = bundle_dir / "release-smoke-live-ui-sql-result.json"

    if not parity_path.is_file():
        missing.append(
            MissingRequirement(
                kind="strictRcMachineOutput",
                target="release-smoke-live-ui-sql-result.json",
                detail=(
                    "missing — run scripts/release-smoke-rc.ps1 "
                    "-ResultOut artifacts/release-smoke-live-ui-sql-result.json"
                ),
            )
        )
    else:
        try:
            parity = json.loads(parity_path.read_text(encoding="utf-8"))
            evidence_kind = str(parity.get("evidenceKind") or "").lower()
            verdict = str(parity.get("verdict") or parity.get("status") or "").strip().upper()
            profile = str(parity.get("profile") or "")

            if evidence_kind != "live-ui-sql-parity":
                missing.append(
                    MissingRequirement(
                        kind="strictRcMachineOutput",
                        target="release-smoke-live-ui-sql-result.json",
                        detail=f"evidenceKind expected live-ui-sql-parity, got {evidence_kind!r}",
                    )
                )

            if verdict != "PASS":
                missing.append(
                    MissingRequirement(
                        kind="strictRcMachineOutput",
                        target="release-smoke-live-ui-sql-result.json",
                        detail=f"verdict expected Pass/PASS, got {verdict!r}",
                    )
                )

            if profile not in {"LiveUiSql", "ReleaseCandidate"}:
                missing.append(
                    MissingRequirement(
                        kind="strictRcMachineOutput",
                        target="release-smoke-live-ui-sql-result.json",
                        detail=f"profile expected LiveUiSql or ReleaseCandidate, got {profile!r}",
                    )
                )
        except json.JSONDecodeError:
            missing.append(
                MissingRequirement(
                    kind="strictRcMachineOutput",
                    target="release-smoke-live-ui-sql-result.json",
                    detail="unreadable JSON",
                )
            )

    return missing


def evaluate_buyer_rc_packet(bundle_dir: Path, *, strict_buyer_rc: bool) -> list[MissingRequirement]:
    if not strict_buyer_rc:
        return []

    missing: list[MissingRequirement] = []
    simulator_override = bundle_dir / "simulator-only-override.md"
    waiver_present = simulator_override.is_file()

    for file_name in _BUYER_RC_REQUIRED_FILES:
        target = bundle_dir / file_name

        if target.is_file():
            continue

        if file_name.startswith("real-mode-") and waiver_present:
            continue

        missing.append(
            MissingRequirement(
                kind="buyerRcRequiredFile",
                target=file_name,
                detail="buyer-facing RC packet requires this artifact",
            )
        )

    freshness_path = bundle_dir / "real-mode-evidence-freshness.json"

    if freshness_path.is_file():
        try:
            freshness = json.loads(freshness_path.read_text(encoding="utf-8"))
            status = str(freshness.get("freshnessStatus", "")).upper()

            if status in {"STALE", "MISSING"} and not waiver_present:
                missing.append(
                    MissingRequirement(
                        kind="buyerRcFreshness",
                        target="real-mode-evidence-freshness.json",
                        detail=f"freshness status {status} blocks buyer-facing RC handoff",
                    )
                )
        except json.JSONDecodeError:
            missing.append(
                MissingRequirement(
                    kind="buyerRcFreshness",
                    target="real-mode-evidence-freshness.json",
                    detail="freshness artifact is not valid JSON",
                )
            )

    missing.extend(_evaluate_strict_rc_machine_outputs(bundle_dir))
    missing.extend(_evaluate_strict_buyer_real_mode_evidence(bundle_dir, waiver_present=waiver_present))

    return missing


def _evaluate_strict_buyer_real_mode_evidence(
    bundle_dir: Path,
    *,
    waiver_present: bool,
) -> list[MissingRequirement]:
    if waiver_present:
        return []

    real_mode = evaluate_real_mode_ai_evidence(bundle_dir)
    status = str(real_mode.get("status") or "MISSING").upper()

    if status == "PASS":
        return []

    return [
        MissingRequirement(
            kind="buyerRcRealModeEvidence",
            target=_REAL_LLM_EVIDENCE_FILE,
            detail=(
                f"strict buyer RC requires current real-mode AI evidence PASS or simulator-only override; "
                f"found {status}: {real_mode.get('detail')}"
            ),
        )
    ]


def evaluate_profile(bundle_dir: Path, profile_name: str, profiles_doc: dict[str, Any]) -> tuple[list[MissingRequirement], list[str], list[str]]:
    profile = profiles_doc["profiles"][profile_name]
    missing: list[MissingRequirement] = []
    present_required: list[str] = []
    present_optional: list[str] = []

    for file_name in profile.get("requiredFiles", []):
        target = bundle_dir / file_name

        if target.is_file():
            present_required.append(file_name)
        else:
            missing.append(
                MissingRequirement(
                    kind="requiredFile",
                    target=file_name,
                    detail="required artifact missing",
                )
            )

    for pattern_entry in profile.get("requiredPatterns", []):
        pattern = pattern_entry["pattern"]
        min_matches = int(pattern_entry.get("minMatches", 1))
        label = pattern_entry.get("label", pattern)
        matches = pattern_matches(bundle_dir, pattern)

        if len(matches) >= min_matches:
            present_required.extend(matches)
        else:
            missing.append(
                MissingRequirement(
                    kind="requiredPattern",
                    target=pattern,
                    detail=f"{label}: expected >= {min_matches} match(es), found {len(matches)}",
                )
            )

    for file_name in profile.get("optionalFiles", []):
        target = bundle_dir / file_name

        if target.is_file():
            present_optional.append(file_name)
        else:
            optional_matches = pattern_matches(bundle_dir, file_name)

            if optional_matches:
                present_optional.extend(optional_matches)

    return missing, present_required, present_optional


def emit_manifest(
    bundle_dir: Path,
    profile_name: str,
    *,
    rollup: str = "UNKNOWN",
    git_commit_sha: str = "unknown",
    archlucid_cli_version: str = "unknown",
    environment: str = "",
    profiles_doc: dict[str, Any] | None = None,
) -> Path:
    bundle_dir = bundle_dir.resolve()
    profiles_doc = profiles_doc or load_profiles()
    manifest_name = profiles_doc["manifestFileName"]
    missing, present_required, present_optional = evaluate_profile(bundle_dir, profile_name, profiles_doc)
    relative_paths = list_bundle_files(bundle_dir, exclude_manifest=manifest_name)
    real_mode_ai_evidence = evaluate_real_mode_ai_evidence(bundle_dir)

    manifest = {
        "schema": _MANIFEST_SCHEMA,
        "profile": profile_name,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "bundleRoot": bundle_dir.as_posix(),
        "gitCommitSha": git_commit_sha,
        "archLucidCliVersion": archlucid_cli_version,
        "environment": environment or None,
        "rollup": rollup,
        "requiredMinimum": {
            "requiredFiles": profiles_doc["profiles"][profile_name].get("requiredFiles", []),
            "requiredPatterns": profiles_doc["profiles"][profile_name].get("requiredPatterns", []),
        },
        "missingRequired": [item.as_dict() for item in missing],
        "realModeAiEvidence": real_mode_ai_evidence,
        "presentRequiredCount": len(present_required),
        "presentOptionalCount": len(present_optional),
        "artifacts": build_artifact_rows(bundle_dir, relative_paths, exclude_manifest=manifest_name),
    }

    manifest_path = bundle_dir / manifest_name
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest_path


def validate_bundle(
    bundle_dir: Path,
    profile_name: str,
    *,
    require_manifest: bool = True,
    profiles_doc: dict[str, Any] | None = None,
    strict_buyer_rc: bool = False,
) -> tuple[dict[str, Any], int]:
    bundle_dir = bundle_dir.resolve()
    profiles_doc = profiles_doc or load_profiles()

    if profile_name not in profiles_doc["profiles"]:
        report = {
            "schema": "archlucid.release-evidence-bundle-validation.v1",
            "profile": profile_name,
            "bundleRoot": bundle_dir.as_posix(),
            "verdict": "FAIL",
            "detail": f"unknown profile: {profile_name}",
            "missingRequired": [],
        }
        return report, 2

    missing, present_required, present_optional = evaluate_profile(bundle_dir, profile_name, profiles_doc)
    missing.extend(evaluate_buyer_rc_packet(bundle_dir, strict_buyer_rc=strict_buyer_rc))
    real_mode_ai_evidence = evaluate_real_mode_ai_evidence(bundle_dir)
    manifest_name = profiles_doc["manifestFileName"]
    manifest_path = bundle_dir / manifest_name
    manifest_errors: list[str] = []

    if require_manifest and not manifest_path.is_file():
        manifest_errors.append(f"missing manifest: {manifest_name}")
    elif manifest_path.is_file():
        try:
            manifest_doc = json.loads(manifest_path.read_text(encoding="utf-8"))

            if manifest_doc.get("schema") != _MANIFEST_SCHEMA:
                manifest_errors.append("manifest schema mismatch")

            if manifest_doc.get("profile") != profile_name:
                manifest_errors.append("manifest profile mismatch")
        except json.JSONDecodeError:
            manifest_errors.append("manifest is not valid JSON")

    all_missing = [item.as_dict() for item in missing]

    for error in manifest_errors:
        all_missing.append({"kind": "manifest", "target": manifest_name, "detail": error})

    verdict = "PASS" if not all_missing else "FAIL"
    exit_code = 0 if verdict == "PASS" else 2

    report = {
        "schema": "archlucid.release-evidence-bundle-validation.v1",
        "validatedUtc": datetime.now(timezone.utc).isoformat(),
        "profile": profile_name,
        "bundleRoot": bundle_dir.as_posix(),
        "verdict": verdict,
        "strictBuyerRc": strict_buyer_rc,
        "realModeAiEvidence": real_mode_ai_evidence,
        "presentRequiredCount": len(present_required),
        "presentOptionalCount": len(present_optional),
        "missingRequired": all_missing,
    }

    return report, exit_code


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    emit_parser = subparsers.add_parser("emit", help="Write release-evidence-bundle-manifest.json")
    emit_parser.add_argument("--dir", required=True, type=Path)
    emit_parser.add_argument("--profile", required=True)
    emit_parser.add_argument("--rollup", default="UNKNOWN")
    emit_parser.add_argument("--git-commit-sha", default="unknown")
    emit_parser.add_argument("--cli-version", default="unknown")
    emit_parser.add_argument("--environment", default="")

    validate_parser = subparsers.add_parser("validate", help="Validate bundle against profile minimum")
    validate_parser.add_argument("--dir", required=True, type=Path)
    validate_parser.add_argument("--profile", required=True)
    validate_parser.add_argument("--json-out", type=Path, default=None)
    validate_parser.add_argument("--no-require-manifest", action="store_true")
    validate_parser.add_argument(
        "--strict-buyer-rc",
        action="store_true",
        help="Require buyer-facing RC packet artifacts (claim gate, freshness summary, go/no-go verdict).",
    )

    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    if args.command == "emit":
        manifest_path = emit_manifest(
            args.dir,
            args.profile,
            rollup=args.rollup,
            git_commit_sha=args.git_commit_sha,
            archlucid_cli_version=args.cli_version,
            environment=args.environment,
        )
        print(f"release_evidence_bundle: wrote {manifest_path}")
        return 0

    report, exit_code = validate_bundle(
        args.dir,
        args.profile,
        require_manifest=not args.no_require_manifest,
        strict_buyer_rc=args.strict_buyer_rc,
    )

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if exit_code != 0:
        print(f"release_evidence_bundle: {report['verdict']} ({len(report['missingRequired'])} issue(s))", file=sys.stderr)

        for item in report["missingRequired"]:
            print(f"  - {item['kind']}: {item['target']} — {item['detail']}", file=sys.stderr)
    else:
        print(f"release_evidence_bundle: {report['verdict']} profile={args.profile}")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
