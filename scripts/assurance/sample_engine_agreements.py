#!/usr/bin/env python3
"""FND-082 offline sampling of shared engine assertions and shared silence."""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import sys
import time

import paired_engine_evaluation as paired
import verify_divergent_findings as verify

SEVERITIES = tuple(verify.SEVERITY_RANK)
FRAMES = ("shared_silence", "shared_assertion")
FORMS = {"positive_boolean_finding", "scalar_assertion"}
TYPES = {"boolean": bool, "integer": int}
ERRORS = {"shared_false_negative", "shared_false_positive", "shared_wrong_assertion"}
REPORT_KIND = "independent-engine-agreement-sampling"
MAX_TARGETS = 512


def digest(value):
    return paired.sha(paired.canonical(value))


def require(condition, reason):
    if not condition:
        raise verify.InputError(reason)


def pin(value, name):
    require(isinstance(value, str) and paired.DIGEST.fullmatch(value), f"{name}: invalid digest")
    return value


def one_of(value, options, name):
    require(isinstance(value, str) and value in options, f"{name}: invalid value")
    return value


def exact_type(value, value_type):
    kind = TYPES[value_type]
    return type(value) is kind and (kind is bool or -(2**63) <= value < 2**63)


def prepare(manifest, manifest_pin, fixture, checks, partitions):
    require(digest(manifest) == pin(manifest_pin, "sampling manifest"), "sampling manifest digest mismatch")
    verify._fields(manifest, "schemaVersion dataClass policyVersion fixtureSha256 checkBundleSha256 "
                   "selectionSeedSha256 samplesPerFrame verificationLimits targets", "sampling manifest")
    paired._version(manifest["schemaVersion"], "sampling manifest")
    require(manifest["dataClass"] == "reviewed_synthetic", "sampling is limited to reviewed synthetic inputs")
    verify._text(manifest["policyVersion"], "policy version")
    pin(manifest["selectionSeedSha256"], "preselected sample seed")
    fixture_hash = digest(fixture)
    require(fixture_hash == pin(manifest["fixtureSha256"], "manifest fixture"), "manifest fixture mismatch")
    index = verify._checks(checks, pin(manifest["checkBundleSha256"], "reviewed check bundle"),
                           fixture_hash, partitions)
    facts = verify._facts(fixture["evidence"], partitions)
    quotas = manifest["samplesPerFrame"]
    verify._fields(quotas, " ".join(SEVERITIES), "sampling quotas")
    for count in quotas.values():
        require(type(count) is int and 0 <= count <= MAX_TARGETS, "invalid sampling quota")
    limits = manifest["verificationLimits"]
    verify._fields(limits, "checks work deadlineMs", "verification limits")
    bounds = verify.Limits(limits["checks"], limits["work"], limits["deadlineMs"])

    targets = {}
    for row in verify._rows(manifest["targets"], MAX_TARGETS, "sample targets"):
        verify._fields(row, "family scopeKey identity assertionId valueType form severity checkId", "sampling target")
        scope = verify._scope(row, partitions, "target")
        identity = verify._text(row["identity"], "finding identity")
        if partitions[scope] == "archlucid-finding-v2":
            require(paired.CANONICAL_KEY.fullmatch(identity), "target is not a canonical finding key")
        assertion = verify._text(row["assertionId"], "finding assertion")
        value_type = one_of(row["valueType"], TYPES, "assertion type")
        form = one_of(row["form"], FORMS, "sample form")
        require(form != "positive_boolean_finding" or value_type == "boolean",
                "a positive finding requires a Boolean presence predicate")
        one_of(row["severity"], SEVERITIES, "independently registered severity")
        key = (*scope, identity)
        require(key not in targets, "duplicate target for scoped finding identity")
        check = None
        if row["checkId"] is not None:
            check_id = verify._text(row["checkId"], "approved independent check")
            approved = index.get((*key, assertion, value_type), ())
            check = next((check for check in approved if check.key == check_id), None)
            require(check is not None, "target check is not approved for its exact scope and assertion")
        targets[key] = (row, check)
    require(bool(targets), "sampling requires an independently registered target universe")
    return targets, facts, bounds


def classify(section, by_identity, target):
    for role in paired.ROLES:
        coverage = section[role + "Coverage"]
        if coverage["status"] != "complete" or coverage["identityScheme"] != section["identityScheme"]:
            return None, None, "paired_coverage_incomplete"
    if None in by_identity:
        # An uncorrelatable observation could be the allegedly absent finding.
        return None, None, "unresolved_finding_identity"
    row = by_identity.get(target["identity"])
    presence = target["form"] == "positive_boolean_finding"
    if row is None:
        if presence:
            return "shared_silence", False, None
        return None, None, "no_scalar_conclusion"
    if row["classification"] == "incomparable":
        return None, None, "unresolved_finding_identity"
    if row["classification"] != "agreed":
        return None, None, "divergent_finding"
    claim = row["baseline"][0]["semantics"]
    observed = claim.get("asserted")
    if (claim.get("assertionId") != target["assertionId"] or not exact_type(observed, target["valueType"])
            or (presence and observed is not True)):
        return None, None, "no_matching_assertion"
    return "shared_assertion", observed, None


def evaluate(target, check, fact, observed, frame, budget):
    if check is None:
        return {"outcome": "unknown", "reason": "no_approved_check", "proof": None}
    if fact is None or fact.status != "complete":
        reason = "evidence_missing" if fact is None else "evidence_incomplete"
        return {"outcome": "unknown", "reason": reason, "proof": None}
    blocked = budget.reserve(verify._work(check, fact))
    if blocked:
        return {"outcome": "unknown", "reason": blocked, "proof": None}
    try:
        expected, reason = verify._observe(check, fact, TYPES[target["valueType"]])
    except TimeoutError:
        expected, reason = None, "deadline_exceeded"
    except ValueError:
        expected, reason = None, "invalid_independent_fact"
    if budget.expired():
        expected, reason = None, "deadline_exceeded"
    if reason:
        return {"outcome": "unknown", "reason": reason, "proof": None}
    if not exact_type(expected, target["valueType"]):
        return {"outcome": "unknown", "reason": "value_outside_supported_range", "proof": None}

    if observed == expected:
        outcome = "confirmed_correct"
    elif frame == "shared_silence":
        outcome = "shared_false_negative"
    elif target["form"] == "positive_boolean_finding":
        outcome = "shared_false_positive"
    else:
        outcome = "shared_wrong_assertion"
    return {"outcome": outcome, "reason": "independent_exact_check",
            "proof": {"checkId": check.key, "checkVersion": check.version, "oracle": check.oracle.value,
                      "source": check.source, "factId": check.fact_id, "references": list(fact.references),
                      "expected": expected}}


def handoff(result, bindings):
    """Produce an FND-081 label proposal, never an approved or activated gate input."""
    target = result["target"]
    expected = result["proof"]["expected"]
    # Presence predicates use true for an emitted, exact assertion, and false for
    # verified absence. A scalar assertion with value false is not an absence.
    expectation = (None if target["form"] == "positive_boolean_finding" and expected is False
                   else {"assertionId": target["assertionId"], "asserted": expected})
    evidence = {**bindings, "finding": result}
    return {"fixtureSha256": bindings["fixtureSha256"], "caseId": bindings["caseId"],
            "requiresIndependentCohortApproval": True, "evidence": evidence,
            "label": {**{name: target[name] for name in ("family", "scopeKey", "identity", "severity")},
                      "truth": "independent_corpus", "expected": expectation, "activeHeadSha256": None,
                      "evidenceSha256": digest(evidence)}}


def review_rows(report):
    """Return reviewable rows without treating an agreement as a divergence."""
    require(isinstance(report, dict) and report.get("kind") == REPORT_KIND
            and report.get("dataClass") == "reviewed_synthetic",
            "expected a reviewed synthetic agreement report")
    paired._version(report.get("schemaVersion"), "agreement report")
    result = []
    for row in verify._rows(report.get("sampledResults"), MAX_TARGETS, "sampled results"):
        verify._fields(row, "target frame sharedValue outcome reason proof", "sampled result")
        if one_of(row["outcome"], ERRORS | {"confirmed_correct", "unknown"}, "sample outcome") != "confirmed_correct":
            result.append(row)
    for row in verify._rows(report.get("excludedTargets"), MAX_TARGETS, "excluded targets"):
        verify._fields(row, "target state reason", "excluded target")
        if one_of(row["state"], {"unknown", "outside_agreement"}, "excluded state") == "unknown":
            result.append({"target": row["target"], "outcome": "unknown", "reason": row["reason"],
                           "frame": None, "sharedValue": None, "proof": None})
    return result


def sample(fixture, plan, baseline, candidate, checks, manifest, manifest_pin, *, original=None, clock=None):
    """Select only from reviewed targets and retain unknowns and unsampled cases separately."""
    partitions = paired.validate_fixture(fixture)
    targets, facts, bounds = prepare(manifest, manifest_pin, fixture, checks, partitions)
    report, origin = verify._comparison(fixture, plan, baseline, candidate, original)
    sections = {(part["family"], part["scopeKey"]): (part, {r["identity"]: r for r in part["outcomes"]})
                for part in report["partitions"]}
    buckets = defaultdict(list)
    excluded = []
    for key, (target, check) in sorted(targets.items()):
        section, by_identity = sections[key[:2]]
        frame, observed, reason = classify(section, by_identity, target)
        if frame is None:
            state = "outside_agreement" if reason in ("divergent_finding", "no_scalar_conclusion") else "unknown"
            excluded.append({"target": target, "state": state, "reason": reason})
            continue
        # Approve the seed and target universe before examining outcomes. Ties
        # cannot depend on incoming manifest, receipt, or partition order.
        rank = digest([manifest["selectionSeedSha256"], report["caseId"], frame, key])
        buckets[target["severity"], frame].append((rank, key, target, check, observed))

    clock = time.monotonic if clock is None else clock
    budget = verify.Budget(bounds, clock() + bounds.deadline_ms / 1000, clock)
    bindings = {"product": report["product"], "caseId": report["caseId"], "fixtureSha256": report["fixtureSha256"],
                "comparisonSha256": digest(report), "manifestSha256": manifest_pin,
                "checkBundleSha256": manifest["checkBundleSha256"]}
    scores, summary, candidates = [], [], []
    for severity in SEVERITIES:
        for frame in FRAMES:
            pool = sorted(buckets[severity, frame], key=lambda entry: entry[:2])
            selected = pool[:manifest["samplesPerFrame"][severity]]
            error_count = unknown = 0
            for _, key, target, check, observed in selected:
                fact = facts.get((*key[:2], check.fact_id)) if check is not None else None
                row = {"target": target, "frame": frame, "sharedValue": observed,
                       **evaluate(target, check, fact, observed, frame, budget)}
                scores.append(row)
                if row["outcome"] == "unknown":
                    unknown += 1
                elif row["outcome"] in ERRORS:
                    error_count += 1
                    candidates.append(handoff(row, bindings))
            unsampled = len(pool) - len(selected)
            summary.append({"severity": severity, "frame": frame, "eligible": len(pool),
                            "sampled": len(selected), "resolved": len(selected) - unknown,
                            "unknownSampled": unknown, "unsampled": unsampled, "confirmedErrors": error_count,
                            "errorCountRangeInEligibleFrame": [error_count, error_count + unknown + unsampled]})
    result = {
        "schemaVersion": 1, "kind": REPORT_KIND, "dataClass": "reviewed_synthetic", **bindings,
        "inputFingerprints": report["inputFingerprints"],
        "comparisonOrigin": origin, "policyVersion": manifest["policyVersion"],
        "selectionSeedSha256": manifest["selectionSeedSha256"], "requiresIndependentCohortApproval": True,
        "promotionAuthorized": False, "registeredTargets": len(targets),
        "frameSummaries": summary, "sampledResults": scores, "excludedTargets": excluded,
        "fnd081LabelCandidates": candidates, "checksUsed": budget.checks, "workUsed": budget.work,
    }
    result["reviewQueue"] = [{"rowSha256": digest(row), "severity": row["target"]["severity"],
                             "outcome": row["outcome"]} for row in review_rows(result)]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for arg in ("fixture", "plan", "baseline", "candidate", "checks", "manifest"):
        parser.add_argument("--" + arg, type=Path, required=True)
    parser.add_argument("--manifest-sha256", required=True)
    parser.add_argument("--comparison", type=Path, help="optional pinned FND-078 report to replay exactly")
    args = parser.parse_args()
    try:
        read = paired.read
        inputs = [read(getattr(args, arg)) for arg in ("fixture", "plan", "baseline", "candidate", "checks", "manifest")]
        original = read(args.comparison) if args.comparison is not None else None
        result = sample(*inputs, args.manifest_sha256, original=original)
        print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))
    except (OSError, ValueError, RecursionError) as error:
        print(f"agreement evaluation rejected: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
