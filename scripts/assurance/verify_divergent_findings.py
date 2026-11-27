#!/usr/bin/env python3
"""FND-079 deterministic verification of scoped claims in FND-078 comparisons."""

import argparse
from collections import Counter, defaultdict
from collections.abc import Callable
from dataclasses import dataclass
from enum import Enum
import json
from pathlib import Path
import sys
import time

import paired_engine_evaluation as paired

MAX_CHECKS = 512
MAX_FACTS = 4096
MAX_ITEMS = 1024
MAX_WORK = MAX_CHECKS * (MAX_ITEMS + 2)
MAX_DEADLINE_MS = 10000
SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3, "informational": 4}
VERDICTS = ("supported", "refuted", "inconclusive", "not_testable")
VALUE_TYPES = {"boolean": bool, "integer": int, "string": str}


class Oracle(Enum):
    SCALAR = "read_scalar"
    DISTINCT_COUNT = "count_distinct"

    @property
    def base_cost(self):
        return 1 if self is Oracle.SCALAR else 2


class InputError(ValueError):
    """Untrusted or incompatible verification input."""


@dataclass(frozen=True)
class Check:
    key: str
    version: str
    oracle: Oracle
    fact_id: str
    source: dict


@dataclass(frozen=True)
class Fact:
    status: str
    value: object
    references: tuple[str, ...]


@dataclass(frozen=True)
class Limits:
    checks: int = 64
    work: int = 4096
    deadline_ms: int = 1500

    def __post_init__(self):
        for name, n, minimum, maximum in (
            ("checks", self.checks, 0, MAX_CHECKS),
            ("work", self.work, 0, MAX_WORK),
            ("deadline_ms", self.deadline_ms, 1, MAX_DEADLINE_MS),
        ):
            if type(n) is not int or not minimum <= n <= maximum:
                raise InputError(f"{name} must be between {minimum} and {maximum}")


@dataclass
class Budget:
    limits: Limits
    deadline: float
    clock: Callable[[], float]
    checks: int = 0
    work: int = 0

    def reserve(self, cost):
        if self.expired():
            return "deadline_exceeded"
        if self.checks >= self.limits.checks or self.work + cost > self.limits.work:
            return "budget_exhausted"
        self.checks += 1
        self.work += cost
        return None

    def expired(self):
        return self.clock() >= self.deadline


def _fields(row, names, label):
    if not isinstance(row, dict) or set(row) != set(names.split()):
        raise InputError(f"{label}: invalid fields")


def _text(value, label):
    if (not isinstance(value, str) or not 0 < len(value) <= 512 or value != value.strip()
            or any(ord(c) < 32 or ord(c) == 127 or 0xD800 <= ord(c) <= 0xDFFF for c in value)):
        raise InputError(f"{label}: invalid text")
    return value


def _rows(value, cap, label):
    if not isinstance(value, list) or len(value) > cap:
        raise InputError(f"{label}: invalid or oversized list")
    return value


def _scope(row, partitions, label):
    key = (_text(row["family"], label + " family"), _text(row["scopeKey"], label + " scope"))
    if key not in partitions:
        raise InputError(f"{label}: undeclared comparison partition")
    return key


def _checks(bundle, approved_digest, fixture_hash, partitions):
    if not isinstance(approved_digest, str) or not paired.DIGEST.fullmatch(approved_digest):
        raise InputError("expected a reviewed check-bundle sha256")
    if paired.sha(paired.canonical(bundle)) != approved_digest:
        raise InputError("check bundle differs from the reviewed pin")
    _fields(bundle, "schemaVersion fixtureSha256 checks", "check bundle")
    if type(bundle["schemaVersion"]) is not int or bundle["schemaVersion"] != 1:
        raise InputError("check bundle: unsupported schemaVersion")
    if bundle["fixtureSha256"] != fixture_hash:
        raise InputError("check bundle does not bind the paired input")
    index, seen = defaultdict(list), set()
    for row in _rows(bundle["checks"], MAX_CHECKS, "checks"):
        _fields(row, "checkId version family scopeKey identity assertionId valueType oracle factId source", "check")
        key = _text(row["checkId"], "check ID")
        if key in seen:
            raise InputError("duplicate check ID")
        seen.add(key)
        scope = _scope(row, partitions, "check")
        identity = _text(row["identity"], "check identity")
        if partitions[scope] == "archlucid-finding-v2" and not paired.CANONICAL_KEY.fullmatch(identity):
            raise InputError("check identity is not a canonical finding key")
        assertion_id = _text(row["assertionId"], "assertion ID")
        value_type = _text(row["valueType"], "assertion type")
        if value_type not in VALUE_TYPES:
            raise InputError("unsupported assertion type")
        try:
            oracle = Oracle(row["oracle"])
        except (TypeError, ValueError) as error:
            raise InputError("unsupported deterministic oracle") from error
        if oracle is Oracle.DISTINCT_COUNT and value_type != "integer":
            raise InputError("count oracle requires an integer claim")
        source = row["source"]
        _fields(source, "id revision locator", "independent check source")
        for field in ("id", "revision", "locator"):
            _text(source[field], "independent check source " + field)
        if not (paired.REVISION.fullmatch(source["revision"]) or paired.DIGEST.fullmatch(source["revision"])):
            raise InputError("independent check source requires an immutable pin")
        group = (*scope, identity, assertion_id, value_type)
        index[group].append(Check(key, _text(row["version"], "check version"), oracle,
                                  _text(row["factId"], "fact ID"), source))
    return index


def _facts(evidence, partitions):
    result = {}
    for row in _rows(evidence.get("verificationFacts", []), MAX_FACTS, "facts"):
        _fields(row, "family scopeKey factId status value references", "independent fact")
        scope = _scope(row, partitions, "fact")
        key = (*scope, _text(row["factId"], "fact ID"))
        if key in result:
            raise InputError("duplicate independent fact in scope")
        status = _text(row["status"], "fact status")
        if status not in paired.STATES:
            raise InputError("unknown fact coverage status")
        refs = tuple(sorted(_text(ref, "independent evidence reference")
                            for ref in _rows(row["references"], 64, "evidence references")))
        if status == "complete" and not refs:
            raise InputError("complete evidence requires references")
        if len(refs) != len(set(refs)):
            raise InputError("duplicate independent evidence references")
        result[key] = Fact(status, row["value"], refs)
    return result


def _comparison(fixture, plan, baseline, candidate, original):
    regenerated = paired.compare(fixture, plan, baseline, candidate)
    if original is None:
        return regenerated, "recomputed"
    # A receipt replay does not attest what the original runner observed about executable
    # digests. Preserve that original value for linkage, but never rely on it for a verdict.
    if not isinstance(original, dict) or not isinstance(original.get("runs"), dict):
        raise InputError("comparison report is not a FND-078 report")
    for role in paired.ROLES:
        run = original["runs"].get(role)
        if not isinstance(run, dict) or type(run.get("adapterDigestVerifiedByRunner")) is not bool:
            raise InputError("invalid comparison runner metadata")
        regenerated["runs"][role]["adapterDigestVerifiedByRunner"] = run["adapterDigestVerifiedByRunner"]
    if paired.canonical(regenerated) != paired.canonical(original):
        raise InputError("comparison report differs from the validated receipts")
    return original, "matched_supplied_report"


def _claims(report):
    requests = []
    for section in report["partitions"]:
        scope = {"family": section["family"], "scopeKey": section["scopeKey"]}
        for outcome in section["outcomes"]:
            kind = outcome["classification"]
            if kind == "agreed":
                continue
            exact = {**scope, "identity": outcome["identity"], "comparison": kind,
                     "comparisonReason": outcome["reason"],
                     "baselineCoverage": section["baselineCoverage"],
                     "candidateCoverage": section["candidateCoverage"],
                     "comparisonRowSha256": paired.sha(paired.canonical({**scope, **outcome}))}
            if kind == "incomparable":
                requests.append({**exact, "side": None, "observation": None, "priority": "unknown"})
                continue
            observations = [(side, row) for side in paired.ROLES for row in outcome[side]]
            severities = [row["semantics"].get("severity") for _, row in observations]
            priority = min((s for s in severities if isinstance(s, str) and s in SEVERITY_RANK),
                           key=SEVERITY_RANK.__getitem__, default="unknown")
            requests.extend({**exact, "side": side, "observation": row, "priority": priority}
                            for side, row in observations)
    return sorted(requests, key=lambda row: (
        SEVERITY_RANK.get(row["priority"], len(SEVERITY_RANK)),
        row["family"], row["scopeKey"], row["identity"] or "",
        row["comparisonRowSha256"], row["side"] or "",
    ))


def _work(check, fact):
    if check.oracle is Oracle.DISTINCT_COUNT and fact is not None and fact.status == "complete":
        value = fact.value
        if isinstance(value, list) and len(value) <= MAX_ITEMS:
            return check.oracle.base_cost + len(value)
    return check.oracle.base_cost


def _observe(check, fact, expected_type):
    if fact is None:
        return None, "evidence_missing"
    if fact.status != "complete":
        return None, "evidence_incomplete"
    value = fact.value
    if check.oracle is Oracle.DISTINCT_COUNT:
        if not isinstance(value, list) or len(value) > MAX_ITEMS:
            return None, "unsupported_evidence_shape"
        for item in value:
            _text(item, "independent set-member identity")
        return len(set(value)), None
    if type(value) is not expected_type:
        return None, "evidence_type_mismatch"
    if type(value) is str:
        _text(value, "independent scalar string")
    return value, None


def _outcome(request, checks, facts, budget):
    result = {**request, "attempts": []}
    if request["comparison"] == "incomparable":
        return {**result, "verdict": "inconclusive", "reason": request["comparisonReason"]}
    semantics = request["observation"]["semantics"]
    assertion_id, asserted = semantics.get("assertionId"), semantics.get("asserted")
    kind = next((name for name, t in VALUE_TYPES.items() if type(asserted) is t), None)
    if not isinstance(assertion_id, str) or not kind:
        return {**result, "verdict": "not_testable", "reason": "unsupported_assertion_projection"}
    if kind == "string":
        try:
            _text(asserted, "asserted string")
        except InputError:
            return {**result, "verdict": "not_testable", "reason": "unsupported_assertion_projection"}
    scope = (request["family"], request["scopeKey"])
    group = (*scope, request["identity"], assertion_id, kind)
    applicable = checks.get(group, ())
    if not applicable:
        return {**result, "verdict": "not_testable", "reason": "no_approved_check_for_claim"}
    choices = [(check, facts.get((*scope, check.fact_id))) for check in applicable]
    missing_reasons = []
    for check, fact in sorted(choices, key=lambda p: (_work(*p), p[0].key)):
        attempt = {"checkId": check.key, "checkVersion": check.version, "oracle": check.oracle.value,
                   "source": check.source, "factId": check.fact_id,
                   "evidenceReferences": list(fact.references) if fact else []}
        if fact is None or fact.status != "complete":
            reason = "evidence_missing" if fact is None else "evidence_incomplete"
            missing_reasons.append(reason)
            result["attempts"].append({**attempt, "status": reason, "work": 0})
            continue
        cost = _work(check, fact)
        blocked = budget.reserve(cost)
        if blocked:
            return {**result, "verdict": "inconclusive", "reason": blocked}
        attempt["work"] = cost
        try:
            observed, reason = _observe(check, fact, VALUE_TYPES[kind])
        except TimeoutError:
            observed, reason = None, "deadline_exceeded"
        except (TypeError, ValueError):
            observed, reason = None, "check_failed"
        if budget.expired() or reason == "deadline_exceeded":
            result["attempts"].append({**attempt, "status": "deadline_exceeded"})
            return {**result, "verdict": "inconclusive", "reason": "deadline_exceeded"}
        if reason is not None:
            missing_reasons.append(reason)
            result["attempts"].append({**attempt, "status": reason})
            continue
        result["attempts"].append({**attempt, "status": "completed", "observed": observed})
        return {**result, "verdict": "supported" if observed == asserted else "refuted",
                "reason": "verified_exact_assertion", "assertionId": assertion_id}
    reason = missing_reasons[0] if len(set(missing_reasons)) == 1 else "applicable_checks_inconclusive"
    return {**result, "verdict": "inconclusive", "reason": reason}


def verify(fixture, plan, baseline, candidate, bundle, approved_digest, *, original=None, limits=None, clock=None):
    clock = time.monotonic if clock is None else clock
    limits = Limits() if limits is None else limits
    partitions = paired.validate_fixture(fixture)
    comparison, origin = _comparison(fixture, plan, baseline, candidate, original)
    checks = _checks(bundle, approved_digest, comparison["fixtureSha256"], partitions)
    facts = _facts(fixture["evidence"], partitions)
    requests = _claims(comparison)
    budget = Budget(limits, clock() + limits.deadline_ms / 1000, clock)
    outcomes = [_outcome(req, checks, facts, budget) for req in requests]
    counts = Counter(row["verdict"] for row in outcomes)
    return {
        "schemaVersion": 1, "kind": "divergent-finding-verification", "product": comparison["product"],
        "caseId": comparison["caseId"], "cohortVersion": comparison["cohortVersion"],
        "comparisonSha256": paired.sha(paired.canonical(comparison)), "comparisonOrigin": origin,
        "fixtureSha256": comparison["fixtureSha256"], "inputFingerprints": comparison["inputFingerprints"],
        "comparisonRuns": comparison["runs"], "approvedCheckBundleSha256": approved_digest,
        "budget": {"maxChecks": limits.checks, "maxWork": limits.work, "deadlineMs": limits.deadline_ms,
                   "checksUsed": budget.checks, "workUsed": budget.work},
        "counts": {key: counts[key] for key in VERDICTS},
        "results": outcomes,
        "unresolvedClaimRows": counts["inconclusive"] + counts["not_testable"],
        "agreementSampled": False, "upstreamAdapterDigestFlagsReverified": False,
        "scopeOfVerdicts": "declared_scalar_assertions_only",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ("fixture", "plan", "baseline", "candidate", "checks"):
        parser.add_argument("--" + argument, type=Path, required=True)
    parser.add_argument("--comparison", type=Path,
                        help="optional original FND-078 report for exact linkage; otherwise recompute")
    parser.add_argument("--checks-sha256", required=True, help="reviewed canonical check-bundle digest")
    parser.add_argument("--max-checks", type=int, default=64)
    parser.add_argument("--max-work", type=int, default=4096)
    parser.add_argument("--deadline-ms", type=int, default=1500)
    args = parser.parse_args()
    try:
        result = verify(*(paired.read(getattr(args, key)) for key in
                          ("fixture", "plan", "baseline", "candidate", "checks")),
                        args.checks_sha256, original=paired.read(args.comparison) if args.comparison else None,
                        limits=Limits(args.max_checks, args.max_work, args.deadline_ms))
        print(json.dumps(result, sort_keys=True, indent=2, ensure_ascii=True, allow_nan=False))
        return 0
    except (InputError, paired.EvaluationError, OSError, RecursionError) as error:
        print(f"divergent finding verification: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
