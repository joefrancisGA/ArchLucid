"""Shared helpers for vertical policy-pack packManifest validation (TB-175/TB-176)."""

from __future__ import annotations

import json
import re
from pathlib import Path

REQUIRED_PACK_MANIFEST_KEYS: tuple[str, ...] = (
    "id",
    "title",
    "targetBuyer",
    "buyerJob",
    "owner",
    "lastReviewedUtc",
    "requiredInputs",
    "expectedOutputs",
    "scopeLabel",
    "doNotUseWhen",
    "deferredScopeNotes",
    "buyerSafeCaveat",
    "sampleFindingSummary",
)

ALLOWED_SCOPE_LABELS: frozenset[str] = frozenset(
    {
        "V1-ready",
        "V1.1-deferred",
        "V2-deferred",
        "owner-input-required",
    }
)

CAVEAT_MARKERS: tuple[str, ...] = (
    "not certification",
    "not legal advice",
    "architecture-review",
    "architecture review",
)

FORBIDDEN_V1_READY_PHRASES: tuple[str, ...] = (
    "soc 2 certified",
    "hipaa certified",
    "pci certified",
    "iso 27001 certified",
    "gdpr certified",
    "guaranteed compliance",
)

ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def policy_packs_root(repo_root: Path) -> Path:
    return repo_root / "templates" / "policy-packs"


def list_vertical_pack_dirs(packs_root: Path) -> list[Path]:
    if not packs_root.is_dir():
        return []

    return sorted(
        path
        for path in packs_root.iterdir()
        if path.is_dir() and (path / "policy-pack.json").is_file()
    )


def load_policy_pack_document(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")

    return payload


def extract_pack_manifest(document: dict[str, object]) -> dict[str, object] | None:
    raw = document.get("packManifest")

    if raw is None:
        return None

    if not isinstance(raw, dict):
        raise ValueError("packManifest must be a JSON object")

    return raw


def validate_pack_manifest(pack_dir: Path, document: dict[str, object]) -> list[str]:
    errors: list[str] = []
    pack_id = pack_dir.name
    manifest = extract_pack_manifest(document)

    if manifest is None:
        errors.append(f"{pack_id}: policy-pack.json missing packManifest object")
        return errors

    for key in REQUIRED_PACK_MANIFEST_KEYS:
        value = manifest.get(key)

        if value is None or value == "" or value == []:
            errors.append(f"{pack_id}: packManifest missing or empty '{key}'")

    manifest_id = str(manifest.get("id", "")).strip()

    if manifest_id and manifest_id != pack_id:
        errors.append(f"{pack_id}: packManifest.id '{manifest_id}' must match folder name")

    scope = str(manifest.get("scopeLabel", "")).strip()

    if scope and scope not in ALLOWED_SCOPE_LABELS:
        errors.append(f"{pack_id}: invalid scopeLabel '{scope}'")

    reviewed = str(manifest.get("lastReviewedUtc", "")).strip()

    if reviewed and not ISO_DATE_RE.match(reviewed):
        errors.append(f"{pack_id}: lastReviewedUtc must be YYYY-MM-DD")

    caveat = str(manifest.get("buyerSafeCaveat", "")).lower()

    if caveat and not any(marker in caveat for marker in CAVEAT_MARKERS):
        errors.append(f"{pack_id}: buyerSafeCaveat must state not-certification / architecture-review scope")

    deferred = str(manifest.get("deferredScopeNotes", "")).lower()
    combined = f"{manifest.get('title', '')} {deferred} {caveat}".lower()

    if scope == "V1-ready":
        for phrase in FORBIDDEN_V1_READY_PHRASES:
            if phrase in combined and f"not {phrase.split()[0]}" not in combined:
                window = combined[max(0, combined.find(phrase) - 24) : combined.find(phrase)]

                if not any(token in window for token in ("not ", "no ", "does not ", "out of scope")):
                    errors.append(f"{pack_id}: V1-ready packManifest implies forbidden claim '{phrase}'")

    rules_path = pack_dir / "compliance-rules.json"

    if not rules_path.is_file():
        errors.append(f"{pack_id}: missing compliance-rules.json")

    rule_keys = document.get("complianceRuleKeys") or []

    if not isinstance(rule_keys, list) or len(rule_keys) == 0:
        errors.append(f"{pack_id}: complianceRuleKeys must be a non-empty array")

    return errors


def collect_manifest_rows(repo_root: Path) -> list[dict[str, object]]:
    packs_root = policy_packs_root(repo_root)
    rows: list[dict[str, object]] = []

    for pack_dir in list_vertical_pack_dirs(packs_root):
        document = load_policy_pack_document(pack_dir / "policy-pack.json")
        manifest = extract_pack_manifest(document)

        if manifest is None:
            continue

        rows.append(
            {
                "packDir": pack_dir.name,
                "manifest": manifest,
                "ruleCount": len(document.get("complianceRuleKeys") or []),
            },
        )

    return rows


def render_dry_run_index_markdown(rows: list[dict[str, object]]) -> str:
    lines: list[str] = [
        "> **Scope:** Operator/evaluator index for `templates/policy-packs/*` vertical templates.",
        "> **Generated from:** `packManifest` in each `policy-pack.json`. **Do not edit by hand** — run",
        "> `python scripts/ci/generate_policy_pack_dry_run_index.py --write`.",
        "",
        "# Policy pack dry-run index (TB-176)",
        "",
        "Maps buyer jobs to **vertical policy-pack templates** (distinct from the 23+ **bundled default**",
        "platform packs seeded at tenant provision). Use governance **policy-pack dry-run** in the operator",
        "shell after assigning a pack; outputs are architecture-review evidence, **not certification**.",
        "",
        "| Pack ID | Buyer job | Target persona | Required inputs | Expected outputs | Scope | Do not use when |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]

    for row in rows:
        manifest = row["manifest"]
        assert isinstance(manifest, dict)
        pack_id = str(manifest.get("id", row["packDir"]))
        required = manifest.get("requiredInputs") or []
        outputs = manifest.get("expectedOutputs") or []
        avoid = manifest.get("doNotUseWhen") or []

        def _cell(items: object) -> str:
            if not isinstance(items, list):
                return str(items).replace("|", "/")

            return "; ".join(str(item).replace("|", "/") for item in items)

        lines.append(
            "| "
            + " | ".join(
                [
                    f"[`{pack_id}`](../../templates/policy-packs/{pack_id}/)",
                    str(manifest.get("buyerJob", "")).replace("|", "/"),
                    str(manifest.get("targetBuyer", "")).replace("|", "/"),
                    _cell(required),
                    _cell(outputs),
                    str(manifest.get("scopeLabel", "")),
                    _cell(avoid),
                ],
            )
            + " |",
        )

    lines.extend(
        [
            "",
            "## Buyer-safe caveats (all packs)",
            "",
        ],
    )

    for row in rows:
        manifest = row["manifest"]
        assert isinstance(manifest, dict)
        pack_id = str(manifest.get("id", row["packDir"]))
        caveat = str(manifest.get("buyerSafeCaveat", "")).strip()
        sample = str(manifest.get("sampleFindingSummary", "")).strip()
        lines.append(f"- **{pack_id}:** {caveat} Sample: {sample}")

    lines.extend(
        [
            "",
            "## Related surfaces",
            "",
            "- Starter proof packs (ZIP evidence path): [`ACCELERATOR_CHOOSER.md`](ACCELERATOR_CHOOSER.md)",
            "- Bundled default packs (tenant seed): [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)",
            "- Metadata contract: [`POLICY_PACK_METADATA_CONTRACT.md`](POLICY_PACK_METADATA_CONTRACT.md)",
            "- First-pilot governance proof: [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)",
            "",
        ],
    )

    return "\n".join(lines)


def policy_pack_manifest_violations(repo_root: Path) -> list[str]:
    violations: list[str] = []
    packs_root = policy_packs_root(repo_root)
    pack_dirs = list_vertical_pack_dirs(packs_root)

    if not pack_dirs:
        violations.append(f"{packs_root.relative_to(repo_root)}: no vertical policy-pack directories")
        return violations

    for pack_dir in pack_dirs:
        pack_path = pack_dir / "policy-pack.json"

        try:
            document = load_policy_pack_document(pack_path)
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            violations.append(f"{pack_dir.name}: policy-pack.json invalid: {exc}")
            continue

        violations.extend(validate_pack_manifest(pack_dir, document))

    index_path = repo_root / "docs" / "library" / "POLICY_PACK_DRY_RUN_INDEX.md"

    if index_path.is_file():
        index_text = index_path.read_text(encoding="utf-8", errors="replace")

        for pack_dir in pack_dirs:
            if pack_dir.name not in index_text:
                violations.append(f"POLICY_PACK_DRY_RUN_INDEX.md does not reference pack '{pack_dir.name}'")

    return violations
