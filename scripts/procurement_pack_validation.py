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

import procurement_scope_classification as scope_class


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
# Buyer-visible procurement index must not ship TODO/TBD-style stubs (stricter than Template-pack paths).
BUYER_INDEX_PLACEHOLDER_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bTBD\b", re.IGNORECASE), "TBD placeholder"),
    (re.compile(r"\bTODO\b", re.IGNORECASE), "TODO placeholder"),
    (
        re.compile(r"placeholder-replace-before-launch", re.IGNORECASE),
        "placeholder-replace-before-launch marker",
    ),
)


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
        Path("docs/go-to-market/PROCUREMENT_PACK_INDEX.md"),
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
        violations.extend(assurance_phrase_violations_for_text(text, posix))

    return violations


def buyer_index_placeholder_violations(text: str, posix_label: str) -> list[str]:
    """Fail loud on stub tokens in the canonical procurement index (buyer-facing)."""
    violations: list[str] = []

    for pat, label in BUYER_INDEX_PLACEHOLDER_PATTERNS:
        matched = pat.search(text)

        if matched is None:

            continue

        violations.append(f"{posix_label}: buyer index must not contain {label}; matched `{matched.group(0)!s}`")

    return violations


def assurance_phrase_violations_for_text(text: str, posix_label: str) -> list[str]:
    """Coherence + forbidden attestation regexes for a single markdown body (no file IO)."""
    violations: list[str] = []

    coherence = coherence_procurement_claims(text)

    if coherence is not None:

        violations.append(f"{posix_label}: {coherence}")

    for pat, reason in _ASSURANCE_FORBIDDEN_PATTERNS:
        matched = pat.search(text)

        if matched is None:

            continue

        violations.append(f"{posix_label}: {reason}; matched `{matched.group(0)!s}`")

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


PROCUREMENT_DEFERRED_REALISM_NOTES: tuple[str, ...] = (
    "SOC 2 Type II CPA report: not currently issued — procurement realism deferral "
    "(see docs/go-to-market/SOC2_STATUS_PROCUREMENT.md).",
    "Third-party penetration test against V1: deferred — not a V1 product gate "
    "(see docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md).",
)


def classify_deal_ready_violation(violation: str) -> str:
    """Split deal-ready findings into blocking product/proc defects vs deferred realism."""
    if scope_class.classify_violation_scope(violation) == scope_class.SCOPE_DEFERRED_SCOPE:
        return "deferred_realism"

    return "blocking"


def split_deal_ready_violations(violations: list[str]) -> tuple[list[str], list[str]]:
    blocking: list[str] = []
    deferred: list[str] = []

    for violation in violations:
        if classify_deal_ready_violation(violation) == "deferred_realism":
            deferred.append(violation)
            continue

        blocking.append(violation)

    return blocking, deferred


def build_deal_ready_summary(
    *,
    ok: bool,
    violations: list[str],
    strict_mode: bool,
    deal_ready_mode: bool,
    root: Path | None = None,
) -> dict[str, object]:
    blocking, deferred_from_violations = split_deal_ready_violations(violations)
    deferred_notes = list(PROCUREMENT_DEFERRED_REALISM_NOTES) + deferred_from_violations
    # Deferred realism (stale Last reviewed, SOC2 deferral notes) does not block deal-ready PASS.
    effective_ok = len(blocking) == 0
    disposition = "PASS" if effective_ok else "HOLD"

    classification_rows: list[dict[str, object]] = []

    if deal_ready_mode and root is not None:
        classification_rows = scope_class.build_scope_classification_rows(root, violations)

    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "deal_ready_mode": deal_ready_mode,
        "strict_mode": strict_mode,
        "blocking_violation_count": len(blocking),
        "deferred_realism_note_count": len(deferred_notes),
        "blocking_violations": blocking,
        "deferred_realism_notes": deferred_notes,
        "all_violations": violations,
        "scope_classification_counts": scope_class.summarize_scope_classifications(classification_rows),
        "scope_classification_rows": classification_rows,
    }


def write_deal_ready_summary_json(path: Path, summary: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")


def format_deal_ready_disposition(
    *,
    ok: bool,
    violations: list[str],
    root: Path | None = None,
) -> str:
    """Buyer-safe disposition with blocking vs deferred procurement realism sections."""
    summary = build_deal_ready_summary(
        ok=ok,
        violations=violations,
        strict_mode=True,
        deal_ready_mode=True,
        root=root,
    )
    disposition = str(summary["disposition"])
    blocking = list(summary["blocking_violations"])
    deferred_notes = list(summary["deferred_realism_notes"])
    counts = dict(summary.get("scope_classification_counts") or {})
    classification_rows = list(summary.get("scope_classification_rows") or [])
    lines = [
        "# Procurement deal-ready executive summary",
        "",
        f"**Disposition:** **{disposition}**",
        "",
        "| Classification | Count |",
        "| --- | ---: |",
    ]

    for key in scope_class.SCOPE_CLASSIFICATIONS:
        lines.append(f"| {key} | {counts.get(key, 0)} |")

    lines.append("")
    lines.append(
        "Rows labeled **DEFERRED_SCOPE** or **INFORMATIONAL_B_ONLY** are not V1 product failures. "
        "Rows labeled **HOLD** block buyer send until resolved."
    )
    lines.append("")

    if classification_rows:
        lines.append("| Topic | Classification | Source |")
        lines.append("| --- | --- | --- |")

        for row in classification_rows[:24]:
            topic = str(row.get("topic") or row.get("pack_path") or "—")
            classification = str(row.get("classification") or "—")
            source = str(row.get("source_repo_path") or row.get("source") or "—")
            lines.append(f"| {topic} | {classification} | `{source}` |")

        if len(classification_rows) > 24:
            lines.append(f"| … | … | ({len(classification_rows) - 24} more rows in procurement-deal-ready-classification.md) |")

        lines.append("")

    lines.append(f"Deal-ready disposition: {disposition}")

    if counts:
        lines.append("Scope classification counts:")
        for key in scope_class.SCOPE_CLASSIFICATIONS:
            lines.append(f"  - {key}: {counts.get(key, 0)}")

    if blocking:
        lines.append("Blocking reasons:")
        lines.extend(f"  - {violation}" for violation in blocking)

    if deferred_notes:
        lines.append("Deferred procurement realism (not V1 product failure):")
        lines.extend(f"  - {note}" for note in deferred_notes)

    lines.append("See scope classification table in procurement-deal-ready-classification.md (when generated).")

    return "\n".join(lines)


def collect_quality_snapshot(
    root: Path,
    *,
    canonical_entries: list[dict],
    excluded: list[dict],
    pre_check_errors: list[str],
    strict_placeholder_violations: list[str] | None,
    deal_ready_violations: list[str] | None,
    strict_mode: bool,
    deal_ready_mode: bool,
    max_assurance_review_age_days: int,
) -> dict[str, object]:
    """Machine-readable quality summary for procurement-pack-quality.md and manifest.json."""
    freshness_warnings = assurance_freshness_violations(
        root,
        paths_relative=(
            Path("docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md"),
            Path("docs/go-to-market/TRUST_CENTER.md"),
        ),
        max_review_age_days=max_assurance_review_age_days,
    )

    placeholder_violations = list(strict_placeholder_violations or [])
    deal_violations = list(deal_ready_violations or [])
    blocking = list(pre_check_errors)

    if strict_mode and placeholder_violations:
        blocking.extend(placeholder_violations)

    if deal_ready_mode and deal_violations:
        deal_blocking, _deal_deferred = split_deal_ready_violations(deal_violations)
        blocking.extend(deal_blocking)

    overall = "pass" if not blocking else "fail"

    return {
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "overall": overall,
        "strict_mode": strict_mode,
        "deal_ready_mode": deal_ready_mode,
        "canonical_file_count": len(canonical_entries),
        "redaction_omission_count": len(excluded),
        "precondition_error_count": len(pre_check_errors),
        "freshness_warning_count": len(freshness_warnings),
        "strict_placeholder_violation_count": len(placeholder_violations),
        "deal_ready_violation_count": len(deal_violations),
        "precondition_errors": pre_check_errors,
        "freshness_warnings": freshness_warnings,
        "strict_placeholder_violations": placeholder_violations,
        "deal_ready_violations": deal_violations,
        "redaction_omissions": [
            {"path": row.get("path", ""), "reason": row.get("reason", "")} for row in excluded
        ],
    }


def procurement_pack_quality_markdown(snapshot: dict[str, object]) -> str:
    """Buyer-safe quality summary (no secrets)."""
    lines = [
        "# Procurement pack sendability summary",
        "",
        "> Human-readable sendability for buyer circulation. **SOC 2:** self-assessment and roadmap only — **not** CPA attestation. "
        "> **Third-party pen test:** deferred per V1 scope — not claimed as completed. "
        "> **Buyer-specific cover letters** require owner approval before leaving the repository boundary.",
        "",
        f"- **Overall:** `{snapshot.get('overall', 'unknown')}`",
        f"- **Strict mode:** `{snapshot.get('strict_mode', False)}`",
        f"- **Deal-ready mode:** `{snapshot.get('deal_ready_mode', False)}`",
        f"- **Canonical files:** {snapshot.get('canonical_file_count', 0)}",
        f"- **Redaction omissions:** {snapshot.get('redaction_omission_count', 0)}",
        "",
        "## Precondition checks",
        "",
    ]

    pre_errors = snapshot.get("precondition_errors") or []

    if pre_errors:
        lines.extend(f"- FAIL: {err}" for err in pre_errors)
    else:
        lines.append("- PASS: canonical sources, templates, and buyer-claim scans (when enabled).")

    lines.extend(["", "## Freshness (warn-only unless deal-ready)", ""])

    freshness = snapshot.get("freshness_warnings") or []

    if freshness:
        lines.extend(f"- WARN: {warn}" for warn in freshness)
    else:
        lines.append("- PASS: assurance **Last reviewed** markers within configured age.")

    lines.extend(["", "## Strict placeholder scan", ""])

    placeholders = snapshot.get("strict_placeholder_violations") or []

    if placeholders:
        lines.extend(f"- FAIL: {item}" for item in placeholders)
    elif snapshot.get("strict_mode"):
        lines.append("- PASS: no buyer-unsafe placeholders in Evidence/Self-assessment pack files.")
    else:
        lines.append("- SKIPPED: strict mode off (use `--strict` or `PROCUREMENT_PACK_STRICT=1` for release drops).")

    lines.extend(["", "## Deal-ready checks", ""])

    deal_items = snapshot.get("deal_ready_violations") or []

    if deal_items:
        lines.extend(f"- FAIL: {item}" for item in deal_items)
    elif snapshot.get("deal_ready_mode"):
        lines.append("- PASS: deal-ready repository checks.")
    else:
        lines.append("- SKIPPED: deal-ready mode off.")

    lines.extend(
        [
            "",
            "## Redaction omissions (intentional)",
            "",
            "See `redaction_report.md` for the full table. Omitted repository paths are **not** defects when listed there.",
            "",
        ]
    )

    omissions = snapshot.get("redaction_omissions") or []

    if omissions:
        lines.append(f"- {len(omissions)} paths documented in `redaction_report.md`.")

    lines.append("")

    return "\n".join(lines)


def write_procurement_pack_quality_report(stage: Path, snapshot: dict[str, object]) -> None:
    (stage / "procurement-pack-quality.md").write_text(
        procurement_pack_quality_markdown(snapshot),
        encoding="utf-8",
    )
