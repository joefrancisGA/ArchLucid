#!/usr/bin/env python3
"""Offline intake, independent review, and regression export for FND-080."""

import argparse
import hashlib
import hmac
import json
from pathlib import Path
import re
import sys

import paired_engine_evaluation as paired
import sample_engine_agreements as agreement

SCHEMA = 1
DIGEST = paired.DIGEST
IDENTIFIER = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}")
FINGERPRINTS = ("evidence", "policy", "scope", "configuration")
COVERAGE = paired.STATES | {"missing"}
UNRESOLVED = {"inconclusive", "not_testable"}
VERDICTS = UNRESOLVED | {"supported", "refuted"}
PARTITIONS = {"regression", "holdout", "tuning"}
MAX_EVENTS = 512


class ReviewError(ValueError):
    """Rejected input or review transition."""


def require(test, message):
    if not test:
        raise ReviewError(message)


def digest(value):
    return paired.sha(paired.canonical(value))


def fields(value, names, label):
    return paired._object(value, names.split(), label)


def rows(value, limit, label):
    return paired._rows(value, limit, label)


def version(value, label):
    require(isinstance(value, dict) and type(value.get("schemaVersion")) is int
            and value["schemaVersion"] == SCHEMA, f"{label}: unsupported schema")


def valid_string(value, pattern):
    return isinstance(value, str) and pattern.fullmatch(value) is not None


def identifier(value, label):
    require(valid_string(value, IDENTIFIER), f"{label}: invalid identifier")
    return value


def hash_value(value, label):
    require(valid_string(value, DIGEST), f"{label}: invalid digest")
    return value


def text(value, label):
    return paired._text(value, label)


def member(value, values, label):
    require(isinstance(value, str) and value in values, f"{label}: unsupported value")
    return value


def same(value, other):
    return paired.canonical(value) == paired.canonical(other)


def scalar(value):
    return type(value) is bool or (type(value) is int and -(2**31) <= value < 2**31)


def fingerprint(input_hashes):
    fields(input_hashes, " ".join(FINGERPRINTS), "input fingerprints")
    for key in FINGERPRINTS:
        hash_value(input_hashes[key], key)
    return digest(input_hashes)


def check_corpus(corpus, case_id, input_digest):
    fields(corpus, "schemaVersion corpusVersion entries protectedHoldout", "corpus")
    version(corpus, "corpus")
    identifier(corpus["corpusVersion"], "corpus version")
    by_case = {}
    assignments = ({}, {})
    for entry in rows(corpus["protectedHoldout"], 10000, "protected holdout"):
        fields(entry, "inputSha256 sourceGroup", "protected holdout entry")
        input_pin = hash_value(entry["inputSha256"], "protected holdout input")
        group = identifier(entry["sourceGroup"], "protected holdout source group")
        assignments[0][input_pin] = {"holdout"}
        assignments[1][group] = {"holdout"}
    for entry in rows(corpus["entries"], 10000, "corpus entries"):
        fields(entry, "caseId inputSha256 sourceGroup partition", "corpus entry")
        key = identifier(entry["caseId"], "corpus case")
        require(key not in by_case, "duplicate corpus case")
        value = hash_value(entry["inputSha256"], "corpus input")
        group = identifier(entry["sourceGroup"], "corpus source group")
        partition = member(entry["partition"], PARTITIONS, "corpus partition")
        for evidence, index in zip((value, group), assignments):
            history = index.setdefault(evidence, set())
            history.add(partition)
            require("holdout" not in history or len(history) == 1,
                    "holdout overlap by input fingerprint or source group")
        by_case[key] = entry
    entry = by_case.get(case_id)
    require(entry is not None and entry["inputSha256"] == input_digest,
            "case and immutable inputs must be registered together")
    return entry


def selected_rows(report, row_pin):
    version(report, "FND-079 report")
    require(report.get("kind") == "divergent-finding-verification"
            and report.get("scopeOfVerdicts") == "declared_scalar_assertions_only",
            "expected FND-079 scalar verification report")
    result = {}
    for row in rows(report.get("results"), 20000, "verification results"):
        require(isinstance(row, dict), "malformed verification row")
        if row.get("comparisonRowSha256") != row_pin:
            continue
        require(all(key in row for key in ("family", "scopeKey", "identity", "comparison",
                    "baselineCoverage", "candidateCoverage", "side", "observation",
                    "priority", "verdict", "reason", "attempts")), "incomplete verification row")
        comparison = member(row["comparison"], {"added", "removed", "changed", "incomparable"},
                            "comparison")
        side = row["side"]
        if comparison == "incomparable":
            require(side is None and row["observation"] is None, "incomparable row has an assertion")
        else:
            member(side, paired.ROLES, "comparison side")
            require(isinstance(row["observation"], dict)
                    and isinstance(row["observation"].get("semantics"), dict),
                    "missing structured observation")
        member(row["verdict"], VERDICTS, "verification verdict")
        require(side not in result, "ambiguous comparison row")
        for field in ("baselineCoverage", "candidateCoverage"):
            fields(row[field], "status reason identityScheme", "verification coverage")
            member(row[field]["status"], COVERAGE, "coverage")
        rows(row["attempts"], 512, "verification attempts")
        result[side] = row
    require(bool(result), "pinned comparison row not found")
    for row in result.values():
        require(all(row[k] == next(iter(result.values()))[k]
                    for k in ("family", "scopeKey", "identity", "comparison", "priority",
                              "baselineCoverage", "candidateCoverage")), "comparison siblings disagree")
    require(set(result) == {"added": {"candidate"}, "removed": {"baseline"},
                            "changed": set(paired.ROLES), "incomparable": {None}}[
                                next(iter(result.values()))["comparison"]],
            "incomplete comparison row")
    return result


def agreement_row(report, row_pin):
    selected = [row for row in agreement.review_rows(report) if digest(row) == row_pin]
    require(len(selected) == 1, "agreement row is not a unique review candidate")
    row = selected[0]
    target = fields(row["target"], "family scopeKey identity assertionId valueType form severity checkId",
                    "agreement target")
    member(target["form"], agreement.FORMS, "agreement form")
    member(target["valueType"], agreement.TYPES, "agreement assertion type")
    for name in ("identity", "assertionId"):
        text(target[name], "agreement target " + name)
    if row["outcome"] in agreement.ERRORS:
        member(row["frame"], agreement.FRAMES, "agreement frame")
        proof = fields(row["proof"], "checkId checkVersion oracle source factId references expected", "agreement proof")
        require(agreement.exact_type(proof["expected"], target["valueType"])
                and agreement.exact_type(row["sharedValue"], target["valueType"])
                and not same(proof["expected"], row["sharedValue"]), "malformed exact agreement error")
    else:
        require(row["proof"] is None, "unknown agreement cannot claim independent proof")
    return row


class Review:
    def __init__(self, report, policy, policy_pin, secret):
        hash_value(policy_pin, "authorization policy")
        require(digest(policy) == policy_pin, "authorization policy digest mismatch")
        fields(policy, "schemaVersion case reviewers corpus", "authorization policy")
        version(policy, "authorization policy")
        require(isinstance(secret, bytes) and len(secret) == 32, "blinding key must be 32 bytes")
        case = fields(policy["case"], "reviewId caseId reportSha256 rowSha256 dataClass material "
                      "scopeAlias question producers evidence proofSource", "case approval")
        require(case["dataClass"] == "reviewed_synthetic" and case["material"] is True,
                "case must be approved as material reviewed synthetic data")
        require(digest(report) == hash_value(case["reportSha256"], "report digest"),
                "intake report digest mismatch")
        self.report = report
        self.row_pin = hash_value(case["rowSha256"], "comparison row")
        is_agreement = report.get("kind") == agreement.REPORT_KIND
        self.agreement = agreement_row(report, self.row_pin) if is_agreement else None
        if is_agreement:
            row = self.agreement["target"]
            priority = row["severity"]
            # Coverage tells the custodian which frame was eligible, but do not show
            # reviewers the shared value, engine output, or whether an oracle agreed.
            coverage = ["complete", "complete"] if self.agreement["frame"] in agreement.FRAMES else []
        else:
            self.selected = selected_rows(report, self.row_pin)
            require(any(row["verdict"] in UNRESOLVED for row in self.selected.values()),
                    "comparison row has no unresolved verification")
            row = next(iter(self.selected.values()))
            priority = row["priority"]
            coverage = sorted(row[key]["status"] for key in ("baselineCoverage", "candidateCoverage"))
        self.product = member(report.get("product"), paired.PRODUCTS, "report product")
        case_id = identifier(case["caseId"], "case ID")
        require(report.get("caseId") == case_id, "case approval does not match report")
        bundle_field = "checkBundleSha256" if is_agreement else "approvedCheckBundleSha256"
        for key in ("fixtureSha256", "comparisonSha256", bundle_field):
            hash_value(report.get(key), key)
        self.family = text(row["family"], "family")
        text(row["scopeKey"], "scope key")
        self.producers = {identifier(p, "producer") for p in rows(case["producers"], 32, "producers")}
        require(bool(self.producers), "document the sources that must not adjudicate")
        self.reviewers = {}
        for entry in rows(policy["reviewers"], 128, "reviewers"):
            fields(entry, "id active products families qualification conflicts", "reviewer")
            key = identifier(entry["id"], "reviewer ID")
            require(key not in self.reviewers, "duplicate reviewer")
            require(type(entry["active"]) is bool, "reviewer active must be Boolean")
            for value in rows(entry["products"], 8, "reviewer products"):
                member(value, paired.PRODUCTS, "reviewer product")
            for value in rows(entry["families"], 64, "reviewer families"):
                text(value, "reviewer family")
            text(entry["qualification"], "reviewer qualification reference")
            for value in rows(entry["conflicts"], 128, "reviewer conflicts"):
                identifier(value, "conflicting case ID")
            self.reviewers[key] = entry
        self.case_id = case_id
        self.corpus = policy["corpus"]
        self.entry = check_corpus(self.corpus, case_id, fingerprint(report.get("inputFingerprints")))
        review_id = identifier(case["reviewId"], "opaque review ID")
        scope_alias = identifier(case["scopeAlias"], "opaque scope alias")
        question = text(case["question"], "reviewed neutral question")
        cards = {}
        for card in rows(case["evidence"], 32, "evidence cards"):
            fields(card, "alias summary", "evidence card")
            name = identifier(card["alias"], "evidence alias")
            require(name not in cards, "duplicate review evidence alias")
            cards[name] = text(card["summary"], "reviewed synthetic evidence summary")
        require(bool(cards), "provide scoped evidence to reviewers")
        self.aliases = set(cards)
        self.proof_source = case["proofSource"]
        if self.proof_source is not None:
            validate_source(self.proof_source)
            require(self.proof_source["id"] not in self.producers, "proof source is a comparison producer")

        def keyed(side):
            return hmac.digest(secret, paired.canonical([self.row_pin, review_id, side]), hashlib.sha256)

        if is_agreement:
            if row["valueType"] == "boolean":
                values = [False, True]
            elif self.agreement["outcome"] in agreement.ERRORS:
                values = [self.agreement["sharedValue"], self.agreement["proof"]["expected"]]
            else:
                values = []  # No fabricated alternate for an unknown integer.
            blinded = {str(i): value for i, value in enumerate(sorted(set(values)))
                       if agreement.exact_type(value, row["valueType"])}
            visible = bool(blinded)
        else:
            observations = {side: item["observation"]["semantics"] for side, item in self.selected.items()
                            if side is not None}
            visible = observations and all(scalar(o.get("asserted"))
                      and isinstance(o.get("assertionId"), str) and o["assertionId"] for o in observations.values())
            visible = visible and len({(o["assertionId"], type(o["asserted"])) for o in observations.values()}) == 1
            blinded = {side: item["asserted"] for side, item in observations.items()} if visible else {}
        self.mapping = dict(zip(("A", "B"), sorted(blinded, key=keyed)))
        self.values = {label: blinded[name] for label, name in self.mapping.items()}
        self.packet = {
            "schemaVersion": SCHEMA, "kind": "blinded-finding-review", "reviewId": review_id,
            "scopeAlias": scope_alias, "question": question,
            "priority": member(priority, {"critical", "high", "medium", "low", "informational", "unknown"},
                               "verification priority"),
            "coverageStates": coverage,
            "options": [{"label": label, "asserted": value} for label, value in self.values.items()],
            "evidence": [{"alias": alias, "summary": cards[alias]} for alias in sorted(cards)],
            "claimScope": "scoped_scalar_only" if visible else "no_blind_scalar_projection",
            "missingOptionMeansFalse": False,
        }
        # Commit to the private mapping even if both public scalar values are equal or omitted.
        mapping_pin = hmac.digest(secret, paired.canonical([review_id, self.row_pin, self.mapping]),
                                  hashlib.sha256).hex()
        self.anchor = {"reportSha256": case["reportSha256"], "policySha256": policy_pin,
                       "packetSha256": digest(self.packet), "mappingCommitment": mapping_pin}

    def actor(self, actor):
        entry = self.reviewers.get(identifier(actor, "actor"))
        require(entry is not None and entry["active"] and actor not in self.producers
                and self.product in entry["products"] and self.family in entry["families"]
                and self.case_id not in entry["conflicts"], "reviewer is not eligible or independent")
        return entry["qualification"]

    def proposal(self, event):
        fields(event, "action decision option basis rationale evidence uncertainty proofSha256", "proposal")
        decision = member(event["decision"], {"supports_option", "neither", "unresolved"}, "decision")
        basis = member(event["basis"], {"human_judgment", "reproducible"}, "basis")
        text(event["rationale"], "rationale")
        text(event["uncertainty"], "uncertainty")
        refs = [identifier(ref, "review evidence alias") for ref in rows(event["evidence"], 32, "references")]
        require(refs and len(set(refs)) == len(refs) and set(refs) <= self.aliases,
                "select distinct scoped evidence aliases")
        if decision == "supports_option":
            member(event["option"], self.mapping, "option")
        else:
            require(event["option"] is None, "a nonselection cannot specify an option")
        if basis == "reproducible":
            require(decision == "supports_option" and self.proof_source is not None,
                    "reproducible decision needs a selected option and an approved independent source")
            hash_value(event["proofSha256"], "proof report")
            if self.agreement is not None:
                require(self.agreement["outcome"] in agreement.ERRORS
                        and digest(self.agreement["proof"]) == event["proofSha256"],
                        "a known shared error and its exact proof are required")
        else:
            require(event["proofSha256"] is None, "human judgment is not reproducible proof")

    def blank(self):
        return {"schemaVersion": SCHEMA, "kind": "private-finding-review-ledger",
                "anchor": self.anchor, "events": []}

    def sealed(self, actor, event, previous):
        contents = {"actor": actor, "qualification": self.actor(actor), "event": event,
                    "previousSha256": previous}
        return {**contents, "eventSha256": digest(contents)}

    def replay(self, ledger, expected_head):
        fields(ledger, "schemaVersion kind anchor events", "private ledger")
        version(ledger, "private ledger")
        require(ledger["kind"] == "private-finding-review-ledger" and same(ledger["anchor"], self.anchor),
                "ledger is not anchored to this review")
        events = rows(ledger["events"], MAX_EVENTS, "ledger events")
        head = digest(self.anchor)
        draft = accepted = None
        disputed = False
        for item in events:
            fields(item, "actor qualification event previousSha256 eventSha256", "ledger event")
            actor, event = item["actor"], item["event"]
            require(same(item, self.sealed(actor, event, head)), "ledger history does not match its hash chain")
            head = item["eventSha256"]
            require(isinstance(event, dict), "invalid transition")
            action = member(event.get("action"), {"propose", "accept", "dispute", "supersede"}, "action")
            if action == "propose":
                self.proposal(event)
                require(draft is None and (accepted is None or disputed), "case is not open for a proposal")
                draft = item
                continue
            fields(event, "action targetSha256 rationale" + (" replacesSha256" if action == "supersede" else ""),
                   "decision event")
            target = hash_value(event["targetSha256"], "decision target")
            text(event["rationale"], "decision rationale")
            if action == "dispute":
                if draft is not None and target == draft["eventSha256"]:
                    draft = None
                elif accepted is not None and target == accepted[0]["eventSha256"] and not disputed:
                    disputed = True
                else:
                    raise ReviewError("dispute target is not an active proposal or accepted label")
                continue
            require(draft is not None and draft["eventSha256"] == target, "approval must target the current proposal")
            require(draft["actor"] != actor, "proposal requires a different independent reviewer")
            if action == "accept":
                require(accepted is None, "existing accepted label requires explicit supersession")
            else:
                require(accepted is not None and disputed and event["replacesSha256"] == accepted[0]["eventSha256"],
                        "supersession must reference the disputed accepted label")
            draft, accepted, disputed = None, (item, draft), False
        require(head == hash_value(expected_head, "trusted ledger head"), "trusted ledger head mismatch")
        return head, accepted, disputed

    def append(self, ledger, expected_head, actor, event):
        head, _, _ = self.replay(ledger, expected_head)
        item = self.sealed(actor, event, head)
        result = {**ledger, "events": [*ledger["events"], item]}
        require(len(paired.canonical(result)) <= paired.MAX_JSON, "ledger exceeds JSON byte budget")
        self.replay(result, item["eventSha256"])
        return result

    def export(self, ledger, expected_head, proof, fixture, checks):
        require(self.agreement is None, "use export-agreement for a shared engine case")
        head, accepted, disputed = self.replay(ledger, expected_head)
        require(self.entry["partition"] == "regression", "only the regression partition may export")
        require(accepted is not None and not disputed, "no active accepted label")
        approval, proposal = accepted
        label = proposal["event"]
        require(label["basis"] == "reproducible" and label["decision"] == "supports_option",
                "accepted judgment is not an automated regression expectation")
        require(digest(proof) == label["proofSha256"], "proof report digest mismatch")
        for key in ("fixtureSha256", "comparisonSha256", "caseId", "product",
                    "inputFingerprints", "approvedCheckBundleSha256"):
            require(isinstance(proof, dict) and same(proof.get(key), self.report[key]),
                    "proof is not linked to the original comparison and inputs")
        side = self.mapping[label["option"]]
        original = self.selected[side]
        checked = selected_rows(proof, self.row_pin)[side]
        for key in ("observation", "identity", "family", "scopeKey", "comparison",
                    "baselineCoverage", "candidateCoverage"):
            require(same(checked[key], original[key]), "proof changed the scoped observation")
        observation = original["observation"]["semantics"]
        asserted, assertion_id = observation["asserted"], observation["assertionId"]
        attempts = checked["attempts"]
        require(checked["verdict"] == "supported" and checked.get("assertionId") == assertion_id
                and attempts and isinstance(attempts[-1], dict), "proof did not support the exact assertion")
        attempt = attempts[-1]
        require(attempt.get("status") == "completed" and same(attempt.get("observed"), asserted)
                and same(attempt.get("source"), self.proof_source), "proof lacks a completed approved check")
        paired.validate_fixture(fixture)
        require(digest(fixture) == self.report["fixtureSha256"]
                and same({key: digest(fixture[key]) for key in FINGERPRINTS}, self.report["inputFingerprints"])
                and fixture["caseId"] == self.case_id and fixture["product"] == self.product,
                "fixture does not reproduce the pinned inputs")
        require(digest(checks) == self.report["approvedCheckBundleSha256"], "proof check bundle digest mismatch")
        fields(checks, "schemaVersion fixtureSha256 checks", "verification check bundle")
        version(checks, "verification check bundle")
        require(checks["fixtureSha256"] == self.report["fixtureSha256"], "check bundle uses a different fixture")
        check = unique_match(checks["checks"], "checkId", attempt.get("checkId"), original, "approved check")
        fields(check, "checkId version family scopeKey identity assertionId valueType oracle factId source",
               "approved check")
        validate_source(check.get("source"))
        pairs = {"identity": original["identity"], "assertionId": assertion_id,
                 "valueType": "boolean" if type(asserted) is bool else "integer", "source": self.proof_source,
                 "version": attempt.get("checkVersion"), "factId": attempt.get("factId"),
                 "oracle": attempt.get("oracle")}
        require(all(same(check.get(key), value) for key, value in pairs.items()), "approved check does not cover claim")
        fact = unique_match(fixture["evidence"].get("verificationFacts"), "factId",
                            check["factId"], original, "independent evidence")
        fields(fact, "family scopeKey factId status value references", "independent evidence")
        refs = rows(fact.get("references"), 64, "proof references")
        require(fact.get("status") == "complete" and refs
                and all(text(ref, "proof reference") for ref in refs)
                and len(set(refs)) == len(refs) and same(sorted(refs), attempt.get("evidenceReferences")),
                "proof evidence is not complete and scoped")
        observed = fact.get("value")
        if check["oracle"] == "count_distinct":
            items = rows(observed, 1024, "distinct-count evidence")
            observed = len({text(item, "set member") for item in items})
        else:
            require(check["oracle"] == "read_scalar", "unsupported regression replay oracle")
        require(same(observed, asserted), "independent evidence did not reproduce the accepted expectation")
        return {
            "schemaVersion": SCHEMA, "kind": "adjudicated-finding-regression",
            "regressionId": "fnd080-" + digest([self.row_pin, approval["eventSha256"]]),
            "corpusVersion": self.corpus["corpusVersion"], "corpusSha256": digest(self.corpus),
            "dataClass": "reviewed_synthetic", "caseId": self.case_id,
            "fixtureSha256": digest(fixture), "comparisonSha256": self.report["comparisonSha256"],
            "comparisonRowSha256": self.row_pin, "proofSha256": label["proofSha256"],
            "checkBundleSha256": digest(checks), "ledgerHeadSha256": head,
            "approvalSha256": approval["eventSha256"], "expected": {
                "family": original["family"], "scopeKey": original["scopeKey"],
                "identity": original["identity"], "assertionId": assertion_id, "asserted": asserted,
            },
            "checkId": check["checkId"], "evidenceReferences": sorted(refs),
        }

    def export_agreement(self, ledger, expected_head, fixture, plan, baseline, candidate, checks, manifest,
                         *, original=None):
        """Replay the exact independently checked shared error before exporting it."""
        row = self.agreement
        require(row is not None and row["outcome"] in agreement.ERRORS,
                "unknown or unproven agreement cannot become a regression")
        head, accepted, disputed = self.replay(ledger, expected_head)
        require(self.entry["partition"] == "regression", "only the regression partition may export")
        require(accepted is not None and not disputed, "no active accepted label")
        approval, proposal = accepted
        label = proposal["event"]
        proof = row["proof"]
        require(label["basis"] == "reproducible" and label["decision"] == "supports_option"
                and digest(proof) == label["proofSha256"] and same(self.values[label["option"]], proof["expected"])
                and same(proof["source"], self.proof_source), "decision did not select the approved exact proof")
        replayed = agreement.sample(fixture, plan, baseline, candidate, checks, manifest,
                                    self.report["manifestSha256"], original=original)
        for key in ("caseId", "product", "fixtureSha256", "comparisonSha256", "inputFingerprints", "checkBundleSha256"):
            require(same(replayed[key], self.report[key]), "agreement inputs differ from the trusted report")
        require(same(agreement_row(replayed, self.row_pin), row), "agreement proof was not reproduced")
        target = row["target"]
        absent = target["form"] == "positive_boolean_finding" and proof["expected"] is False
        return {
            "schemaVersion": SCHEMA, "kind": "adjudicated-finding-regression", "dataClass": "reviewed_synthetic",
            "regressionId": "fnd082-" + digest([self.row_pin, approval["eventSha256"]]),
            "corpusVersion": self.corpus["corpusVersion"], "corpusSha256": digest(self.corpus), "caseId": self.case_id,
            "product": self.product, "evidenceOrigin": "independent_engine_agreement", "severity": target["severity"],
            "fixtureSha256": replayed["fixtureSha256"], "comparisonSha256": replayed["comparisonSha256"],
            "comparisonRowSha256": self.row_pin, "proofSha256": label["proofSha256"],
            "checkBundleSha256": replayed["checkBundleSha256"], "ledgerHeadSha256": head,
            "approvalSha256": approval["eventSha256"], "expectationMode": "no_finding" if absent else "emitted_assertion",
            "expected": {**{key: target[key] for key in ("family", "scopeKey", "identity", "assertionId")},
                         "asserted": None if absent else proof["expected"]},
            "checkId": proof["checkId"], "evidenceReferences": proof["references"],
        }


def validate_source(source):
    fields(source, "id revision locator", "proof source")
    text(source["id"], "source ID")
    text(source["locator"], "source locator")
    require(valid_string(source["revision"], DIGEST) or valid_string(source["revision"], paired.REVISION),
            "proof source requires immutable revision")


def unique_match(items, key, value, scope, label):
    text(value, label + " ID")
    matches = [item for item in rows(items, 4096, label) if isinstance(item, dict)
               and item.get(key) == value and all(item.get(k) == scope[k] for k in ("family", "scopeKey"))]
    require(len(matches) == 1, label + " must match exactly one record in scope")
    return matches[0]


def authorize_regression(regression, pin, active_head):
    require(digest(regression) == hash_value(pin, "regression digest"), "regression digest mismatch")
    version(regression, "regression")
    require(regression.get("kind") == "adjudicated-finding-regression"
            and regression.get("dataClass") == "reviewed_synthetic", "expected a synthetic regression export")
    require(regression.get("ledgerHeadSha256") == hash_value(active_head, "trusted active ledger head"),
            "regression export is stale for the trusted active ledger head")
    expected = fields(regression.get("expected"), "family scopeKey identity assertionId asserted", "expectation")
    is_agreement = regression.get("evidenceOrigin") == "independent_engine_agreement"
    if is_agreement:
        member(regression.get("severity"), agreement.SEVERITIES, "agreement severity")
        mode = member(regression.get("expectationMode"), {"no_finding", "emitted_assertion"}, "expectation mode")
        valid = (expected["asserted"] is None if mode == "no_finding" else
                 any(agreement.exact_type(expected["asserted"], kind) for kind in agreement.TYPES))
    else:
        require("expectationMode" not in regression, "unexpected agreement expectation mode")
        valid = scalar(expected["asserted"])
    require(valid, "invalid expected scalar or confirmed absence")
    return expected, is_agreement


def promotion_handoff(regression, pin, active_head):
    expected, is_agreement = authorize_regression(regression, pin, active_head)
    require(is_agreement, "a shared-error adjudication export is required")
    absent = regression["expectationMode"] == "no_finding"
    label = {**{key: expected[key] for key in ("family", "scopeKey", "identity")},
             "severity": regression["severity"], "evidenceSha256": pin,
             "truth": "independent_corpus" if absent else "accepted_adjudication",
             "activeHeadSha256": None if absent else active_head,
             "expected": None if absent else {key: expected[key] for key in ("assertionId", "asserted")}}
    return {"schemaVersion": 1, "kind": "approved-engine-agreement-handoff", "promotionAuthorized": False,
            "requiresIndependentCohortApproval": True, "sourceLedgerHeadSha256": active_head,
            **{key: regression[key] for key in ("product", "caseId", "fixtureSha256")},
            "label": label, "adjudications": [] if absent else [regression]}


def check_regression(regression, pin, active_head, fixture, plan, receipt):
    """Check an approved exact expectation against a new, pinned candidate receipt."""
    expected, is_agreement = authorize_regression(regression, pin, active_head)
    fixture_hash = digest(fixture)
    partitions = paired.validate_fixture(fixture)
    require(regression.get("fixtureSha256") == fixture_hash and regression.get("caseId") == fixture["caseId"],
            "regression fixture does not match its pin")
    paired.validate_plan(plan, fixture_hash)
    coverage, findings = paired.validate_receipt(receipt, fixture_hash, plan["candidate"], partitions, "candidate")
    require(not is_agreement or regression["product"] == fixture["product"], "regression product mismatch")
    scope = (text(expected["family"], "family"), text(expected["scopeKey"], "scope"))
    identity = text(expected["identity"], "finding identity")
    assertion = text(expected["assertionId"], "assertion ID")
    scoped_coverage = coverage.get(scope, {})
    require(scope in partitions and scoped_coverage.get("status") == "complete"
            and scoped_coverage.get("identityScheme") == partitions[scope], "candidate coverage is incomplete")
    matches = [row for row in findings[scope] if row["identity"] == identity]
    if is_agreement and regression["expectationMode"] == "no_finding":
        require(not matches and all(row["identity"] is not None for row in findings[scope]),
                "candidate did not demonstrate the adjudicated absence")
    else:
        require(len(matches) == 1 and matches[0]["semantics"].get("assertionId") == assertion
                and same(matches[0]["semantics"].get("asserted"), expected["asserted"])
                and (not is_agreement or matches[0]["semantics"].get("severity") == regression["severity"]),
                "candidate did not reproduce the adjudicated expectation")
    return {"schemaVersion": SCHEMA, "regressionId": identifier(regression.get("regressionId"), "regression ID"),
            "regressionSha256": pin, "receiptSha256": digest(receipt), "status": "passed"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    private = argparse.ArgumentParser(add_help=False)
    for option in ("report", "policy", "secret-file"):
        private.add_argument("--" + option, type=Path, required=True)
    private.add_argument("--policy-sha256", required=True)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("packet", parents=[private], help="write the blinded reviewer packet")
    commands.add_parser("genesis", parents=[private], help="print the private initial ledger head")
    append = commands.add_parser("append", parents=[private], help="write the next complete private ledger")
    append.add_argument("--ledger", type=Path)
    append.add_argument("--head", required=True, help="prior head from trusted private storage")
    append.add_argument("--actor", required=True)
    append.add_argument("--event", type=Path, required=True)
    export = commands.add_parser("export", parents=[private], help="write a versioned synthetic expectation")
    for option in ("ledger", "proof", "fixture", "checks"):
        export.add_argument("--" + option, type=Path, required=True)
    export.add_argument("--head", required=True, help="current head from trusted private storage")
    shared = commands.add_parser("export-agreement", parents=[private], help="replay and export a shared error")
    for option in ("ledger", "fixture", "plan", "baseline", "candidate", "checks", "manifest"):
        shared.add_argument("--" + option, type=Path, required=True)
    shared.add_argument("--head", required=True, help="current head from trusted private storage")
    shared.add_argument("--comparison", type=Path)
    check = commands.add_parser("check-regression", help="compare an approved expectation to a candidate receipt")
    for option in ("regression", "fixture", "plan", "receipt"):
        check.add_argument("--" + option, type=Path, required=True)
    check.add_argument("--regression-sha256", required=True)
    check.add_argument("--active-head", required=True, help="latest authorized ledger head from the case custodian")
    promote = commands.add_parser("promotion-handoff", help="prepare a scoped FND-081 cohort proposal")
    promote.add_argument("--regression", type=Path, required=True)
    promote.add_argument("--regression-sha256", required=True)
    promote.add_argument("--active-head", required=True)
    args = parser.parse_args()
    try:
        if args.command == "check-regression":
            value = check_regression(paired.read(args.regression), args.regression_sha256, args.active_head,
                                     paired.read(args.fixture), paired.read(args.plan), paired.read(args.receipt))
            print(json.dumps(value, indent=2, sort_keys=True, allow_nan=False))
            return 0
        if args.command == "promotion-handoff":
            value = promotion_handoff(paired.read(args.regression), args.regression_sha256, args.active_head)
            print(json.dumps(value, indent=2, sort_keys=True, allow_nan=False))
            return 0
        with args.secret_file.open("rb") as handle:
            secret = handle.read(67).decode("ascii").strip()
        hash_value(secret, "private blinding key")
        review = Review(paired.read(args.report), paired.read(args.policy),
                        args.policy_sha256, bytes.fromhex(secret))
        if args.command == "packet":
            value = review.packet
        elif args.command == "genesis":
            value = {"headSha256": digest(review.anchor)}
        elif args.command == "append":
            ledger = paired.read(args.ledger) if args.ledger is not None else review.blank()
            value = review.append(ledger, args.head, args.actor, paired.read(args.event))
        elif args.command == "export-agreement":
            read = paired.read
            original = read(args.comparison) if args.comparison is not None else None
            value = review.export_agreement(read(args.ledger), args.head, *(
                read(getattr(args, option)) for option in ("fixture", "plan", "baseline", "candidate", "checks", "manifest")
            ), original=original)
        else:
            value = review.export(paired.read(args.ledger), args.head, paired.read(args.proof),
                                  paired.read(args.fixture), paired.read(args.checks))
        print(json.dumps(value, indent=2, sort_keys=True, allow_nan=False))
    except (OSError, ValueError, RecursionError) as error:
        print(f"review rejected: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
