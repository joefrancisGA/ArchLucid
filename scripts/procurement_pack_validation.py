#!/usr/bin/env python3
"""
Shared procurement pack validation helpers (canonical sources, honesty checks, previews).

Imported by scripts/build_procurement_pack.py and scripts/validate_procurement_pack.py.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path


_TEMPLATE_REQUIRED_SUBSTRINGS: tuple[tuple[Path, tuple[str, ...]], ...] = (
    (
        Path("docs/go-to-market/DPA_TEMPLATE.md"),
        ("**Important — not legal advice:**", "working template"),
    ),
    (
        Path("docs/go-to-market/ORDER_FORM_TEMPLATE.md"),
        ("**Important — not legal advice:**", "working template"),
    ),
)

# False-attestation wording on Evidence/Self-assessment sources and selected buyer narratives.
_ASSURANCE_FORBIDDEN_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (
        re.compile(
            r"\bSOC\s*2\s*Type\s*(?:II|2)\s+(?:CPA\s+)?(?:audit\s+)?(?:report|opinion)\s+(?:is\s+|are\s+|was\s+|were\s+)?"
            r"(?:available|issued|released|published|delivered)",
            re.IGNORECASE,
        ),
        'implies a SOC 2 Type II CPA report/opinion is "available/issued" (audit rule)',
    ),
    (
        re.compile(
            r"\b(?:SOC\s*)?2\s*Type\s*(?:II|2)\s+(?:CPA\s*)?(?:attestation|audit)\s+(?:is\s+|has\s+been\s+)?"
            r"(?:obtained|completed|issued|delivered)",
            re.IGNORECASE,
        ),
        'implies SOC 2 Type II CPA attestation is "issued/completed/obtained" (audit rule)',
    ),
    (
        re.compile(
            r"\b(?:we\s+have|ArchLucid\s+has)\s+(?:an?\s+|the\s+)?(?:current\s+|valid\s+|active\s+)?"
            r"ISO\s*27001\s+(?:certificate|certification)\b",
            re.IGNORECASE,
        ),
        "implies ArchLucid holds an ISO 27001 certification (audit rule)",
    ),
    (
        re.compile(
            r"\b(?:third\s*[\s-]party\s+)?pen(?:etration)?(?:\s+test(?:ing)?)?\s+"
            r"(?:was\s+|has\s+been\s+)?(?:successfully\s+)?(?:passed|completed|executed\s+against\s+V1\b)",
            re.IGNORECASE,
        ),
        "implies a third-party penetration test passed/completed against V1 (audit rule)",
    ),
)


def load_canonical(root: Path) -> tuple[list[dict], list[dict]]:
    path = root / "scripts" / "procurement_pack_canonical.json"
    data = json.loads(path.read_text(encoding="utf-8"))

    return data["canonical_entries"], data["excluded_from_canonical_pack"]


def validate_canonical_sources(root: Path, entries: list[dict]) -> list[str]:
    missing: list[str] = []

    for e in entries:
        src = root / e["source_repo_path"]

        if not src.is_file():
            missing.append(e["source_repo_path"])

    return missing


def _extract_last_reviewed_utc_date(text: str) -> datetime | None:
    m = re.search(r"\*\*Last reviewed:\*\*\s*(\d{4}-\d{2}-\d{2})", text)

    if m is None:

        return None

    try:
        return datetime.strptime(m.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:

        return None


def assurance_freshness_violations(
    root: Path,
    *,
    paths_relative: tuple[Path, ...],
    max_review_age_days: int,
) -> list[str]:
    violations: list[str] = []
    utc_now = datetime.now(timezone.utc)

    for rel in paths_relative:
        p = root / rel

        if not p.is_file():
            violations.append(f"{rel.as_posix()}: missing file (**Last reviewed** check)")
            continue

        text = p.read_text(encoding="utf-8", errors="replace")
        reviewed = _extract_last_reviewed_utc_date(text)

        if reviewed is None:
            violations.append(f"{rel.as_posix()}: missing **Last reviewed:** YYYY-MM-DD")
            continue

        age_days = (utc_now - reviewed).days

        if age_days > max_review_age_days:
            violations.append(
                f"{rel.as_posix()}: **Last reviewed:** {reviewed.date().isoformat()} is {age_days} days old "
                f"(>{max_review_age_days}) — field: **Last reviewed:**",
            )

    return violations


def coherence_procurement_claims(text: str) -> str | None:
    """Shared with scripts/ci/check_procurement_claim_coherence.py — document-level rules."""
    lowered = text.lower()

    if "soc 2 type ii" in lowered:
        sanity_markers = (
            "not yet issued",
            "not currently issued",
            "| not issued",
            "not issued|",
            "**not issued",
            "**deferred**",
            "deferred ",
            "excluded from this skim",
        )

        if not any(marker in lowered for marker in sanity_markers):
            return (
                'mentions "SOC 2 Type II" without non-issued / deferral scaffolding; '
                "expected one of: `not yet issued`, `not currently issued`, `not issued`, `deferred`, "
                "`excluded from this skim`"
            )

    if "third-party" in lowered and "in-flight" in lowered:
        return "contradictory assurance language: combines third-party wording with `in-flight`"

    return None


def forbidden_assurance_phrases(
    root: Path,
    *,
    canonical_entries: list[dict],
) -> list[str]:
    """Scan Evidence + Self-assessment pack sources plus key buyer narratives."""
    violations: list[str] = []

    todo: dict[str, Path] = {}

    for e in canonical_entries:
        status = e.get("artifact_status", "Evidence")

        if status not in ("Evidence", "Self-assessment"):
            continue

        rel = Path(e["source_repo_path"])

        todo[rel.as_posix()] = root / rel

    extra_buyer_docs = (
        Path("docs/go-to-market/TRUST_CENTER.md"),
        Path("docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md"),
        Path("docs/go-to-market/PROCUREMENT_FAQ.md"),
        Path("docs/go-to-market/SOC2_STATUS_PROCUREMENT.md"),
        Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md"),
        Path("docs/go-to-market/PROCUREMENT_FAST_LANE.md"),
    )

    for rel in extra_buyer_docs:
        todo[rel.as_posix()] = root / rel

    for posix, fs_path in sorted(todo.items()):
        if not fs_path.is_file():
            violations.append(f"{posix}: missing file (cannot run assurance wording scan)")
            continue

        if fs_path.suffix.lower() != ".md":
            continue

        text = fs_path.read_text(encoding="utf-8", errors="replace")
        coherence = coherence_procurement_claims(text)

        if coherence is not None:
            violations.append(f"{posix}: {coherence}")

        for pat, reason in _ASSURANCE_FORBIDDEN_PATTERNS:
            matched = pat.search(text)

            if matched is None:
                continue

            excerpt = matched.group(0)

            violations.append(f"{posix}: {reason}; matched `{excerpt!s}`")

    return violations


def template_only_markers(root: Path) -> list[str]:
    errors: list[str] = []

    for rel_path, needles in _TEMPLATE_REQUIRED_SUBSTRINGS:
        p = root / rel_path

        if not p.is_file():

            errors.append(f"{rel_path.as_posix()}: missing legal template source")

            continue

        text = p.read_text(encoding="utf-8", errors="replace")

        missing = tuple(n for n in needles if n not in text)

        if missing:
            joined = "; ".join(f"`{m}`" for m in missing)
            errors.append(f"{rel_path.as_posix()}: template-only banners incomplete — missing {joined}")

    return errors


def deal_ready_repo_checks(root: Path, entries: list[dict], max_review_age_days: int) -> list[str]:
    violations: list[str] = []

    required_docs = (
        root / "docs" / "go-to-market" / "ASSURANCE_STATUS_CANONICAL.md",
        root / "docs" / "go-to-market" / "TRUST_CENTER.md",
        root / "docs" / "go-to-market" / "SOC2_STATUS_PROCUREMENT.md",
        root / "docs" / "go-to-market" / "CURRENT_ASSURANCE_POSTURE.md",
        root / "docs" / "go-to-market" / "INCIDENT_COMMUNICATIONS_POLICY.md",
    )

    for p in required_docs:

        if not p.is_file():
            violations.append(f"missing required deal-ready doc: {p.relative_to(root).as_posix()}")
            continue

        text = p.read_text(encoding="utf-8", errors="replace")

        if "ASSURANCE_STATUS_CANONICAL.md" not in text and p.name != "ASSURANCE_STATUS_CANONICAL.md":
            violations.append(f"{p.relative_to(root).as_posix()}: missing canonical assurance status reference")

        last_reviewed = _extract_last_reviewed_utc_date(text)

        if last_reviewed is None:

            violations.append(f"{p.relative_to(root).as_posix()}: missing **Last reviewed:** YYYY-MM-DD marker")
            continue

        age_days = (datetime.now(timezone.utc) - last_reviewed).days

        if age_days > max_review_age_days:
            violations.append(
                f"{p.relative_to(root).as_posix()}: Last reviewed is {age_days} days old "
                f"(max {max_review_age_days})"
            )

    trust = root / "docs" / "go-to-market" / "TRUST_CENTER.md"
    incident = root / "docs" / "go-to-market" / "INCIDENT_COMMUNICATIONS_POLICY.md"

    if trust.is_file() and "security@archlucid.net" not in trust.read_text(encoding="utf-8", errors="replace"):
        violations.append("TRUST_CENTER.md: missing security contact mailbox (`security@archlucid.net`)")

    if incident.is_file() and "security@archlucid.net" not in incident.read_text(
        encoding="utf-8", errors="replace"
    ):
        violations.append(
            "INCIDENT_COMMUNICATIONS_POLICY.md: missing fallback security contact mailbox "
            "(`security@archlucid.net`)"
        )

    missing_status = [e.get("pack_path", "") for e in entries if not e.get("artifact_status")]

    if missing_status:
        violations.append("canonical entries missing artifact_status field: " + ", ".join(missing_status))

    return violations


def manifest_from_sources(root: Path, entries: list[dict]) -> dict:
    utc = datetime.now(timezone.utc).isoformat()
    rows: list[dict] = []

    for e in entries:
        raw = (root / e["source_repo_path"]).read_bytes()
        digest = hashlib.sha256(raw).hexdigest()

        rows.append(
            {
                "pack_path": e["pack_path"],
                "source_repo_path": e["source_repo_path"],
                "bytes": len(raw),
                "sha256": digest,
                "artifact_status": e.get("artifact_status", "Evidence"),
            },
        )

    return {"generated_utc": utc, "files": rows, "mode": "dry_run_manifest_from_repo_sources"}


def redaction_report_markdown(root: Path, excluded: list[dict]) -> str:
    lines = [
        "# Redaction / omission report (dry-run preview)",
        "",
        "Manifest rows were computed directly from **`source_repo_path`** without staging a customer-specific cover.",
        "",
        "The canonical procurement ZIP (see `scripts/procurement_pack_canonical.json`) **includes only** the reviewer checklist. "
        "The following repository paths are **not** copied into this pack and are listed here so owners can audit gaps.",
        "",
        "| Repository path | Reason |",
        "|-----------------|--------|",
    ]

    for row in excluded:

        path = row.get("path", "")
        reason = str(row.get("reason", "")).replace("|", "\\|")
        lines.append(f"| `{path}` | {reason} |")

    lines.append("")
    lines.append("**Do not** add unredacted customer names or deal-specific cover letter text without owner sign-off.")

    return "\n".join(lines) + "\n"


def write_dry_run_preview(root: Path, entries: list[dict], excluded: list[dict], out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_payload = manifest_from_sources(root, entries)

    (out_dir / "manifest.json").write_text(json.dumps(manifest_payload, indent=2) + "\n", encoding="utf-8")
    (out_dir / "redaction_report.md").write_text(redaction_report_markdown(root, excluded), encoding="utf-8")


def procurement_pack_quick_checks(
    root: Path,
    *,
    max_assurance_review_age_days: int,
    deal_ready_max_review_age_days: int,
    preview_dir: Path | None,
    run_buyer_claim_scans: bool,
    deal_ready_bundle: bool,
) -> list[str]:
    """Single entry-point for validators used by `--dry-run` and the standalone CLI."""
    errors: list[str] = []

    canonical_entries, excluded = load_canonical(root)

    missing = validate_canonical_sources(root, canonical_entries)

    if missing:
        errors.extend([f"missing canonical source `{m}`" for m in missing])

    if not deal_ready_bundle:
        errors.extend(
            assurance_freshness_violations(
                root,
                paths_relative=(
                    Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md"),
                    Path("docs/go-to-market/TRUST_CENTER.md"),
                ),
                max_review_age_days=max_assurance_review_age_days,
            ),
        )

    errors.extend(template_only_markers(root))

    if run_buyer_claim_scans:
        errors.extend(forbidden_assurance_phrases(root, canonical_entries=canonical_entries))

    if deal_ready_bundle:
        errors.extend(deal_ready_repo_checks(root, canonical_entries, deal_ready_max_review_age_days))

    preview_dir_normalized = preview_dir.resolve() if preview_dir is not None else None

    if preview_dir_normalized is not None and not errors:

        write_dry_run_preview(root, canonical_entries, excluded, preview_dir_normalized)

    return errors
