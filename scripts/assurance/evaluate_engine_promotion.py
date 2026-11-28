#!/usr/bin/env python3
"""Evaluate an offline, advisory FND-081 engine promotion decision."""

import argparse
from collections import Counter, defaultdict
from fractions import Fraction
import json
from pathlib import Path
import sys

import paired_engine_evaluation as paired
import verify_divergent_findings as verification

SEVERITIES = ("critical", "high", "medium", "low", "informational")
MEASURES = {"latencyMs", "peakMemoryKiB", "costMicros"}
QUALITY_FIELDS = "minPrecisionBps minRecallBps maxPrecisionDropBps maxRecallDropBps"
BPS = 10_000
MAX_CASES = 128
MAX_SAMPLES = 256
MAX_LABELS = 4096


class GateError(ValueError):
    """Invalid gate input or an ineligible rehearsal."""


def require(condition, message):
    if not condition:
        raise GateError(message)


def digest(value):
    return paired.sha(paired.canonical(value))


def matches(value, other):
    # Python equality alone would equate True and 1.
    return paired.canonical(value) == paired.canonical(other)


def shape(value, fields, name):
    return paired._object(value, fields.split(), name)


def schema(value, fields, name):
    shape(value, "schemaVersion " + fields, name)
    paired._version(value["schemaVersion"], name)


def integer(value, minimum, maximum, name):
    require(type(value) is int and minimum <= value <= maximum, f"{name}: out of bounds")
    return value


def enum(value, allowed, name):
    require(isinstance(value, str) and value in allowed, f"{name}: unsupported value")
    return value


def hex_pin(value, pattern, name):
    require(isinstance(value, str) and pattern.fullmatch(value) is not None, f"{name}: invalid pin")
    return value


def check_pin(value, pin, name):
    require(digest(value) == hex_pin(pin, paired.DIGEST, name), f"{name}: digest mismatch")


def validate_policy(policy):
    schema(policy, "policyVersion products minCasesPerProduct severity weightedQuality performance verificationLimits",
           "policy")
    paired._text(policy["policyVersion"], "policy version")
    products = paired._rows(policy["products"], len(paired.PRODUCTS), "required products")
    require(products and all(isinstance(p, str) and p in paired.PRODUCTS for p in products)
            and len(set(products)) == len(products), "policy must require distinct known products")
    integer(policy["minCasesPerProduct"], 1, MAX_CASES, "minimum independent cases per product")
    shape(policy["severity"], " ".join(SEVERITIES), "severity policy")
    previous = 1_000_001
    for severity, rule in policy["severity"].items():
        shape(rule, "weight minPositive minNegative minCoverageBps maxUnknownBps " + QUALITY_FIELDS, "severity rule")
        integer(rule["weight"], 1, 1_000_000, "severity weight")
        for name in ("minPositive", "minNegative"):
            integer(rule[name], 0, MAX_LABELS * MAX_CASES, name)
        for name in rule.keys() - {"weight", "minPositive", "minNegative"}:
            integer(rule[name], 0, BPS, name)
    for severity in SEVERITIES:
        weight = policy["severity"][severity]["weight"]
        require(weight < previous, "severity weights must strictly descend")
        previous = weight
    critical = policy["severity"]["critical"]
    require(critical["minPositive"] > 0 and critical["minNegative"] > 0
            and critical["minCoverageBps"] == BPS and critical["maxUnknownBps"] == 0,
            "critical policy requires independent positive and negative samples and complete coverage")
    for value in shape(policy["weightedQuality"], QUALITY_FIELDS, "weighted quality policy").values():
        integer(value, 0, BPS, "weighted quality budget")
    config = shape(policy["performance"], "minSamples measures", "performance policy")
    integer(config["minSamples"], 1, MAX_SAMPLES, "minimum performance samples")
    require(isinstance(config["measures"], dict) and "latencyMs" in config["measures"]
            and set(config["measures"]) <= MEASURES, "performance measures must include latency")
    for rule in config["measures"].values():
        shape(rule, "maxValue maxIncreaseBps", "performance measure")
        integer(rule["maxValue"], 0, 10**12, "absolute performance budget")
        if rule["maxIncreaseBps"] is not None:
            integer(rule["maxIncreaseBps"], 0, 10 * BPS, "relative performance budget")
    limits = shape(policy["verificationLimits"], "checks work deadlineMs", "verification limits")
    return verification.Limits(limits["checks"], limits["work"], limits["deadlineMs"])


def scalar(value):
    return type(value) is bool or (type(value) is int and -(2**63) <= value < 2**63)


def claim(value):
    shape(value, "assertionId asserted", "registered expectation")
    paired._text(value["assertionId"], "assertion ID")
    require(scalar(value["asserted"]), "expected a scoped Boolean or integer assertion")


def engine_map(value, name, products=None):
    require(isinstance(value, dict) and bool(value) and set(value) <= paired.PRODUCTS,
            f"{name}: invalid product set")
    if products is not None:
        require(set(value) == products, f"{name}: mismatched product set")
    for engine in value.values():
        paired.validate_engine(engine, name)


def registered_labels(case, partitions, adjudications):
    exports = {}
    for export in paired._rows(adjudications, MAX_LABELS, "adjudication exports"):
        require(isinstance(export, dict), "invalid adjudication export")
        pin = digest(export)
        require(pin not in exports, "duplicate adjudication export")
        exports[pin] = export
    used = set()
    result = {}
    for label in paired._rows(case["labels"], MAX_LABELS, "independent labels"):
        shape(label, "family scopeKey identity severity truth expected evidenceSha256 activeHeadSha256", "label")
        family, scope, identity = (paired._text(label[field], field) for field in ("family", "scopeKey", "identity"))
        partition = (family, scope)
        require(partition in partitions, "label outside independently declared scope")
        if partitions[partition] == "archlucid-finding-v2":
            hex_pin(identity, paired.CANONICAL_KEY, "finding identity")
        key = (*partition, identity)
        require(key not in result, "duplicate independent label")
        enum(label["severity"], SEVERITIES, "label severity")
        source = enum(label["truth"], {"independent_corpus", "accepted_adjudication", "unresolved"}, "truth source")
        if source == "unresolved":
            require(label["expected"] is None and label["evidenceSha256"] is None
                    and label["activeHeadSha256"] is None, "unresolved label cannot assert truth")
        else:
            pin = hex_pin(label["evidenceSha256"], paired.DIGEST, "truth evidence")
            if label["expected"] is not None:
                claim(label["expected"])
            if source == "independent_corpus":
                require(label["activeHeadSha256"] is None, "independent corpus does not use an adjudication head")
            else:
                head = hex_pin(label["activeHeadSha256"], paired.DIGEST, "active adjudication head")
                export = exports.get(pin)
                require(export is not None and type(export.get("schemaVersion")) is int
                        and export["schemaVersion"] == 1
                        and export.get("kind") == "adjudicated-finding-regression"
                        and export.get("dataClass") == "reviewed_synthetic"
                        and export.get("caseId") == case["caseId"]
                        and export.get("fixtureSha256") == case["fixtureSha256"]
                        and export.get("ledgerHeadSha256") == head and label["expected"] is not None
                        and matches(export.get("expected"), {"family": family, "scopeKey": scope,
                                                             "identity": identity, **label["expected"]}),
                        "missing, stale, or out-of-scope accepted adjudication")
                for field in ("corpusSha256", "comparisonSha256", "comparisonRowSha256", "proofSha256",
                              "checkBundleSha256", "approvalSha256"):
                    hex_pin(export.get(field), paired.DIGEST, "adjudication " + field)
                paired._text(export.get("checkId"), "adjudication check")
                refs = paired._rows(export.get("evidenceReferences"), 64, "adjudication proof references")
                require(refs and all(paired._text(ref, "adjudication reference") for ref in refs),
                        "adjudication must record proof references")
                used.add(pin)
        result[key] = label
    require(set(exports) == used, "run supplied unregistered adjudication exports")
    return result


def p95(samples):
    return sorted(samples)[(95 * len(samples) + 99) // 100 - 1]


def performance(case, timing, policy, note):
    shape(timing, "profile baseline candidate", "performance evidence")
    profile = hex_pin(timing["profile"], paired.DIGEST, "measurement profile")
    require(profile == case["performanceProfileSha256"], "performance evidence uses a different measurement profile")
    measures = policy["measures"]
    values = {side: shape(timing[side], " ".join(measures), "performance role") for side in paired.ROLES}
    result = {}
    for metric, limits in sorted(measures.items()):
        samples = {side: paired._rows(values[side][metric], MAX_SAMPLES, "performance samples") for side in paired.ROLES}
        for series in samples.values():
            for n in series:
                integer(n, 0 if metric == "costMicros" else 1, 10**12, "performance sample")
        baseline, candidate = (samples[side] for side in paired.ROLES)
        result[metric] = {side: {"sampleCount": len(series), "p95": p95(series) if series else None}
                          for side, series in samples.items()}
        if len(baseline) != len(candidate) or len(baseline) < policy["minSamples"]:
            note("insufficient", "paired_performance_sample_shortfall", detail=metric)
            continue
        base, cand = (result[metric][side]["p95"] for side in paired.ROLES)
        if cand > limits["maxValue"]:
            note("block", "absolute_performance_budget_exceeded", detail=metric)
        relative = limits["maxIncreaseBps"]
        if relative is not None and (cand - base) * BPS > base * relative:
            note("block", "relative_performance_budget_exceeded", detail=metric)
    return result


def observation(row):
    if row is None:
        return None
    value = row["semantics"]
    severity = value.get("severity")
    if not isinstance(severity, str) or severity not in SEVERITIES:
        return False
    claim_id = value.get("assertionId")
    if not isinstance(claim_id, str) or not claim_id.strip() or not scalar(value.get("asserted")):
        return False
    return {"severity": severity, "assertionId": claim_id, "asserted": value["asserted"]}


def level(label, findings):
    severity = [label["severity"]] if label else []
    for finding in findings:
        if finding is not None:
            value = finding["semantics"].get("severity")
            severity.append(value if isinstance(value, str) and value in SEVERITIES else "critical")
    return min(severity, key=SEVERITIES.index) if severity else "critical"


def tally(counter, actual, expected):
    if actual is None and expected is None:
        counter["tn"] += 1
        return
    exact = matches(actual, expected)
    if exact:
        counter["tp"] += 1
    else:
        if expected is not None:
            counter["fn"] += 1
        if actual is not None:
            counter["fp"] += 1


def conflicting(label, item):
    checked = item["verdict"]
    if checked not in ("supported", "refuted"):
        return False
    expected = label["expected"]
    if expected is None:
        return checked == "supported"
    semantics = item["observation"]["semantics"]
    if expected["assertionId"] != semantics.get("assertionId"):
        return False  # An oracle for a different assertion does not resolve this label.
    return (checked == "supported") != matches(expected["asserted"], semantics.get("asserted"))


def directly_regressed(proofs):
    supported = {p["side"] for p in proofs if p["verdict"] == "supported"}
    refuted = {p["side"] for p in proofs if p["verdict"] == "refuted"}
    change = proofs[0]["comparison"] if proofs else None
    return ((change == "removed" and "baseline" in supported)
            or (change == "added" and "candidate" in refuted)
            or (change == "changed" and "baseline" in supported and "candidate" in refuted))


def score_case(item, case, baselines, candidates, limits, counters, note):
    fixture, plan = item["fixture"], item["plan"]
    partitions = paired.validate_fixture(fixture)
    check_pin(fixture, case["fixtureSha256"], "cohort fixture")
    require(fixture["caseId"] == case["caseId"] and fixture["product"] == case["product"],
            "fixture does not match registered case scope")
    product = case["product"]
    paired.validate_plan(plan, case["fixtureSha256"])
    require(matches(plan["baseline"], baselines[product]) and matches(plan["candidate"], candidates[product]),
            "pair plan does not match pinned baseline and candidate")
    comparison = paired.compare(fixture, plan, item["baseline"], item["candidate"])
    proof = verification.verify(fixture, plan, item["baseline"], item["candidate"], item["checks"],
                                case["checkBundleSha256"], original=comparison, limits=limits)
    check_pin(comparison, proof["comparisonSha256"], "verification comparison")
    labels = registered_labels(case, partitions, item["adjudications"])
    labels_by_scope = defaultdict(set)
    for family, scope, identity in labels:
        labels_by_scope[(family, scope)].add(identity)
    proofs = defaultdict(list)
    for row in proof["results"]:
        if row["side"] is not None:
            proofs[(row["family"], row["scopeKey"], row["identity"])].append(row)

    for section in comparison["partitions"]:
        scope = (section["family"], section["scopeKey"])
        both_complete = all(section[side + "Coverage"]["status"] == "complete"
                            and section[side + "Coverage"]["identityScheme"] == partitions[scope]
                            for side in paired.ROLES)
        if not both_complete:
            note("insufficient", "scope_not_comparable", detail=digest(scope))
        observations = {side: defaultdict(list) for side in paired.ROLES}
        differences = set()
        for row in section["outcomes"]:
            if row["classification"] == "incomparable":
                note("insufficient", "incomparable_finding_identity_or_scope", detail=digest(scope))
            elif row["classification"] != "agreed":
                differences.add(row["identity"])
            for side in paired.ROLES:
                for finding in row[side]:
                    observations[side][finding["identity"]].append(finding)
        keys = set().union(*(set(by_identity) for by_identity in observations.values()),
                           labels_by_scope[scope])
        for identity in keys:
            key = (*scope, identity)
            label = labels.get(key)
            found = {side: observations[side][identity] for side in paired.ROLES}
            risk = level(label, [row for data in found.values() for row in data])
            independent = label is not None and label["truth"] != "unresolved"
            bucket = counters[product][label["severity"] if independent else risk]
            bucket["opportunities"] += 1
            for side in paired.ROLES:
                coverage = section[side + "Coverage"]
                if coverage["status"] == "complete" and coverage["identityScheme"] == partitions[scope]:
                    bucket[side]["covered"] += 1
            precise = both_complete and identity is not None and all(len(rows) <= 1 for rows in found.values())
            actual = {side: observation(rows[0]) if len(rows) == 1 else None for side, rows in found.items()}
            precise = precise and all(value is not False for value in actual.values())
            disagreement = identity in differences
            slot = digest(key)
            if not precise or not independent:
                bucket["unknown"] += 1
                if risk == "critical" and disagreement:
                    code = ("confirmed_critical_regression" if precise and directly_regressed(proofs[key])
                            else "unresolved_material_critical_disagreement")
                    note("block", code, detail=slot)
                elif risk == "critical":
                    note("insufficient", "unresolved_critical_coverage_or_truth", detail=slot)
                continue
            if any(conflicting(label, row) for row in proofs[key]):
                bucket["unknown"] += 1
                note("block" if risk == "critical" else "insufficient",
                     "independent_truth_conflict", detail=slot)
                continue
            expected = label["expected"]
            if expected is not None:
                expected = {"severity": label["severity"], **expected}
            bucket["positive" if expected is not None else "negative"] += 1
            prior = {side: bucket[side].copy() for side in paired.ROLES}
            for side in paired.ROLES:
                tally(bucket[side], actual[side], expected)
            if risk == "critical" and any(
                bucket["candidate"][key] - prior["candidate"][key] > bucket["baseline"][key] - prior["baseline"][key]
                for key in ("fp", "fn")
            ):
                note("block", "confirmed_critical_regression", detail=slot)
    return {"comparisonSha256": digest(comparison), "verificationSha256": digest(proof),
            "inputFingerprintSha256": digest(comparison["inputFingerprints"]),
            "verificationVerdicts": proof["counts"]}


def ratio(count, total):
    return Fraction(count * BPS, total) if total else None


def accuracy(counts):
    return {"Precision": ratio(counts["tp"], counts["tp"] + counts["fp"]),
            "Recall": ratio(counts["tp"], counts["tp"] + counts["fn"])}


def threshold_results(rates, rule):
    for metric in ("Precision", "Recall"):
        candidate, baseline = (rates[side][metric] for side in ("candidate", "baseline"))
        floor = rule["min" + metric + "Bps"]
        drop = rule["max" + metric + "DropBps"]
        if candidate is None and (floor or (baseline is not None and drop < BPS)):
            yield "insufficient", "undefined_candidate_rate", metric.lower()
        elif candidate is not None and (candidate < floor or (baseline is not None and baseline - candidate > drop)):
            yield "block", "quality_threshold_regression", metric.lower()


def display_rates(rates):
    return {name.lower() + "Bps": int(value) if value is not None else None for name, value in rates.items()}


def metric_report(counters, policy, add):
    metrics = {}
    for product, levels in counters.items():
        metrics[product] = {}
        weighted = {side: Counter() for side in paired.ROLES}
        for severity, data in levels.items():
            rule = policy["severity"][severity]
            positive, negative, opportunities, unknown = (data[k] for k in ("positive", "negative", "opportunities", "unknown"))
            if positive < rule["minPositive"] or negative < rule["minNegative"]:
                add("insufficient", "independent_sample_shortfall", product, severity=severity)
            if opportunities and unknown * BPS > opportunities * rule["maxUnknownBps"]:
                add("insufficient", "unknown_budget_exceeded", product, severity=severity)
            result = {k: data[k] for k in ("positive", "negative", "opportunities", "unknown")}
            rates = {}
            for side in paired.ROLES:
                counts = data[side]
                coverage = ratio(counts["covered"], opportunities)
                rates[side] = accuracy(counts)
                if coverage is not None and coverage < rule["minCoverageBps"]:
                    add("insufficient", "severity_coverage_shortfall", product, severity=severity, detail=side)
                result[side] = {k: counts[k] for k in ("tp", "fp", "fn", "tn", "covered")}
                result[side]["coverageBps"] = int(coverage) if coverage is not None else None
                result[side].update(display_rates(rates[side]))
                for k in ("tp", "fp", "fn"):
                    weighted[side][k] += counts[k] * rule["weight"]
            for kind, reason, detail in threshold_results(rates, rule):
                add(kind, reason, product, severity=severity, detail=detail)
            metrics[product][severity] = result
        weighted_rates = {side: accuracy(weighted[side]) for side in paired.ROLES}
        for kind, reason, detail in threshold_results(weighted_rates, policy["weightedQuality"]):
            add(kind, "weighted_" + reason, product, detail=detail)
        metrics[product]["weighted"] = {side: {**weighted[side], **display_rates(weighted_rates[side])}
                                        for side in paired.ROLES}
    return metrics


def evaluate(policy, policy_pin, cohort, cohort_pin, run, run_pin, target):
    for value, pin, name in ((policy, policy_pin, "policy"), (cohort, cohort_pin, "cohort"), (run, run_pin, "run")):
        check_pin(value, pin, name)
    limits = validate_policy(policy)
    schema(cohort, "cohortVersion dataClass baselineReleaseSha engines cases", "cohort")
    schema(run, "targetReleaseSha engines cases", "paired evaluation run")
    require(cohort["dataClass"] == "reviewed_synthetic", "advisory gate accepts reviewed synthetic cohorts only")
    paired._text(cohort["cohortVersion"], "cohort version")
    rollback = hex_pin(cohort["baselineReleaseSha"], paired.REVISION, "baseline release")
    require(run["targetReleaseSha"] == hex_pin(target, paired.REVISION, "expected candidate release")
            and target != rollback, "mismatched candidate release or identical rollback release")
    products = set(policy["products"])
    engine_map(cohort["engines"], "baseline engines", products)
    engine_map(run["engines"], "candidate engines", products)
    cases = {}
    for case in paired._rows(cohort["cases"], MAX_CASES, "cohort cases"):
        shape(case, "caseId product fixtureSha256 checkBundleSha256 performanceProfileSha256 labels", "cohort case")
        case_id = paired._text(case["caseId"], "cohort case ID")
        require(case_id not in cases, "duplicate cohort case")
        enum(case["product"], products, "cohort product")
        for key in ("fixtureSha256", "checkBundleSha256", "performanceProfileSha256"):
            hex_pin(case[key], paired.DIGEST, key)
        cases[case_id] = case
    require({case["product"] for case in cases.values()} == products, "cohort must cover every declared product")
    counters = {
        product: {level: {"opportunities": 0, "positive": 0, "negative": 0, "unknown": 0,
                          **{side: Counter() for side in paired.ROLES}} for level in SEVERITIES}
        for product in sorted(products)
    }
    reasons = {}

    def add(kind, code, product, case_id=None, severity=None, detail=None):
        entry = {"kind": kind, "code": code, "product": product}
        if case_id is not None:
            entry["caseSha256"] = digest(case_id)
        if severity is not None:
            entry["severity"] = severity
        if detail is not None:
            entry["detail"] = detail
        reasons[digest(entry)] = entry

    seen, results = set(), {}
    fingerprints = {product: set() for product in products}
    for item in paired._rows(run["cases"], MAX_CASES, "run cases"):
        shape(item, "caseId fixture plan baseline candidate checks adjudications performance", "run case")
        case_id = paired._text(item["caseId"], "run case ID")
        require(case_id in cases and case_id not in seen, "unexpected or duplicate run case")
        seen.add(case_id)
        case = cases[case_id]

        def note(kind, code, detail=None):
            add(kind, code, case["product"], case_id, detail=detail)

        result = {
            **score_case(item, case, cohort["engines"], run["engines"], limits, counters, note),
            "performance": performance(case, item["performance"], policy["performance"], note),
            "product": case["product"],
        }
        input_pin = result["inputFingerprintSha256"]
        require(input_pin not in fingerprints[case["product"]], "duplicate cohort inputs under different case IDs")
        fingerprints[case["product"]].add(input_pin)
        results[digest(case_id)] = result
    for missing in (cases[case_id] for case_id in cases.keys() - seen):
        add("insufficient", "required_case_missing", missing["product"], missing["caseId"])
    for product, inputs in fingerprints.items():
        if len(inputs) < policy["minCasesPerProduct"]:
            add("insufficient", "independent_case_shortfall", product)
    metrics = metric_report(counters, policy, add)
    kinds = {reason["kind"] for reason in reasons.values()}
    return {
        "schemaVersion": 1, "kind": "engine-promotion-advisory", "promotionAuthorized": False,
        "decision": "block" if "block" in kinds else "insufficient" if kinds else "pass",
        "targetReleaseSha": target, "baselineReleaseSha": rollback,
        "candidateEnginePins": {product: digest(engine) for product, engine in run["engines"].items()},
        "baselineEnginePins": {product: digest(engine) for product, engine in cohort["engines"].items()},
        "policySha256": policy_pin, "cohortSha256": cohort_pin, "runSha256": run_pin,
        "policyVersion": policy["policyVersion"], "cohortVersion": cohort["cohortVersion"],
        "reasons": [reasons[pin] for pin in sorted(reasons)], "cases": results, "metrics": metrics,
    }


def rehearsal(report, pin, target, rollback, policy_pin, cohort_pin, run_pin):
    """Check allow/deny and rollback identity for a dry run. Never authorize a release."""
    check_pin(report, pin, "trusted advisory decision")
    require(type(report.get("schemaVersion")) is int and report["schemaVersion"] == 1
            and report.get("kind") == "engine-promotion-advisory"
            and report.get("promotionAuthorized") is False and report.get("decision") == "pass"
            and report.get("reasons") == [], "rehearsal requires a passing advisory decision")
    expected = {"targetReleaseSha": target, "baselineReleaseSha": rollback,
                "policySha256": policy_pin, "cohortSha256": cohort_pin, "runSha256": run_pin}
    for name, pin_value in expected.items():
        expected_pattern = paired.REVISION if name.endswith("ReleaseSha") else paired.DIGEST
        require(report.get(name) == hex_pin(pin_value, expected_pattern, name), "stale or different release evidence")
    require(target != rollback, "rollback must select a different pinned release")
    before, after = (report.get(field) for field in ("baselineEnginePins", "candidateEnginePins"))
    require(isinstance(before, dict) and isinstance(after, dict) and before and set(before) == set(after)
            and set(before) <= paired.PRODUCTS, "missing or mismatched engine bindings")
    for value in [*before.values(), *after.values()]:
        hex_pin(value, paired.DIGEST, "engine")
    return {"schemaVersion": 1, "kind": "engine-promotion-rehearsal", "promotionAuthorized": False,
            "advisorySha256": pin, "candidateReleaseSha": target, "rollbackReleaseSha": rollback,
            "candidateEnginePins": after, "rollbackEnginePins": before}


def validate_restoration(plan, observations, observation_pin):
    """Check trusted, read-only observations from an isolated rehearsal, not a deployment instruction."""
    check_pin(observations, observation_pin, "rehearsal observations")
    schema(observations, "kind rehearsalSha256 before afterPromotion afterRollback", "rehearsal observations")
    require(observations["kind"] == "isolated-engine-promotion-observations"
            and observations["rehearsalSha256"] == digest(plan), "observations use a different rehearsal plan")
    for phase in ("before", "afterPromotion", "afterRollback"):
        phase_record = shape(observations[phase], "releaseSha enginePins", "observed stage")
        candidate = phase == "afterPromotion"
        require(phase_record["releaseSha"] == plan["candidateReleaseSha" if candidate else "rollbackReleaseSha"]
                and matches(phase_record["enginePins"], plan["candidateEnginePins" if candidate else "rollbackEnginePins"]),
                "rehearsal did not observe the exact promoted or restored engine and release")
    return {**plan, "observationSha256": observation_pin, "rollbackIdentityVerified": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    common = argparse.ArgumentParser(add_help=False)
    for flag in ("policy-sha256", "cohort-sha256", "run-sha256", "target-release-sha"):
        common.add_argument("--" + flag, required=True)
    commands = parser.add_subparsers(dest="command", required=True)
    score = commands.add_parser("evaluate", parents=[common])
    for flag in ("policy", "cohort", "run"):
        score.add_argument("--" + flag, type=Path, required=True)
    preview = commands.add_parser("rehearse", parents=[common])
    preview.add_argument("--report", type=Path, required=True)
    preview.add_argument("--report-sha256", required=True)
    preview.add_argument("--baseline-release-sha", required=True)
    preview.add_argument("--observations", type=Path,
                         help="optional pinned read-only observations of an isolated rollback rehearsal")
    preview.add_argument("--observations-sha256")
    args = parser.parse_args()
    try:
        if args.command == "evaluate":
            output = evaluate(paired.read(args.policy), args.policy_sha256, paired.read(args.cohort),
                              args.cohort_sha256, paired.read(args.run), args.run_sha256, args.target_release_sha)
        else:
            output = rehearsal(paired.read(args.report), args.report_sha256, args.target_release_sha,
                               args.baseline_release_sha, args.policy_sha256, args.cohort_sha256, args.run_sha256)
            require((args.observations is None) == (args.observations_sha256 is None),
                    "rehearsal observations and their trusted pin must be supplied together")
            if args.observations is not None:
                output = validate_restoration(output, paired.read(args.observations), args.observations_sha256)
        print(json.dumps(output, indent=2, sort_keys=True, allow_nan=False))
    except (ValueError, OSError, RecursionError, AttributeError, TypeError):
        # Upstream validation may include original input values. Do not echo them into a release log.
        print("advisory evidence rejected (invalid schema, pin, scope, receipt, or release binding)", file=sys.stderr)
        return 2
    return 0 if output.get("decision", "pass") == "pass" else 1


if __name__ == "__main__":
    sys.exit(main())
