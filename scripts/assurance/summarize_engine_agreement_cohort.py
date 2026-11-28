#!/usr/bin/env python3
"""Summarize pinned FND-082 case reports without imputing agreement as truth."""

import argparse
from collections import Counter
import json
from pathlib import Path
import sys

import paired_engine_evaluation as paired
import sample_engine_agreements as agreement
import verify_divergent_findings as verify

MAX_CASES = 128
KEYS = [(severity, frame) for severity in agreement.SEVERITIES for frame in agreement.FRAMES]
KNOWN = agreement.ERRORS | {"confirmed_correct"}


def summarize(manifest, manifest_pin, reports):
    require = agreement.require
    require(agreement.digest(manifest) == agreement.pin(manifest_pin, "cohort manifest"), "cohort digest mismatch")
    verify._fields(manifest, "schemaVersion cohortVersion dataClass products cases", "cohort manifest")
    paired._version(manifest["schemaVersion"], "cohort")
    require(manifest["dataClass"] == "reviewed_synthetic", "cohort is limited to reviewed synthetic cases")
    verify._text(manifest["cohortVersion"], "cohort version")
    products = verify._rows(manifest["products"], len(paired.PRODUCTS), "cohort products")
    require(bool(products) and all(isinstance(p, str) and p in paired.PRODUCTS for p in products)
            and len(set(products)) == len(products),
            "invalid cohort products")
    cases = {}
    for case in verify._rows(manifest["cases"], MAX_CASES, "cohort cases"):
        verify._fields(case, "product caseId fixtureSha256 reportSha256", "pinned case")
        product = agreement.one_of(case["product"], products, "case product")
        key = (product, verify._text(case["caseId"], "case ID"))
        require(key not in cases, "duplicate cohort case")
        for key_name in ("fixtureSha256", "reportSha256"):
            agreement.pin(case[key_name], "case " + key_name)
        cases[key] = case
    require({product for product, _ in cases} == set(products), "every declared product requires a case")

    seen, fingerprints = set(), set()
    totals = {product: {key: Counter() for key in KEYS} for product in products}
    coverage = {product: Counter() for product in products}
    for report in verify._rows(reports, MAX_CASES, "cohort reports"):
        require(isinstance(report, dict), "invalid case report")
        product = agreement.one_of(report.get("product"), products, "report product")
        key = (product, verify._text(report.get("caseId"), "report case ID"))
        case = cases.get(key)
        require(case is not None and key not in seen and agreement.digest(report) == case["reportSha256"]
                and report.get("fixtureSha256") == case["fixtureSha256"], "missing, duplicate, or altered case report")
        seen.add(key)
        agreement.review_rows(report)
        input_hashes = report["inputFingerprints"]
        verify._fields(input_hashes, "evidence policy scope configuration", "input fingerprint")
        for value in input_hashes.values():
            agreement.pin(value, "component fingerprint")
        fingerprint = (product, agreement.digest(input_hashes))
        require(fingerprint not in fingerprints, "duplicate fixture input under a different case ID")
        fingerprints.add(fingerprint)
        coverage[product]["cases"] += 1

        group_counts = {stratum: Counter() for stratum in KEYS}
        seen_targets = set()

        def check_target(target):
            verify._fields(target, "family scopeKey identity assertionId valueType form severity checkId", "target")
            target_id = tuple(verify._text(target[k], k) for k in ("family", "scopeKey", "identity"))
            require(target_id not in seen_targets, "same target counted more than once in a case")
            seen_targets.add(target_id)
            return agreement.one_of(target["severity"], agreement.SEVERITIES, "target severity")

        for sample in report["sampledResults"]:
            severity = check_target(sample["target"])
            frame = agreement.one_of(sample.get("frame"), agreement.FRAMES, "sample frame")
            outcome = agreement.one_of(sample.get("outcome"), KNOWN | {"unknown"}, "sample outcome")
            if outcome in agreement.ERRORS:
                require((frame == "shared_silence") == (outcome == "shared_false_negative"),
                        "sample error does not match its frame")
            group_counts[severity, frame][outcome] += 1

        expected_excluded = 0
        for row in report["excludedTargets"]:
            check_target(row["target"])
            state = agreement.one_of(row.get("state"), {"unknown", "outside_agreement"}, "excluded state")
            coverage[product][state] += 1
            expected_excluded += 1

        strata_seen = set()
        eligible_total = 0
        for stratum in verify._rows(report["frameSummaries"], len(KEYS), "frame summaries"):
            severity = agreement.one_of(stratum.get("severity"), agreement.SEVERITIES, "frame severity")
            frame = agreement.one_of(stratum.get("frame"), agreement.FRAMES, "frame class")
            group = (severity, frame)
            require(group not in strata_seen, "duplicate sampling stratum")
            strata_seen.add(group)
            counts = group_counts[group]
            sampled = sum(counts.values())
            errors = sum(counts[outcome] for outcome in agreement.ERRORS)
            eligible = stratum.get("eligible")
            require(type(eligible) is int and sampled <= eligible <= agreement.MAX_TARGETS,
                    "invalid sampling denominator")
            unknown = counts["unknown"]
            unsampled = eligible - sampled
            calculated = {"sampled": sampled, "resolved": sampled - unknown, "unknownSampled": unknown,
                          "unsampled": unsampled, "confirmedErrors": errors,
                          "errorCountRangeInEligibleFrame": [errors, errors + unknown + unsampled]}
            require(all(agreement.digest(stratum.get(k)) == agreement.digest(v) for k, v in calculated.items()),
                    "sampling summary does not match recorded evidence")
            eligible_total += eligible
            totals[product][group].update(eligible=eligible, sampled=sampled, resolved=sampled - unknown,
                                          unknownSampled=unknown, unsampled=unsampled, confirmedErrors=errors,
                                          **{k: counts[k] for k in sorted(agreement.ERRORS)})
        registered = eligible_total + expected_excluded
        require(strata_seen == set(KEYS) and 0 < registered <= agreement.MAX_TARGETS
                and agreement.digest(report.get("registeredTargets")) == agreement.digest(registered),
                "incomplete sampling accounting")
        coverage[product]["registeredTargets"] += eligible_total + expected_excluded
    require(seen == set(cases), "required case report missing")

    by_product = {}
    for product in sorted(products):
        rows = []
        for severity, frame in KEYS:
            data = totals[product][severity, frame]
            errors, eligible = data["confirmedErrors"], data["eligible"]
            upper = errors + data["unknownSampled"] + data["unsampled"]
            rows.append({"severity": severity, "frame": frame, **data,
                         "eligibleErrorCountRange": [errors, upper],
                         "eligibleErrorRateRangeBps": ([errors * 10_000 // eligible,
                                                       (upper * 10_000 + eligible - 1) // eligible] if eligible else None)})
        by_product[product] = {"cases": coverage[product]["cases"],
                               "registeredTargets": coverage[product]["registeredTargets"],
                               "unknownOutsideFrame": coverage[product]["unknown"],
                               "outsideAgreement": coverage[product]["outside_agreement"], "frames": rows}
    return {"schemaVersion": 1, "kind": "engine-agreement-cohort-summary", "dataClass": "reviewed_synthetic",
            "cohortVersion": manifest["cohortVersion"], "cohortSha256": manifest_pin,
            "promotionAuthorized": False, "products": by_product}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cohort", type=Path, required=True)
    parser.add_argument("--cohort-sha256", required=True)
    parser.add_argument("--report", type=Path, required=True, action="append")
    args = parser.parse_args()
    try:
        agreement.require(len(args.report) <= MAX_CASES, "too many case reports")
        output = summarize(paired.read(args.cohort), args.cohort_sha256, [paired.read(path) for path in args.report])
        print(json.dumps(output, indent=2, sort_keys=True, allow_nan=False))
    except (OSError, ValueError, KeyError, TypeError, AttributeError, RecursionError) as error:
        print(f"cohort summary rejected: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
