#!/usr/bin/env python3
"""FND-086 shadow verification on pinned, synthetic dependency domains."""

import argparse
from collections import defaultdict, deque
import json
from pathlib import Path
import re
import sys

import paired_engine_evaluation as paired

IDENTIFIER = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}")
FAMILY = "synthetic-topology"
SCHEME = "authoritative-source-v1"
ASSERTION = "directed-reachability"
MAX_DOMAINS = 16
MAX_VERTICES = 64
MAX_EDGES = 512
MAX_QUERIES = 128
MAX_CONTROLS = 128
MAX_EDGE_CONDITIONS = 16
AFTER_INPUTS = ("captureVersion", "collectorVersion", "engineRevision", "policyVersion", "configurationVersion",
                "collectionComplete")


def require(test, reason):
    if not test:
        raise paired.EvaluationError(reason)


def digest(value):
    return paired.sha(paired.canonical(value))


def exact(value, pin, label):
    require(isinstance(pin, str) and paired.DIGEST.fullmatch(pin) and digest(value) == pin,
            label + " digest mismatch")


def fields(value, names, label):
    return paired._object(value, names.split(), label)


def seq(value, count, label):
    return paired._rows(value, count, label)


def token(value, label):
    require(isinstance(value, str) and IDENTIFIER.fullmatch(value), label + " invalid identifier")
    return value


def listed(value, count, label):
    result = [token(item, label) for item in seq(value, count, label)]
    require(len(result) == len(set(result)), label + " duplicate identity")
    return sorted(result)


def snapshot(value):
    fields(value, "captureId scopeId captureVersion collectorVersion engineRevision policyVersion configurationVersion "
           "collectionComplete domains",
           "snapshot")
    for key in ("captureId", "scopeId", "captureVersion", "collectorVersion", "policyVersion", "configurationVersion"):
        token(value[key], key)
    require(isinstance(value["engineRevision"], str) and paired.REVISION.fullmatch(value["engineRevision"]),
            "engine revision must be immutable")
    require(type(value["collectionComplete"]) is bool, "capture completeness must be explicit")
    domains = {}
    for row in seq(value["domains"], MAX_DOMAINS, "domains"):
        fields(row, "id complete vertices enabledControls edges", "domain")
        domain_id = token(row["id"], "domain")
        require(domain_id not in domains and type(row["complete"]) is bool, "invalid or duplicate domain")
        vertices = listed(row["vertices"], MAX_VERTICES, "vertex")
        known_vertices = set(vertices)
        enabled = listed(row["enabledControls"], MAX_CONTROLS, "control")
        edges = {}
        for edge in seq(row["edges"], MAX_EDGES, "edges"):
            fields(edge, "id from to requires", "edge")
            edge_id, source, target = (token(edge[key], key) for key in ("id", "from", "to"))
            require(edge_id not in edges and source in known_vertices and target in known_vertices,
                    "duplicate edge or endpoint outside its registered domain")
            edges[edge_id] = (source, target, listed(edge["requires"], MAX_EDGE_CONDITIONS, "edge condition"))
        domains[domain_id] = {"complete": row["complete"], "vertices": vertices,
                              "enabledControls": enabled, "edges": edges}
    return {**{key: value[key] for key in (*AFTER_INPUTS, "captureId", "scopeId")}, "domains": domains}


def load_case(case, pin):
    exact(case, pin, "case")
    fields(case, "schemaVersion dataClass product caseId before after queries", "case")
    paired._version(case["schemaVersion"], "case")
    require(case["dataClass"] == "reviewed_synthetic" and isinstance(case["product"], str)
            and case["product"] in paired.PRODUCTS, "only reviewed synthetic product fixtures are accepted")
    token(case["caseId"], "case ID")
    before, after = (snapshot(case[key]) for key in ("before", "after"))
    require(before["scopeId"] == after["scopeId"], "cross-scope reuse is not permitted")
    require(before["captureId"] != after["captureId"], "snapshots must be separately identified")
    queries = {}
    for row in seq(case["queries"], MAX_QUERIES, "queries"):
        fields(row, "id domain from to", "query")
        for key, value in row.items():
            token(value, key)
        require(row["id"] not in queries, "duplicate query")
        queries[row["id"]] = row
    require(queries, "at least one explicit query is required")
    return before, after, queries


def complete(capture, domain_id):
    domain = capture["domains"].get(domain_id)
    return capture["collectionComplete"] and domain is not None and domain["complete"]


def domain_pin(capture, query):
    return digest({"scopeId": capture["scopeId"], "contract": {key: capture[key] for key in AFTER_INPUTS},
                   "query": query, "domain": capture["domains"].get(query["domain"])})


def dependency_changes(before, after, domain_id):
    """Use complete domain membership, including inactive edges and absent targets."""
    left, right = (capture["domains"].get(domain_id) for capture in (before, after))
    changed = [key for key in AFTER_INPUTS if before[key] != after[key]]
    if left is None or right is None:
        return changed + ["domain_unavailable"]
    if left["complete"] != right["complete"]:
        changed.append("domain_completeness")
    for key in ("vertices", "edges"):
        a, b = left[key], right[key]
        if a != b:
            changed.extend(name for name, test in (
                (key + "_added", set(b) - set(a)), (key + "_removed", set(a) - set(b)),
                (key + "_changed", isinstance(a, dict) and any(a[e] != b[e] for e in a.keys() & b.keys())),
            ) if test)
    if left["enabledControls"] != right["enabledControls"]:
        changed.append("control_state_changed")
    return changed


def walk(capture, query):
    if not complete(capture, query["domain"]):
        return None
    world = capture["domains"][query["domain"]]
    universe, controls = set(world["vertices"]), set(world["enabledControls"])
    start, end = query["from"], query["to"]
    if start not in universe or end not in universe:
        return False
    adjacent = defaultdict(list)
    for src, dst, requires in world["edges"].values():
        if controls.issuperset(requires):
            adjacent[src].append(dst)
    pending, visited = deque([start]), {start}
    while pending:
        current = pending.popleft()
        if current == end:
            return True
        for dst in adjacent[current]:
            if dst not in visited:
                pending.append(dst)
                visited.add(dst)
    return False


def reference(capture, query):
    """Independent bounded transitive closure. It does not use walk or its adjacency index."""
    world = capture["domains"].get(query["domain"])
    if not capture["collectionComplete"] or world is None or not world["complete"]:
        return None
    vertices = world["vertices"]
    indices = {vertex: index for index, vertex in enumerate(vertices)}
    if query["from"] not in indices or query["to"] not in indices:
        return False
    relation = [1 << index for index in range(len(vertices))]
    allowed = frozenset(world["enabledControls"])
    for start, end, conditions in world["edges"].values():
        if all(condition in allowed for condition in conditions):
            relation[indices[start]] |= 1 << indices[end]
    for middle in range(len(vertices)):
        mask = 1 << middle
        for start in range(len(vertices)):
            if relation[start] & mask:
                relation[start] |= relation[middle]
    return bool(relation[indices[query["from"]]] & (1 << indices[query["to"]]))


def pair_documents(case, before, after, queries):
    fixture = {"schemaVersion": 1, "product": case["product"], "caseId": case["caseId"],
               "cohortVersion": "fnd086-synthetic-v1",
               "partitions": [{"family": FAMILY, "scopeKey": key, "identityScheme": SCHEME} for key in sorted(queries)],
               "evidence": {"prior": before, "target": after},
               "scope": {"scopeId": after["scopeId"], "queries": queries},
               "policy": {"target": after["policyVersion"]},
               "configuration": {"engine": after["engineRevision"], "version": after["configurationVersion"],
                                 "dataClass": case["dataClass"]}}
    plan = {"schemaVersion": 1, "fixtureSha256": digest(fixture)}
    for role, mode in (("baseline", "full"), ("candidate", "incremental")):
        plan[role] = {"id": "synthetic-" + mode, "revision": after["engineRevision"],
                      "model": None, "promptVersion": None, "adapterSha256": digest(["fnd086-model-v1", mode])}
    return fixture, plan


def receipt(plan, role, values, after, queries):
    coverage, findings = [], []
    for key, value in sorted(values.items()):
        complete_query = value is not None
        coverage.append({"family": FAMILY, "scopeKey": key, "status": "complete" if complete_query else "partial",
                         "reason": None if complete_query else "synthetic_collection_incomplete", "identityScheme": SCHEME})
        if value is True:
            findings.append({"family": FAMILY, "scopeKey": key, "identity": key,
                             "sourceId": "synthetic-" + key,
                             "semantics": {"assertionId": ASSERTION, "asserted": True},
                             "provenance": [domain_pin(after, queries[key])]})
    return {"schemaVersion": 1, "fixtureSha256": plan["fixtureSha256"], "engine": plan[role],
            "coverage": coverage, "findings": findings}


def plan_incremental(before, after, queries):
    rows, values = {}, {}
    for key, query in sorted(queries.items()):
        domain = query["domain"]
        changed = dependency_changes(before, after, domain)
        prior_pin, target_pin = (domain_pin(capture, query) for capture in (before, after))
        # Warm cache only from A. An empty result is not usable if A was incomplete.
        prior_result = walk(before, query)
        if not complete(after, domain):
            action, value = "target_incomplete", None
        elif prior_result is None or prior_pin != target_pin:
            action, value = "recompute_complete_domain", walk(after, query)
        else:
            action, value = "reuse_exact_complete_domain", prior_result
        rows[key] = {"action": action, "changedDependencies": changed, "priorDomainSha256": prior_pin,
                     "targetDomainSha256": target_pin, "priorComplete": prior_result is not None}
        values[key] = value
    return rows, values


def observed(coverage, findings, after, query):
    key = query["id"]
    scope = (FAMILY, key)
    registration = coverage.get(scope, {})
    rows = findings[scope]
    if registration.get("status") != "complete" or registration.get("identityScheme") != SCHEME:
        return None, bool(rows)
    if not rows:
        return False, False
    valid = (len(rows) == 1 and rows[0]["identity"] == key
             and paired.canonical(rows[0]["semantics"]) == paired.canonical({"assertionId": ASSERTION, "asserted": True})
             and rows[0]["provenance"] == [domain_pin(after, query)])
    return (True, False) if valid else (None, True)


def verify_shadow(case, case_pin, observation_bundle=None, observation_pin=None):
    before, after, queries = load_case(case, case_pin)
    fixture, plan = pair_documents(case, before, after, queries)
    actions, incremental = plan_incremental(before, after, queries)
    if observation_bundle is None:
        require(observation_pin is None, "observation digest requires an observation bundle")
        baseline = receipt(plan, "baseline", {key: walk(after, query) for key, query in queries.items()}, after, queries)
        candidate = receipt(plan, "candidate", incremental, after, queries)
        origin = "synthetic_model"
    else:
        exact(observation_bundle, observation_pin, "observations")
        fields(observation_bundle, "baseline candidate", "observations")
        baseline, candidate = (observation_bundle[role] for role in paired.ROLES)
        origin = "pinned_synthetic_receipt_replay"
    observations = (baseline, candidate)
    comparison = paired.compare(fixture, plan, *observations)
    partitions = paired.validate_fixture(fixture)
    collected = [paired.validate_receipt(record, plan["fixtureSha256"], plan[role], partitions, role)
                 for role, record in zip(paired.ROLES, observations)]
    records = []
    for key, query in sorted(queries.items()):
        truth = reference(after, query)
        results = [observed(*data, after, query) for data in collected]
        values = [value for value, _ in results]
        if any(invalid for _, invalid in results) or any(value is not None and value is not truth for value in values):
            decision = "mismatch"
        elif truth is None or None in values:
            decision = "inconclusive"
        else:
            decision = "equivalent_within_fixture"
        records.append({"queryId": key, **actions[key], "reference": truth, "full": values[0],
                        "incremental": values[1], "status": decision})
    states = {row["status"] for row in records}
    gate = "block_mismatch" if "mismatch" in states else "block_insufficient" if "inconclusive" in states else "shadow_pass"
    return {"schemaVersion": 1, "kind": "incremental-equivalence-shadow", "product": case["product"],
            "caseId": case["caseId"], "caseSha256": case_pin, "fixtureSha256": plan["fixtureSha256"],
            "comparisonSha256": digest(comparison), "receiptOrigin": origin, "observationsSha256": observation_pin,
            "status": gate, "rolloutAuthorized": False, "queries": records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", type=Path, required=True)
    parser.add_argument("--case-sha256", required=True)
    parser.add_argument("--prepare", action="store_true", help="emit the exact synthetic pair plan before receipt replay")
    parser.add_argument("--observations", type=Path)
    parser.add_argument("--observations-sha256")
    args = parser.parse_args()
    try:
        observations = paired.read(args.observations) if args.observations is not None else None
        require((args.observations is None) == (args.observations_sha256 is None),
                "supply both observations and their independent digest")
        case = paired.read(args.case)
        if args.prepare:
            require(observations is None, "prepare does not consume observations")
            before, after, queries = load_case(case, args.case_sha256)
            fixture, plan = pair_documents(case, before, after, queries)
            prepared = {"schemaVersion": 1, "rolloutAuthorized": False, "fixture": fixture, "plan": plan,
                        "targetDomainPins": {key: domain_pin(after, query) for key, query in queries.items()}}
            print(json.dumps(prepared, indent=2, sort_keys=True, allow_nan=False))
            return 0
        result = verify_shadow(case, args.case_sha256, observations, args.observations_sha256)
        print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))
    except (OSError, ValueError, RecursionError) as error:
        print(f"shadow verification rejected: {error}", file=sys.stderr)
        return 2
    return 0 if result["status"] == "shadow_pass" else 1


if __name__ == "__main__":
    sys.exit(main())
