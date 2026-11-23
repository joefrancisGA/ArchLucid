#!/usr/bin/env python3
"""Reconcile historical Aspects discovery identities against fixing-PR state.

Historical workbook review IDs are *candidate* distinct discovery identifiers,
not automatically the 463 distinct-defect 900-commit numerator. A PR merge
changes fix state, never discovery count or reviewed LOC. Only independently
queried GitHub PR states in a timestamped snapshot may override workbook-era
'open' labels. Unknown PR statuses stay unknown.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re

from aspects_review_evidence import read_records
from aspects_validate_historical_corpus import verify
from aspects_validate_historical_pins import VERIFIED, audited_rows_sha256

PR_LINK = re.compile(
    r"^https://github\.com/joefrancisGA/ArchLucid/pull/([1-9][0-9]*)(?:/)?$"
)
PR_STATUS = re.compile(r"\bPR\s*#([1-9][0-9]*)\b", re.IGNORECASE)
PR_ONLY_REVIEW_ID = re.compile(r"^#([1-9][0-9]*)$")
PR_REFERENCE = re.compile(
    r"https://github\.com/joefrancisGA/ArchLucid/pull/([1-9][0-9]*)(?=$|[/?#\s),;])"
)
SHA = re.compile(r"^[0-9a-f]{40}$")
WORKBOOK_PR_ID = re.compile(r"^#[1-9][0-9]*$")
ASPECTS_NAMESPACE = "workbook_aspects_id"
PR_NAMESPACE = "workbook_pr_number"
LABEL_NAMESPACE = "workbook_label"


def candidate_identity(raw: object) -> tuple[str, str] | None:
    """Type original Defect ID strings without inventing cross-format aliases.

    The original workbook has both '#6619' and 'ASPECTS-...' IDs. Neither a
    shared numeric suffix nor a fixing PR is proof that two IDs name the same
    discovery. Preserve spelling/case/whitespace, with no trimming or case
    conversion. Other nonempty labels remain opaque workbook candidates.
    """
    if not isinstance(raw, str):
        return None
    if WORKBOOK_PR_ID.fullmatch(raw):
        return PR_NAMESPACE, raw
    if raw.startswith("ASPECTS-") and len(raw) > len("ASPECTS-") and not any(
            char.isspace() for char in raw):
        return ASPECTS_NAMESPACE, raw
    return (LABEL_NAMESPACE, raw) if raw.strip() else None


def summarize_candidates(candidates: dict[tuple[str, str], list[int]],
                         fix_prs: dict[tuple[str, str], dict[int, list[int]]],
                         assertions: list[dict]) -> dict:
    """Counts are candidate identifiers in one named scope, not defect totals."""
    repeated = [(key, locations) for key, locations in sorted(candidates.items())
                if len(locations) > 1]
    conflicting = [(key, refs) for key, refs in sorted(fix_prs.items()) if len(refs) > 1]
    resolved = {}
    for item in assertions:
        key = (item["candidate_identity"]["namespace"], item["candidate_identity"]["value"])
        resolved.setdefault(key, set()).update((item["canonical_fix_pr"], item["duplicate_fix_pr"]))
    resolved_keys = {key for key, refs in conflicting if set(refs) <= resolved.get(key, set())}
    return {
        "unique_candidate_ids": len(candidates),
        "unique_candidates_by_namespace": dict(sorted(Counter(
            namespace for namespace, _ in candidates).items())),
        "repeated_candidate_ids": len(repeated),
        "repeated_candidates_sample": [
            {"namespace": key[0], "value": key[1], "excel_rows": locations}
            for key, locations in repeated[:25]],
        "candidate_ids_with_conflicting_fix_prs": len(conflicting),
        "candidate_ids_with_source_resolved_fix_pr_conflicts": len(resolved_keys),
        "candidate_ids_with_unresolved_fix_pr_conflicts": len(conflicting) - len(resolved_keys),
        "conflicting_fix_prs_sample": [
            {"namespace": key[0], "value": key[1],
             "excel_rows_by_fix_pr": {str(number): refs[number] for number in sorted(refs)},
             "status": ("source_asserted_duplicate_fix_prs" if key in resolved_keys else
                        "multiple_fix_prs_requires_discovery_identity_review")}
            for key, refs in conflicting[:25]],
        "confidence": "original_workbook_candidate_identity_only_not_verified_distinct_defects",
    }


def validate_assertion_source(item: dict, label: str) -> None:
    """Bind a curated assertion to the retrieved body, excerpt and UTC time."""
    body, excerpt, digest = item.get("source_body"), item.get("source_excerpt"), item.get("source_sha256")
    if (not isinstance(body, str) or not isinstance(excerpt, str) or not excerpt.strip()
            or excerpt not in body or not isinstance(digest, str)
            or hashlib.sha256(body.encode("utf-8")).hexdigest() != digest):
        raise ValueError(f"{label} source body/excerpt SHA-256 mismatch")
    try:
        checked = datetime.fromisoformat(item["checked_at_utc"].replace("Z", "+00:00"))
        if checked.tzinfo is None or checked.utcoffset() != timezone.utc.utcoffset(checked):
            raise ValueError("missing UTC offset")
    except (KeyError, AttributeError, TypeError, ValueError) as exc:
        raise ValueError(f"{label} needs a UTC evidence timestamp") from exc


def validate_missing_fix_pr_assertions(checkpoint: dict, rows: list[dict],
                                     status_by_pr: dict[int, dict]) -> dict[int, dict]:
    """Resolve an absent original PR link through explicit additional evidence.

    Original workbook fields are never rewritten. The exact original row, label
    and reviewed SHA bind the assertion; clean rows and existing/conflicting PR
    references cannot be overridden. This adds a fix reference, not source LOC,
    a discovery alias, a newly discovered defect, or a verified denominator.
    """
    raw = checkpoint.get("missing_fix_pr_assertions", [])
    if not isinstance(raw, list):
        raise ValueError("Missing-fix PR assertions must be a list")
    originals = {row["excel_row"]: row for row in rows}
    result = {}
    for item in raw:
        if not isinstance(item, dict) or type(item.get("excel_row")) is not int:
            raise ValueError("Malformed missing-fix PR assertion")
        excel, number, source = item["excel_row"], item.get("fix_pr_number"), item.get("source_pr")
        row = originals.get(excel)
        if (row is None or type(row.get("defects_recorded")) is not int
                or row["defects_recorded"] <= 0
                or candidate_identity(row.get("review_id")) is None
                or item.get("review_id") != row.get("review_id")
                or not isinstance(item.get("reviewed_master_sha"), str)
                or not SHA.fullmatch(item["reviewed_master_sha"])
                or item["reviewed_master_sha"] != row.get("reviewed_master_sha")
                or type(number) is not int or type(source) is not int or source != number
                or number not in status_by_pr
                or item.get("source_url") !=
                f"https://github.com/joefrancisGA/ArchLucid/pull/{number}"):
            raise ValueError("Missing-fix assertion does not match original positive row and GitHub PR evidence")
        original_number, evidence = referenced_fix_pr(row)
        original_ref, original_status = row.get("source_reference"), row.get("historical_status")
        if (original_number is not None or evidence != "no_explicit_fix_pr_reference"
                or (isinstance(original_ref, str) and PR_REFERENCE.search(original_ref))
                or (isinstance(original_status, str) and PR_STATUS.search(original_status))):
            raise ValueError("Missing-fix assertion cannot override original explicit or conflicting PR references")
        if excel in result:
            raise ValueError("Duplicate missing-fix PR assertion for original Excel row")
        validate_assertion_source(item, "Missing-fix assertion")
        result[excel] = {
            "excel_row": excel, "review_id": item["review_id"],
            "reviewed_master_sha": item["reviewed_master_sha"],
            "fix_pr_number": number, "source_pr": source, "source_url": item["source_url"],
            "source_excerpt": item["source_excerpt"], "source_sha256": item["source_sha256"],
            "checked_at_utc": item["checked_at_utc"],
            "confidence": "source_backed_missing_fix_reference_not_discovery_or_source_span_verification",
        }
    return result


def validate_discovery_assertions(checkpoint: dict, status_by_pr: dict[int, dict],
                                  fix_prs: dict[tuple[str, str], dict[int, list[int]]]) -> list[dict]:
    """Accept only explicit, body-backed duplicate relations within original IDs.

    This checks the supplied source assertion's identity/provenance, not a
    general natural-language equivalence rule. A shared PR number, title, or
    identifier suffix alone never creates a discovery alias. An assertion
    resolves only the referenced pair; it does not verify the overall numerator.
    """
    raw = checkpoint.get("discovery_identity_assertions", [])
    if not isinstance(raw, list):
        raise ValueError("Discovery identity assertions must be a list")
    result, seen, canonicals = [], set(), {}
    for item in raw:
        if not isinstance(item, dict) or not isinstance(item.get("candidate_identity"), dict):
            raise ValueError("Malformed discovery identity assertion")
        candidate = item["candidate_identity"]
        value, namespace = candidate.get("value"), candidate.get("namespace")
        identity = candidate_identity(value)
        canonical = item.get("canonical_fix_pr")
        duplicate = item.get("duplicate_fix_pr")
        source = item.get("source_pr")
        if (identity is None or identity != (namespace, value)
                or identity not in fix_prs
                or type(canonical) is not int or type(duplicate) is not int
                or type(source) is not int or canonical == duplicate or source != duplicate
                or canonical not in status_by_pr or duplicate not in status_by_pr
                or canonical not in fix_prs[identity] or duplicate not in fix_prs[identity]
                or status_by_pr[duplicate]["state"] != "closed"
                or status_by_pr[duplicate]["merged"]
                or item.get("source_url") !=
                f"https://github.com/joefrancisGA/ArchLucid/pull/{source}"):
            raise ValueError("Discovery assertion does not match original candidate and fixing PR evidence")
        validate_assertion_source(item, "Discovery assertion")
        pair = (identity, canonical, duplicate)
        if pair in seen or (identity in canonicals and canonicals[identity] != canonical):
            raise ValueError("Duplicate or conflicting discovery identity assertions")
        seen.add(pair)
        canonicals[identity] = canonical
        result.append({
            "candidate_identity": {"namespace": namespace, "value": value},
            "canonical_fix_pr": canonical, "duplicate_fix_pr": duplicate,
            "source_pr": source, "source_url": item["source_url"],
            "source_excerpt": item["source_excerpt"], "source_sha256": item["source_sha256"],
            "checked_at_utc": item["checked_at_utc"],
            "confidence": "explicit_source_backed_duplicate_relation_not_full_defect_numerator",
        })
    return sorted(result, key=lambda item: (
        item["candidate_identity"]["namespace"], item["candidate_identity"]["value"],
        item["canonical_fix_pr"], item["duplicate_fix_pr"]))


def referenced_fix_pr(row: dict) -> tuple[int | None, str]:
    """Do not infer a PR from unrelated links or a textual number alone."""
    ref = row.get("source_reference")
    link = PR_LINK.fullmatch(ref.strip()) if isinstance(ref, str) else None
    status = row.get("historical_status")
    hints = {int(value) for value in PR_STATUS.findall(status)} if isinstance(status, str) else set()
    linked = int(link.group(1)) if link else None
    references = hints | ({int(value) for value in PR_REFERENCE.findall(ref)}
                          if isinstance(ref, str) else set())
    if len(references) > 1:
        return None, "conflicting_original_fix_pr_references"
    if linked is not None:
        return linked, "original_source_link"
    if hints:
        return next(iter(hints)), "historical_status_text_only"
    return None, "no_explicit_fix_pr_reference"


def fix_pr_reference_candidate(row: dict, fix_pr: int | None,
                               evidence_type: str) -> tuple[str | None, str]:
    """Preserve legacy '#123' row identities without inventing defect IDs.

    A PR reference can be a useful candidate JOIN key for a workbook review,
    but multiple defects may share a fix PR, and it cannot establish a unique
    discovery on its own. Require the original canonical URL and number to
    agree; a status-text hint alone is never sufficient. This corroborated
    review join key is separate from the exact original candidate namespace.
    """
    raw = row.get("review_id")
    match = PR_ONLY_REVIEW_ID.fullmatch(raw.strip()) if isinstance(raw, str) else None
    if match is None:
        return None, "not_a_pr_number_review_id"
    number = int(match.group(1))
    if fix_pr != number or evidence_type != "original_source_link":
        return None, "review_id_pr_number_not_confirmed_by_matching_source_link"
    return f"workbook_fix_pr:{number}", "matching_workbook_review_id_and_source_pr_url"


def load_fix_state(checkpoint: dict) -> dict[int, dict]:
    """Validate a narrow, timestamped GitHub metadata snapshot."""
    if (checkpoint.get("repository") != "joefrancisGA/ArchLucid"
            or not isinstance(checkpoint.get("checked_at_utc"), str)
            or not isinstance(checkpoint.get("pr_states"), list)):
        raise ValueError("Missing complete GitHub fixing-PR checkpoint provenance")
    found = {}
    for item in checkpoint["pr_states"]:
        num, state, merged = item.get("number"), item.get("state"), item.get("merged")
        if (type(num) is not int or num < 1 or num in found
                or state not in ("open", "closed") or type(merged) is not bool
                or (state == "open" and merged)
                or (merged and not item.get("merged_at"))
                or item.get("fix_pr_url") !=
                f"https://github.com/joefrancisGA/ArchLucid/pull/{num}"
                or not isinstance(item.get("status_verified_at_utc"), str)):
            raise ValueError("Malformed, conflicting or duplicate GitHub PR metadata")
        found[num] = item
    return found


def reconcile(rows: list[dict], audit: list[dict], audit_report: dict,
              recent: list[dict], checkpoint: dict,
              expected_count: int = 5741, expected_first_excel_row: int = 7) -> tuple[dict, list[dict]]:
    if (len(rows) != expected_count or
            sorted(r.get("excel_row") for r in rows) !=
            list(range(expected_first_excel_row, expected_first_excel_row + expected_count))):
        raise ValueError("Incomplete or duplicate historical workbook event IDs")
    if (len(audit) != expected_count or
            audited_rows_sha256(audit) != audit_report.get("audited_rows_sha256")
            or sorted(r.get("excel_row") for r in audit) !=
            list(range(expected_first_excel_row, expected_first_excel_row + expected_count))):
        raise ValueError("Historical pin audit mismatch, missing rows or SHA-256 drift")
    anchor = audit_report.get("first_parent_checkpoint", {})
    if (not isinstance(anchor, dict)
            or anchor.get("status") != "verified_first_parent_sha_membership"
            or not isinstance(anchor.get("head_sha"), str)
            or not SHA.fullmatch(anchor["head_sha"])
            or not isinstance(anchor.get("oldest_sha"), str)
            or not SHA.fullmatch(anchor["oldest_sha"])
            or type(anchor.get("first_parent_commits")) is not int
            or anchor["first_parent_commits"] != 900):
        raise ValueError("Historical first-parent 900-commit anchor not verified")
    status_by_pr = load_fix_state(checkpoint)
    missing_fix_assertions = validate_missing_fix_pr_assertions(checkpoint, rows, status_by_pr)
    by_row = {r["excel_row"]: r for r in audit}
    recent_ids = {r["defect_id"] for r in recent
                  if isinstance(r.get("defect_id"), str) and r.get("defect_id")}
    positive = []
    candidate_ids = defaultdict(list)
    pr_reference_candidates = defaultdict(list)
    all_candidates = defaultdict(list)
    window_candidates = defaultdict(list)
    all_candidate_fix_prs = defaultdict(lambda: defaultdict(list))
    window_candidate_fix_prs = defaultdict(lambda: defaultdict(list))
    source_identities = []
    totals = Counter()
    unresolved = Counter()
    window_fix_pr_references: dict[int, list[int]] = defaultdict(list)
    window_no_fix_pr_reference: list[int] = []

    for row in sorted(rows, key=lambda item: item["excel_row"]):
        excel = row["excel_row"]
        pin = by_row[excel]
        if row.get("reviewed_master_sha") != pin.get("reviewed_master_sha"):
            raise ValueError(f"Historical source SHA disagrees at Excel row {excel}")
        if row.get("review_id") != pin.get("review_id"):
            raise ValueError(f"Historical original review ID disagrees at Excel row {excel}")
        if pin.get("window_membership") not in ("in_window", "not_on_first_parent_window"):
            raise ValueError(f"Historical window membership unverified at Excel row {excel}")
        source_identities.append({
            "excel_row": excel, "review_id": row.get("review_id"),
            "reviewed_master_sha": row.get("reviewed_master_sha"),
            "defects_recorded": row.get("defects_recorded"),
        })
        if row.get("defects_recorded", 0) == 0:
            totals["clean_rows_identity_bound"] += 1
            continue
        identity = candidate_identity(row.get("review_id"))
        # Retain the original named-ID fields as ASPECTS-only for compatibility.
        identifier = identity[1] if identity and identity[0] == ASPECTS_NAMESPACE else None
        number, evidence_type = referenced_fix_pr(row)
        pr_candidate_key, pr_candidate_confidence = fix_pr_reference_candidate(
            row, number, evidence_type)
        missing_fix = missing_fix_assertions.get(excel)
        resolved_number = missing_fix["fix_pr_number"] if missing_fix else number
        recorded_status = row.get("historical_status")
        resolved = status_by_pr.get(resolved_number) if resolved_number is not None else None
        if resolved is not None:
            fix_state = ("merged" if resolved["merged"] else
                         "open" if resolved["state"] == "open" else "closed_unmerged")
            totals["fix_pr_state_from_github"] += 1
            totals["fix_pr_state_from_source_backed_reference" if missing_fix else
                   "fix_pr_state_from_original_reference"] += 1
            if isinstance(recorded_status, str) and "open" in recorded_status.lower() and fix_state == "merged":
                totals["historical_open_labels_now_verified_merged"] += 1
        else:
            fix_state = "not_independently_checked"
            unresolved[evidence_type if number is None else "fix_pr_not_in_status_snapshot"] += 1
        record = {
            "excel_row": excel, "review_id": row.get("review_id"),
            "named_discovery_id_candidate": identifier,
            "fix_pr_reference_review_key_candidate": pr_candidate_key,
            "fix_pr_reference_review_key_confidence": pr_candidate_confidence,
            "fix_pr_key_is_distinct_defect_proof": False,
            "discovery_id_candidate": ({"namespace": identity[0], "value": identity[1]}
                                       if identity else None),
            "defect_observations_workbook_reported": row["defects_recorded"],
            "source_path": (row.get("parsed_pin") or {}).get("path"),
            "reviewed_master_sha": row["reviewed_master_sha"],
            "window_membership": pin.get("window_membership"),
            "git_pin_status": pin.get("pin_status"),
            "in_narrow_recent_ledger_exact_defect_id": identifier in recent_ids if identifier else False,
            "fix_pr_number": number,
            "original_source_reference": row.get("source_reference"),
            "resolved_fix_pr_number": resolved_number,
            "fix_pr_reference_confidence": evidence_type,
            "fix_pr_resolution_provenance": (
                "source_backed_missing_fix_pr_assertion" if missing_fix else
                "original_reference" if number is not None else "unresolved"),
            "source_backed_missing_fix_pr": missing_fix,
            "fix_state": fix_state,
            "fix_state_checked_at_utc": resolved.get("status_verified_at_utc") if resolved else None,
            "fix_pr_merged_at": resolved.get("merged_at") if resolved else None,
            "historical_fix_label": recorded_status,
            "provenance": "workbook_discovery_candidate_plus_separate_GitHub_fix_state",
        }
        positive.append(record)
        totals["positive_workbook_rows"] += 1
        totals["positive_observation_sum_not_distinct"] += row["defects_recorded"]
        if pin.get("window_membership") == "in_window":
            totals["positive_rows_on_900_first_parent"] += 1
            if number is None:
                window_no_fix_pr_reference.append(excel)
            else:
                # Preserve the original-reference partition. A source-backed
                # missing-link assertion has a separate resolved PR field.
                window_fix_pr_references[number].append(excel)
            if pin.get("pin_status") == VERIFIED:
                totals["positive_rows_original_git_pin_verified"] += 1
        if identifier is not None:
            candidate_ids[identifier].append(excel)
            if identifier in recent_ids:
                totals["exact_candidate_id_also_in_narrow_ledger_rows"] += 1
        if identity is not None:
            all_candidates[identity].append(excel)
            if number is not None:
                all_candidate_fix_prs[identity][number].append(excel)
            if pin["window_membership"] == "in_window":
                window_candidates[identity].append(excel)
                if number is not None:
                    window_candidate_fix_prs[identity][number].append(excel)
            if identity[0] == LABEL_NAMESPACE:
                unresolved["opaque_workbook_discovery_label"] += 1
        else:
            unresolved["missing_or_noncanonical_discovery_id"] += 1
        if pr_candidate_key is not None:
            pr_reference_candidates[pr_candidate_key].append(excel)
            totals["rows_with_matching_workbook_pr_review_key"] += 1
            if pin.get("window_membership") == "in_window":
                totals["in_window_rows_with_matching_workbook_pr_review_key"] += 1
        elif pr_candidate_confidence == "review_id_pr_number_not_confirmed_by_matching_source_link":
            totals["review_id_pr_link_conflicts_or_missing_original_url"] += 1

    repeat_identifiers = {key: locations for key, locations in candidate_ids.items()
                          if len(locations) > 1}
    repeated_pr_references = {str(number): locations
                              for number, locations in window_fix_pr_references.items()
                              if len(locations) > 1}
    # Coverage is auditability, not defect identity. Keep positive observations
    # without an original PR reference rather than forcing the 463 numerator.
    if (sum(map(len, window_fix_pr_references.values())) +
            len(window_no_fix_pr_reference) != totals["positive_rows_on_900_first_parent"]):
        raise RuntimeError("First-parent positive review / fixing-PR partition mismatch")
    repeated_pr_keys = {key: locations for key, locations in
                        pr_reference_candidates.items() if len(locations) > 1}
    assertions = validate_discovery_assertions(checkpoint, status_by_pr, all_candidate_fix_prs)
    for record in positive:
        record["source_backed_duplicate_relations"] = [
            {"canonical_fix_pr": item["canonical_fix_pr"],
             "duplicate_fix_pr": item["duplicate_fix_pr"],
             "source_url": item["source_url"], "source_sha256": item["source_sha256"]}
            for item in assertions
            if record["discovery_id_candidate"] == item["candidate_identity"]
            and record["fix_pr_number"] in (item["canonical_fix_pr"], item["duplicate_fix_pr"])]
    summary = {
        "schema_version": 2,
        "status": "historical_candidate_defect_ids_and_sampled_fix_states_reconciled",
        "source_population": "all_5741_historical_review_events_unchanged",
        "positive_rows": totals["positive_workbook_rows"],
        "positive_workbook_observation_sum_not_distinct": totals["positive_observation_sum_not_distinct"],
        "clean_rows_identity_bound": totals["clean_rows_identity_bound"],
        "candidate_discovery_id_scopes": {
            "all_history": summarize_candidates(all_candidates, all_candidate_fix_prs, assertions),
            "anchored_900_first_parent": summarize_candidates(window_candidates, window_candidate_fix_prs, assertions),
        },
        "source_backed_duplicate_fix_pr_relations": len(assertions),
        "discovery_identity_assertions": assertions,
        "source_backed_missing_fix_pr_references": len(missing_fix_assertions),
        "missing_fix_pr_assertions": [missing_fix_assertions[key] for key in sorted(missing_fix_assertions)],
        "legacy_named_candidate_fields_scope": "ASPECTS exact strings only; all historical rows",
        "unique_named_discovery_id_candidates": len(candidate_ids),
        "repeated_named_discovery_id_candidates": len(repeat_identifiers),
        "repeated_named_ids_sample": dict(list(sorted(repeat_identifiers.items()))[:25]),
        "positive_rows_with_matching_pr_reference_review_key": totals["rows_with_matching_workbook_pr_review_key"],
        "unique_pr_reference_review_key_candidates": len(pr_reference_candidates),
        "repeated_pr_reference_review_key_candidates": len(repeated_pr_keys),
        "repeated_pr_reference_keys_sample": dict(list(sorted(repeated_pr_keys.items()))[:25]),
        "pr_number_id_link_disagreement_or_missing_source_url_rows": totals["review_id_pr_link_conflicts_or_missing_original_url"],
        "positive_rows_in_900_with_matching_pr_reference_review_key":
            totals["in_window_rows_with_matching_workbook_pr_review_key"],
        "pr_reference_keys_proven_distinct_defects": None,
        "positive_rows_in_anchored_900_first_parent": totals["positive_rows_on_900_first_parent"],
        "unique_fix_pr_reference_candidates_in_anchored_window": len(window_fix_pr_references),
        "positive_rows_without_fix_pr_reference_in_anchored_window": len(window_no_fix_pr_reference),
        "positive_unlinked_excel_rows_sample_in_anchored_window": window_no_fix_pr_reference[:30],
        "repeated_fix_pr_numbers_in_anchored_window": len(repeated_pr_references),
        "repeated_fix_pr_reference_rows_sample": dict(list(sorted(repeated_pr_references.items()))[:30]),
        "fix_pr_reference_counts_scope": "original workbook references; source-backed resolutions do not rewrite this partition",
        "fix_pr_is_not_defect_identity": True,
        "original_git_pin_verified_positive_rows_in_900_window": totals["positive_rows_original_git_pin_verified"],
        "exact_candidate_id_also_in_narrow_ledger_rows": totals["exact_candidate_id_also_in_narrow_ledger_rows"],
        "github_fix_pr_state_verified_rows": totals["fix_pr_state_from_github"],
        "github_fix_pr_state_verified_original_reference_rows": totals["fix_pr_state_from_original_reference"],
        "github_fix_pr_state_verified_source_backed_reference_rows": totals["fix_pr_state_from_source_backed_reference"],
        "historical_open_labels_now_verified_merged": totals["historical_open_labels_now_verified_merged"],
        "github_fix_pr_checkpoint_checked_at_utc": checkpoint["checked_at_utc"],
        "github_fix_pr_checkpoint_entries": len(status_by_pr),
        "unresolved_discovery_or_fix_evidence": dict(sorted(unresolved.items())),
        "audited_rows_sha256": audit_report["audited_rows_sha256"],
        "original_identity_rows_sha256": audited_rows_sha256(source_identities),
        "original_identity_digest_method": "sha256_canonical_sorted_keys_jsonl_v1_in_excel_row_order",
        "original_identity_digest_fields": [
            "excel_row", "review_id", "reviewed_master_sha", "defects_recorded"],
        "discovery_fix_rows_sha256": audited_rows_sha256(positive),
        "head_900_first_parent": anchor.get("head_sha"),
        "oldest_900_first_parent": anchor.get("oldest_sha"),
        "historical_463_distinct_defects_recomputed": None,
        "fresh_comparable_900_density": None,
        "current_vs_previous_delta": None,
        "interpretation": (
            "Review ID is only a candidate distinct discovery identity, not a "
            "verified 463-count reconstruction. Original #number and ASPECTS "
            "IDs occupy separate namespaces; no aliases are inferred from a "
            "shared numeric suffix or fixing PR. Other workbook labels remain "
            "opaque candidates. One ID referring to multiple fixes remains "
            "ambiguous unless an explicit source-backed assertion covers the "
            "referenced pair; original IDs and fix references are never rewritten. "
            "An absent original PR link may have a separately labeled source-backed "
            "resolution bound to its original Excel row, label and reviewed SHA. "
            "Legacy #PR IDs also retain exact-link corroborated review join keys, "
            "which are not distinct defect IDs: one PR may address multiple discoveries. "
            "All-history and anchored-window "
            "candidate counts are separate. PR merge status is separate "
            "fix lifecycle data. Unknown GitHub statuses remain unknown; an "
            "original workbook 'open' label is not current state. No historical "
            "or recent defect counts or LOC are spliced together."
        ),
    }
    return summary, positive


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--historical-root", type=Path,
                   default=Path("docs/engineering/aspects-historical"))
    p.add_argument("--audited-rows", type=Path, required=True)
    p.add_argument("--pin-report", type=Path, required=True)
    p.add_argument("--new-ledger", type=Path,
                   default=Path("docs/engineering/aspects-review-ledger.jsonl"))
    p.add_argument("--pr-states", type=Path, required=True)
    p.add_argument("--json-out", type=Path, required=True)
    p.add_argument("--rows-out", type=Path, required=True)
    args = p.parse_args()
    verify(args.historical_root)
    events = []
    for shard in sorted((args.historical_root / "review-events").glob("*.jsonl")):
        events.extend(read_records(shard))
    audit = read_records(args.audited_rows)
    ledger = read_records(args.new_ledger)
    report, positive = reconcile(
        events, audit,
        json.loads(args.pin_report.read_text(encoding="utf-8")),
        ledger,
        json.loads(args.pr_states.read_text(encoding="utf-8")))
    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.rows_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    args.rows_out.write_text(
        "".join(json.dumps(item, sort_keys=True) + "\n" for item in positive), encoding="utf-8")
    print(json.dumps(report, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()

