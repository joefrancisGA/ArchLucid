#!/usr/bin/env python3
"""
Assemble dist/procurement-pack/ + dist/procurement-pack.zip for buyer / procurement teams.

Canonical file list: scripts/procurement_pack_canonical.json (shared with CI:
scripts/ci/assert_procurement_pack_buildable.py → scripts/validate_procurement_pack.py).

Dry-run validation helpers: scripts/procurement_pack_validation.py (see also `validate_procurement_pack.py`).

Emits:
  - README.md — buyer-facing entry (artifact index pointers; assessment 76_76 §9)
  - manifest.json — each packed file: pack_path, source_repo_path, bytes, sha256, artifact_status
  - versions.txt — git commit, build UTC, ArchLucid CLI version (from ArchLucid.Cli.csproj)
  - redaction_report.md — files intentionally not included and why
  - artifact_status_index.json — machine-readable artifact_status per packed path
  - ARTIFACT_STATUS_INDEX.md — buyer-facing table of evidence vs template vs deferred rows
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parent

if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

import procurement_pack_validation as pp_val  # noqa: E402
import procurement_scope_classification as scope_class  # noqa: E402


TEXT_PACK_SUFFIXES = frozenset({".md", ".txt", ".json", ".yaml", ".yml", ".html", ".xml", ".csv"})

# Buyer-unsafe placeholder tokens (release / `--strict` builds only; skipped for Template/Deferred entries).
_PLACEHOLDER_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bTBD\b", re.IGNORECASE),
    re.compile(r"\bTODO\b", re.IGNORECASE),
    re.compile(r"placeholder-replace-before-launch", re.IGNORECASE),
)

_DEAL_READY_PATTERNS: tuple[re.Pattern[str], ...] = (
    *_PLACEHOLDER_PATTERNS,
    re.compile(r"\[Legal\s*[-—]\s*describe\]", re.IGNORECASE),
)

_DEFAULT_OWNER_BY_STATUS: dict[str, str] = {
    "Evidence": "Security / product owner",
    "Self-assessment": "Security / procurement owner",
    "Template": "Legal / procurement owner",
    "Deferred": "Executive owner",
    "NDA-gated": "Security / legal owner",
    "Owner-input-required": "Named deal owner",
}

_DEFAULT_CAVEAT_BY_STATUS: dict[str, str] = {
    "Evidence": "Evidence describes implemented or documented ArchLucid posture; verify freshness before buyer distribution.",
    "Self-assessment": "Self-attested control narrative; not a third-party attestation or certification.",
    "Template": "Template only until reviewed and executed for a specific customer or vendor.",
    "Deferred": "Deferred scope; do not present as complete for V1 readiness.",
    "NDA-gated": "Distribution depends on NDA, assessor, or customer-specific legal approval.",
    "Owner-input-required": "Requires owner-supplied deal details before external use.",
}


def entry_should_scan_for_placeholders(entry: dict) -> bool:
    status = entry.get("artifact_status", "Evidence")
    if status in ("Template", "Deferred"):
        return False

    path = Path(entry["pack_path"])
    suf = path.suffix.lower()

    return suf in TEXT_PACK_SUFFIXES


def scan_packed_files_for_markers(
    stage: Path,
    entries: list[dict],
    patterns: tuple[re.Pattern[str], ...],
    allowed_statuses: tuple[str, ...] | None = None,
) -> list[str]:
    violations: list[str] = []
    for e in entries:
        if not entry_should_scan_for_placeholders(e):
            continue
        if allowed_statuses is not None and e.get("artifact_status", "Evidence") not in allowed_statuses:
            continue

        pack_path = e["pack_path"]
        target = stage / pack_path
        text = target.read_text(encoding="utf-8", errors="replace")

        for pat in patterns:
            if pat.search(text) is not None:
                violations.append(f"{pack_path}: matched /{pat.pattern}/")
                break

    return violations


def write_artifact_status_index(stage: Path, entries: list[dict]) -> None:
    rows: list[dict] = []
    for e in entries:
        status = e.get("artifact_status", "Evidence")
        rows.append(
            {
                "pack_path": e["pack_path"],
                "source_repo_path": e.get("source_repo_path", ""),
                "artifact_status": status,
                "owner_function": e.get("owner_function", _DEFAULT_OWNER_BY_STATUS.get(status, "Security / procurement owner")),
                "last_reviewed_utc": e.get("last_reviewed_utc", "See source document"),
                "description": e.get("description", ""),
                "caveat": e.get("caveat", _DEFAULT_CAVEAT_BY_STATUS.get(status, "Review source caveats before buyer distribution.")),
            }
        )

    (stage / "artifact_status_index.json").write_text(
        json.dumps({"generated_utc": datetime.now(timezone.utc).isoformat(), "files": rows}, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# Artifact status index",
        "",
        "Each row reflects `artifact_status` from the canonical procurement list (`scripts/procurement_pack_canonical.json`). "
        "Labels distinguish externally shareable evidence, self-assessments, templates, deferred scope, and gated material so reviewers do not mistake templates or roadmaps for attestations.",
        "",
        "| Pack file | Source | Status | Owner / function | Last reviewed | Buyer-safe summary | Caveat |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        desc = str(r.get("description", "")).replace("|", "\\|")
        caveat = str(r.get("caveat", "")).replace("|", "\\|")
        owner = str(r.get("owner_function", "")).replace("|", "\\|")
        source = str(r.get("source_repo_path", "")).replace("|", "\\|")
        reviewed = str(r.get("last_reviewed_utc", "")).replace("|", "\\|")
        lines.append(
            f"| `{r['pack_path']}` | `{source}` | **{r['artifact_status']}** | {owner} | {reviewed} | {desc} | {caveat} |"
        )

    lines.append("")
    (stage / "ARTIFACT_STATUS_INDEX.md").write_text("\n".join(lines), encoding="utf-8")


def write_pack_readme(stage: Path) -> None:
    """Buyer-facing entrypoint inside the ZIP — points at artifact classification (assessment 76_76 §9 item 4)."""
    body = """# ArchLucid procurement pack

This bundle was produced by **`scripts/build_procurement_pack.py`** (or `archlucid procurement-pack`). **Start here**, then open the indexes below.

## What to open next

| File | Purpose |
| --- | --- |
| **`ARTIFACT_STATUS_INDEX.md`** | Reviewer table of **Evidence** vs **Template** vs **Self-assessment** vs **Deferred**, including source path, owner function, review pointer, summary, and caveat. |
| **`artifact_status_index.json`** | Same classification and caveats in JSON (automation / SIEM). |
| **`manifest.json`** | Per-file **SHA-256**, size, and **`artifact_status`**. |
| **`versions.txt`** | Git commit, build UTC, CLI package version. |
| **`redaction_report.md`** | Repository paths **intentionally omitted** from the canonical pack and why. |
| **`procurement-pack-quality.md`** | Pass/fail freshness, placeholder strictness, and redaction summary for the build. |

## Operator reference

- **How to regenerate:** in a full clone, see **`docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`**.
- **Strict release scan:** **`--strict`** or **`PROCUREMENT_PACK_STRICT=1`** on release drops (see **`docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`** § *Release / buyer drop — marker strictness*).

**Do not** treat **Template** or **Self-assessment** artifacts as executed legal agreements or third-party certifications.
"""
    (stage / "README.md").write_text(body, encoding="utf-8")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_canonical(root: Path) -> tuple[list[dict], list[dict]]:
    path = root / "scripts" / "procurement_pack_canonical.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["canonical_entries"], data["excluded_from_canonical_pack"]


def read_cli_version(root: Path) -> str:
    csproj = root / "ArchLucid.Cli" / "ArchLucid.Cli.csproj"
    text = csproj.read_text(encoding="utf-8")
    m = re.search(r"<Version>([^<]+)</Version>", text)
    if m:
        return m.group(1).strip()
    return "unknown"


def git_head(root: Path) -> str:
    try:
        r = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
        return r.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return os.environ.get("GITHUB_SHA", "unknown").strip() or "unknown"


def build_manifest_rows(stage: Path, entries: list[dict]) -> list[dict]:
    rows: list[dict] = []
    for e in entries:
        pack = e["pack_path"]
        p = stage / pack
        raw = p.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        rows.append(
            {
                "pack_path": pack,
                "source_repo_path": e["source_repo_path"],
                "bytes": len(raw),
                "sha256": digest,
                "artifact_status": e.get("artifact_status", "Evidence"),
            }
        )
    return rows


def write_versions_txt(stage: Path, root: Path) -> None:
    sha = git_head(root)
    ver = read_cli_version(root)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        f"git_commit_sha={sha}",
        f"built_utc={now}",
        f"archlucid_cli_version={ver}",
        "",
        "Built by scripts/build_procurement_pack.py — see docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md.",
    ]
    (stage / "versions.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_redaction_report(stage: Path, excluded: list[dict]) -> None:
    lines = [
        "# Redaction / omission report",
        "",
        "The canonical procurement ZIP (see `scripts/procurement_pack_canonical.json`) **includes only** the reviewer checklist. "
        "The following repository paths are **not** copied into this pack and are listed here so owners can audit gaps.",
        "",
        "| Repository path | Reason |",
        "|-----------------|--------|",
    ]
    for row in excluded:
        path = row.get("path", "")
        reason = row.get("reason", "").replace("|", "\\|")
        lines.append(f"| `{path}` | {reason} |")

    lines.append("")
    lines.append("**Do not** add unredacted customer names or deal-specific cover letter text without owner sign-off.")
    (stage / "redaction_report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build ArchLucid procurement pack ZIP.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run procurement_pack_validation guards (canonical + templates + wording); emit no staged ZIP.",
    )
    parser.add_argument(
        "--dry-run-preview-dir",
        type=Path,
        default=None,
        help="Optional; with --dry-run only: after passing checks emit manifest.json + redaction_report.md here.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output ZIP path (default: dist/procurement-pack.zip under repo root).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="After staging, fail if Evidence/Self-assessment text files contain buyer-unsafe placeholders (TBD/TODO/...).",
    )
    parser.add_argument(
        "--deal-ready",
        action="store_true",
        help="Run stricter release/procurement checks (implies --strict) for buyer-facing packs.",
    )
    parser.add_argument(
        "--max-review-age-days",
        type=int,
        default=120,
        help="Maximum Last reviewed age for required deal-ready docs (default: 120).",
    )
    parser.add_argument(
        "--json-summary-out",
        type=Path,
        default=None,
        help="Optional machine-readable deal-ready summary JSON (used by first-pilot proof).",
    )
    parser.add_argument(
        "--classification-md-out",
        type=Path,
        default=None,
        help="Optional Markdown scope-classification table (defaults beside --json-summary-out).",
    )
    args = parser.parse_args()

    strict_env = os.environ.get("PROCUREMENT_PACK_STRICT", "").strip().lower() in ("1", "true", "yes")
    deal_ready_env = os.environ.get("PROCUREMENT_PACK_DEAL_READY", "").strip().lower() in ("1", "true", "yes")
    deal_ready = args.deal_ready or deal_ready_env
    strict = args.strict or strict_env or deal_ready

    root = repo_root()

    entries, excluded = load_canonical(root)

    preview_dir = args.dry_run_preview_dir if args.dry_run else None

    pre_checks = pp_val.procurement_pack_quick_checks(
        root,
        max_assurance_review_age_days=366,
        deal_ready_max_review_age_days=args.max_review_age_days,
        preview_dir=preview_dir,
        run_buyer_claim_scans=True,
        deal_ready_bundle=deal_ready,
    )

    def _classification_md_path() -> Path | None:
        if args.classification_md_out is not None:
            return args.classification_md_out.expanduser().resolve()

        if args.json_summary_out is not None:
            json_path = args.json_summary_out.expanduser().resolve()
            return json_path.with_name("procurement-deal-ready-classification.md")

        return None

    def _maybe_write_deal_ready_json(*, ok: bool, violations: list[str]) -> dict[str, object]:
        summary = pp_val.build_deal_ready_summary(
            ok=ok,
            violations=violations,
            strict_mode=strict,
            deal_ready_mode=deal_ready,
            root=root,
        )

        if args.json_summary_out is not None:
            pp_val.write_deal_ready_summary_json(args.json_summary_out.expanduser().resolve(), summary)

        classification_path = _classification_md_path()

        if deal_ready and classification_path is not None:
            rows = list(summary.get("scope_classification_rows") or [])
            scope_class.write_scope_classification_markdown(classification_path, rows)

        return summary

    if pre_checks:

        scope = "procurement pack dry-run" if args.dry_run else "procurement pack precondition"

        summary = _maybe_write_deal_ready_json(ok=False, violations=pre_checks)
        blocking = list(summary["blocking_violations"])

        if deal_ready:
            print(pp_val.format_deal_ready_disposition(ok=len(blocking) == 0, violations=pre_checks, root=root))

        if not blocking and deal_ready and args.dry_run:
            print("procurement pack dry-run: OK (deferred procurement realism notes only).")
            return 0

        print(f"error: {scope} failed:", file=sys.stderr)

        for err in (blocking if blocking else pre_checks):
            print(f"  - {err}", file=sys.stderr)

        return 1

    if args.dry_run:

        suffix = ""

        if args.dry_run_preview_dir is not None:

            suffix = f" Preview manifest/redaction wrote to `{args.dry_run_preview_dir}`."

        if deal_ready:
            print(pp_val.format_deal_ready_disposition(ok=True, violations=[], root=root))
            _maybe_write_deal_ready_json(ok=True, violations=[])

        print(f"procurement pack dry-run: OK.{suffix}")

        return 0

    stage = root / "dist" / "procurement-pack"

    if stage.exists():
        shutil.rmtree(stage)

    stage.mkdir(parents=True)

    for e in entries:
        src = root / e["source_repo_path"]
        dst = stage / e["pack_path"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(src.read_bytes())

    strict_violations: list[str] = []

    if strict:
        strict_violations = scan_packed_files_for_markers(
            stage,
            entries,
            _PLACEHOLDER_PATTERNS,
            allowed_statuses=("Evidence", "Self-assessment"),
        )

        if strict_violations:
            print("error: procurement pack strict mode found placeholders in buyer-facing files:", file=sys.stderr)
            for v in strict_violations:
                print(f"  - {v}", file=sys.stderr)
            return 1

    deal_violations: list[str] = []

    if deal_ready:
        deal_violations = scan_packed_files_for_markers(
            stage,
            entries,
            _DEAL_READY_PATTERNS,
            allowed_statuses=("Evidence", "Self-assessment"),
        )

        if deal_violations:
            print("error: procurement pack deal-ready checks failed:", file=sys.stderr)

            for v in deal_violations:
                print(f"  - {v}", file=sys.stderr)

            print(pp_val.format_deal_ready_disposition(ok=False, violations=deal_violations, root=root))
            _maybe_write_deal_ready_json(ok=False, violations=deal_violations)

            return 1

    quality_snapshot = pp_val.collect_quality_snapshot(
        root,
        canonical_entries=entries,
        excluded=excluded,
        pre_check_errors=[],
        strict_placeholder_violations=strict_violations,
        deal_ready_violations=deal_violations,
        strict_mode=strict,
        deal_ready_mode=deal_ready,
        max_assurance_review_age_days=args.max_review_age_days,
    )
    pp_val.write_procurement_pack_quality_report(stage, quality_snapshot)

    manifest_rows = build_manifest_rows(stage, entries)
    (stage / "manifest.json").write_text(
        json.dumps(
            {
                "generated_utc": datetime.now(timezone.utc).isoformat(),
                "files": manifest_rows,
                "quality": quality_snapshot,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    write_versions_txt(stage, root)
    write_redaction_report(stage, excluded)
    write_artifact_status_index(stage, entries)
    write_pack_readme(stage)

    out_zip = args.out if args.out is not None else root / "dist" / "procurement-pack.zip"
    out_zip.parent.mkdir(parents=True, exist_ok=True)
    if out_zip.exists():
        out_zip.unlink()

    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(stage.rglob("*")):
            if path.is_file():
                arc = path.relative_to(stage).as_posix()
                zf.write(path, arcname=arc)

    print(f"Wrote {out_zip}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
