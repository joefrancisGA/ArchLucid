#!/usr/bin/env python3
"""Offline paired evaluation of two pinned analysis engine runs (FND-078)."""

import argparse
import hashlib
import json
import queue
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import threading
import time
from collections import Counter, defaultdict

SCHEMA = 1
MAX_JSON = 4 * 1024 * 1024
MAX_PARTITIONS = 1024
MAX_FINDINGS = 10000
MAX_TIMEOUT = 120
PRODUCTS = {"ArchLucid", "SecureNow"}
STATES = {"complete", "partial", "failed", "notEvaluated", "notApplicable", "stale"}
CLASSES = ("added", "removed", "changed", "agreed", "incomparable")
DIGEST = re.compile(r"[a-f0-9]{64}")
REVISION = re.compile(r"[a-f0-9]{40}")
CANONICAL_KEY = re.compile(r"fnd:v2:[a-f0-9]{64}")
# The canonical key is supplied by the product adapter, not generated here.
SCHEMES = {"archlucid-finding-v2", "authoritative-source-v1"}
ROLES = ("baseline", "candidate")


class EvaluationError(ValueError):
    """Malformed input or execution that cannot be treated as a comparable run."""


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True,
                      allow_nan=False).encode("ascii")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def _unique_fields(pairs):
    result = {}
    for name, value in pairs:
        if name in result:
            raise EvaluationError(f"duplicate JSON field {name!r}")
        result[name] = value
    return result


def _bad_number(_: str):
    raise EvaluationError("nonfinite JSON number")


def decode(raw, label):
    if len(raw) > MAX_JSON:
        raise EvaluationError(f"{label} exceeds the JSON byte budget")
    try:
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=_unique_fields, parse_constant=_bad_number)
        canonical(value)  # Reject floats that overflow to infinity during decoding.
        return value
    except (UnicodeError, ValueError, RecursionError) as error:
        raise EvaluationError(f"{label}: {error}") from error


def read(path):
    with Path(path).open("rb") as handle:
        return decode(handle.read(MAX_JSON + 1), str(path))


def _object(value, required, label):
    if not isinstance(value, dict) or set(value) != set(required):
        raise EvaluationError(f"{label}: expected exactly {', '.join(sorted(required))}")
    return value


def _text(value, label):
    if (not isinstance(value, str) or not 0 < len(value) <= 512 or value != value.strip()
            or any(ord(c) < 32 or ord(c) == 127 or 0xD800 <= ord(c) <= 0xDFFF for c in value)):
        raise EvaluationError(f"{label}: expected a nonempty bounded string without control characters")
    return value


def _version(value, label):
    if type(value) is not int or value != SCHEMA:
        raise EvaluationError(f"{label}: unsupported schemaVersion")


def _partition(row, label):
    return (_text(row["family"], label + ".family"), _text(row["scopeKey"], label + ".scopeKey"))


def _rows(value, count, label):
    if not isinstance(value, list) or len(value) > count:
        raise EvaluationError(f"{label}: invalid or oversized list")
    return value


def validate_fixture(fixture):
    _object(fixture, ("schemaVersion", "product", "caseId", "cohortVersion", "partitions",
                      "evidence", "policy", "scope", "configuration"), "fixture")
    _version(fixture["schemaVersion"], "fixture")
    if _text(fixture["product"], "fixture.product") not in PRODUCTS:
        raise EvaluationError("fixture.product: unsupported product")
    for key in ("caseId", "cohortVersion"):
        _text(fixture[key], f"fixture.{key}")
    for key in ("evidence", "policy", "scope", "configuration"):
        if not isinstance(fixture[key], dict) or not fixture[key]:
            raise EvaluationError(f"fixture.{key}: expected a nonempty object")
    partitions = set()
    for row in _rows(fixture["partitions"], MAX_PARTITIONS, "fixture.partitions"):
        _object(row, ("family", "scopeKey", "identityScheme"), "fixture partition")
        key = _partition(row, "fixture partition")
        if key in partitions:
            raise EvaluationError("fixture: duplicate partition")
        if _text(row["identityScheme"], "identityScheme") not in SCHEMES:
            raise EvaluationError("fixture: unsupported identity scheme")
        partitions.add(key)
    if not partitions:
        raise EvaluationError("fixture: expected at least one declared comparison partition")
    return {(r["family"], r["scopeKey"]): r["identityScheme"] for r in fixture["partitions"]}


def validate_engine(engine, role):
    _object(engine, ("id", "revision", "model", "promptVersion", "adapterSha256"), role)
    _text(engine["id"], role + ".id")
    if not REVISION.fullmatch(_text(engine["revision"], role + ".revision")):
        raise EvaluationError(f"{role}: expected a full immutable revision")
    for key in ("model", "promptVersion"):
        if engine[key] is not None:
            _text(engine[key], f"{role}.{key}")
    if not DIGEST.fullmatch(_text(engine["adapterSha256"], role + ".adapterSha256")):
        raise EvaluationError(f"{role}: invalid adapter hash")


def validate_plan(plan, fixture_hash):
    _object(plan, ("schemaVersion", "fixtureSha256", *ROLES), "pair plan")
    _version(plan["schemaVersion"], "pair plan")
    if plan["fixtureSha256"] != fixture_hash:
        raise EvaluationError("pair plan: fixture pin does not match the input")
    for role in ROLES:
        validate_engine(plan[role], role)


def validate_receipt(receipt, fixture_sha, expected, partitions, role):
    _object(receipt, ("schemaVersion", "fixtureSha256", "engine", "coverage", "findings"), role)
    _version(receipt["schemaVersion"], role)
    if receipt["fixtureSha256"] != fixture_sha:
        raise EvaluationError(f"{role}: receipt does not bind the exact shared input")
    validate_engine(receipt["engine"], role)
    if receipt["engine"] != expected:
        raise EvaluationError(f"{role}: receipt engine differs from the pin")
    coverage = {}
    for row in _rows(receipt["coverage"], MAX_PARTITIONS, role + ".coverage"):
        _object(row, ("family", "scopeKey", "status", "reason", "identityScheme"), role + ".coverage entry")
        key = _partition(row, role + ".coverage")
        if key not in partitions or key in coverage:
            raise EvaluationError(f"{role}: undeclared or duplicate coverage partition")
        status = _text(row["status"], role + ".coverage status")
        if status not in STATES:
            raise EvaluationError(f"{role}: unknown coverage status")
        if row["reason"] is not None:
            _text(row["reason"], role + ".coverage reason")
        if status != "complete" and row["reason"] is None:
            raise EvaluationError(f"{role}: incomplete coverage requires a reason")
        scheme = row["identityScheme"]
        if scheme is not None:
            _text(scheme, role + ".identityScheme")
        if status == "complete" and scheme is None:
            raise EvaluationError(f"{role}: complete coverage must declare an identity scheme")
        coverage[key] = {"status": status, "reason": row["reason"], "identityScheme": scheme}
    findings = defaultdict(list)
    for row in _rows(receipt["findings"], MAX_FINDINGS, role + ".findings"):
        _object(row, ("family", "scopeKey", "sourceId", "identity", "semantics", "provenance"), role + ".finding")
        key = _partition(row, role + ".finding")
        if key not in partitions:
            raise EvaluationError(f"{role}: finding outside the requested partitions")
        _text(row["sourceId"], role + ".sourceId")
        if row["identity"] is not None:
            _text(row["identity"], role + ".identity")
            if (coverage.get(key, {}).get("identityScheme") == "archlucid-finding-v2"
                    and not CANONICAL_KEY.fullmatch(row["identity"])):
                raise EvaluationError(f"{role}: malformed canonical finding identity")
        if not isinstance(row["semantics"], dict) or not row["semantics"]:
            raise EvaluationError(f"{role}: findings need nonempty semantic fields")
        refs = _rows(row["provenance"], 64, role + ".provenance")
        if not refs:
            raise EvaluationError(f"{role}: findings need provenance")
        if len({_text(ref, role + ".provenance reference") for ref in refs}) != len(refs):
            raise EvaluationError(f"{role}: duplicate provenance references")
        findings[key].append({**row, "provenance": sorted(refs)})
    return coverage, findings


def _result(status, identity, baseline, candidate, reason=None):
    return {"classification": status, "identity": identity, "reason": reason,
            "baseline": sorted(baseline, key=canonical), "candidate": sorted(candidate, key=canonical)}


def _compare_partition(base, cand, block_reason):
    if block_reason:
        return [_result("incomparable", None, base, cand, block_reason)]
    groups = []
    for rows in (base, cand):
        bucket = defaultdict(list)
        for row in rows:
            bucket[row["identity"]].append(row)
        groups.append(bucket)
    left, right = groups
    results = []
    if left.get(None) or right.get(None):
        results.append(_result("incomparable", None, left.get(None, []), right.get(None, []),
                               "authoritative_identity_missing"))
    for key in sorted((set(left) | set(right)) - {None}):
        before, after = left.get(key, []), right.get(key, [])
        reason = None
        if len(before) > 1 or len(after) > 1:
            state, reason = "incomparable", "identity_collision"
        elif not before:
            state = "added" if not left.get(None) else "incomparable"
            reason = "baseline_identity_unresolved" if state == "incomparable" else None
        elif not after:
            state = "removed" if not right.get(None) else "incomparable"
            reason = "candidate_identity_unresolved" if state == "incomparable" else None
        else:
            state = "agreed" if canonical(before[0]["semantics"]) == canonical(after[0]["semantics"]) else "changed"
        results.append(_result(state, key, before, after, reason))
    return results


def counts(outcomes):
    seen = Counter(row["classification"] for row in outcomes)
    return {key: seen[key] for key in CLASSES}


def compare(fixture, plan, baseline, candidate, *, loaded_adapter_hashes=None):
    """Compare trusted receipts without certifying their observations as ground truth."""
    partitions = validate_fixture(fixture)
    fixture_hash = sha(canonical(fixture))
    validate_plan(plan, fixture_hash)
    left, right = (validate_receipt(record, fixture_hash, plan[role], partitions, role)
                   for role, record in zip(ROLES, (baseline, candidate)))
    report = {
        "schemaVersion": SCHEMA,
        "kind": "paired-engine-evaluation",
        "product": fixture["product"],
        "caseId": fixture["caseId"],
        "cohortVersion": fixture["cohortVersion"],
        "fixtureSha256": fixture_hash,
        "inputFingerprints": {key: sha(canonical(fixture[key]))
                              for key in ("evidence", "policy", "scope", "configuration")},
        "runs": {},
        "partitions": [],
        "countsByFamily": {},
        "truthAdjudicated": False,
    }
    expected_fields = len(partitions)
    for role, run, (coverage, _) in zip(ROLES, (baseline, candidate), (left, right)):
        report["runs"][role] = {
            "engine": plan[role],
            "receiptSha256": sha(canonical(run)),
            "adapterDigestVerifiedByRunner": loaded_adapter_hashes is not None
            and loaded_adapter_hashes.get(role) == plan[role]["adapterSha256"],
            "coverage": {**dict(sorted(Counter(c["status"] for c in coverage.values()).items())),
                         "missing": expected_fields - len(coverage)},
        }
    family_results = defaultdict(list)
    unknown = False
    for (family, scope), scheme in sorted(partitions.items()):
        key = (family, scope)
        missing = {"status": "missing", "reason": "no receipt entry for the requested partition",
                   "identityScheme": None}
        left_status, right_status = left[0].get(key, missing), right[0].get(key, missing)
        reason = None
        if left_status["status"] != "complete" or right_status["status"] != "complete":
            reason = "coverage_not_complete"
        elif left_status["identityScheme"] != scheme or right_status["identityScheme"] != scheme:
            reason = "identity_scheme_mismatch"
        outcomes = _compare_partition(left[1].get(key, []), right[1].get(key, []), reason)
        unresolved = any(row["classification"] == "incomparable" for row in outcomes)
        unknown |= unresolved
        report["partitions"].append({
            "family": family, "scopeKey": scope, "identityScheme": scheme,
            "baselineCoverage": left_status, "candidateCoverage": right_status,
            "status": "incomparable" if reason else "partiallyComparable" if unresolved else "comparable",
            "outcomes": outcomes,
        })
        family_results[family].extend(outcomes)
    report["countsByFamily"] = {family: counts(outcomes) for family, outcomes in sorted(family_results.items())}
    report["status"] = "hasIncomparables" if unknown else "compared"
    return report


def _digest_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _execute(path, payload, scratch, role, timeout):
    command = [sys.executable, str(path)] if path.suffix == ".py" else [str(path)]
    result = queue.Queue(maxsize=1)
    deadline = time.monotonic() + timeout
    with tempfile.TemporaryFile() as input_file:
        input_file.write(payload)
        input_file.seek(0)
        process = subprocess.Popen(command, stdin=input_file, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                   cwd=scratch)

        def read_output():
            try:
                with process.stdout as output:
                    result.put(output.read(MAX_JSON + 1))
            except OSError as error:
                result.put(error)

        threading.Thread(target=read_output, daemon=True).start()
        try:
            data = result.get(timeout=max(0, deadline - time.monotonic()))
            if isinstance(data, OSError):
                raise EvaluationError(f"{role}: adapter output could not be read") from data
            if len(data) > MAX_JSON:
                raise EvaluationError(f"{role}: adapter output exceeds the JSON byte budget")
            code = process.wait(timeout=max(0, deadline - time.monotonic()))
        except (queue.Empty, subprocess.TimeoutExpired) as error:
            raise EvaluationError(f"{role}: adapter timed out") from error
        finally:
            if process.poll() is None:
                process.kill()
                process.wait()
    if code:
        raise EvaluationError(f"{role}: adapter exited {code}, no verified receipt")
    return decode(data, role)


def run_pair(fixture, plan, adapters, *, order=ROLES, timeout=30, retain_receipts=None):
    """Invoke explicitly supplied trusted local adapters on identical immutable input bytes."""
    partitions = validate_fixture(fixture)
    payload = canonical(fixture)
    if len(payload) > MAX_JSON:
        raise EvaluationError("canonical fixture exceeds the JSON byte budget")
    validate_plan(plan, sha(payload))
    if len(order) != 2 or set(order) != set(ROLES) or set(adapters) != set(ROLES):
        raise EvaluationError("baseline and candidate adapters must each run exactly once")
    if type(timeout) is not int or not 1 <= timeout <= MAX_TIMEOUT:
        raise EvaluationError("timeout must be a bounded positive number of seconds")
    paths = {role: Path(adapters[role]).resolve(strict=True) for role in ROLES}
    for role, path in paths.items():
        if not path.is_file() or _digest_file(path) != plan[role]["adapterSha256"]:
            raise EvaluationError(f"{role}: executable does not match the adapter pin")
    result = {}
    for role in order:
        path = paths[role]
        if _digest_file(path) != plan[role]["adapterSha256"]:
            raise EvaluationError(f"{role}: adapter pin changed before execution")
        # No shell and no executable names from the fixture or the plan.
        with tempfile.TemporaryDirectory(prefix="paired-eval-") as scratch:
            result[role] = _execute(path, payload, scratch, role, timeout)
        if _digest_file(path) != plan[role]["adapterSha256"]:
            raise EvaluationError(f"{role}: adapter pin changed during execution")
        validate_receipt(result[role], sha(payload), plan[role], partitions, role)
    if retain_receipts is not None:
        target = Path(retain_receipts)
        target.mkdir(parents=True, exist_ok=False)
        for role in ROLES:
            (target / f"{role}.json").write_bytes(canonical(result[role]) + b"\n")
    return compare(fixture, plan, result["baseline"], result["candidate"],
                   loaded_adapter_hashes={role: plan[role]["adapterSha256"] for role in ROLES})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="mode", required=True)
    for mode in ("run", "compare"):
        command = commands.add_parser(mode)
        command.add_argument("--fixture", type=Path, required=True)
        command.add_argument("--plan", type=Path, required=True)
        command.add_argument("--baseline", type=Path, required=True,
                             help="trusted executable in run mode, or receipt JSON in compare mode")
        command.add_argument("--candidate", type=Path, required=True,
                             help="trusted executable in run mode, or receipt JSON in compare mode")
        if mode == "run":
            command.add_argument("--candidate-first", action="store_true")
            command.add_argument("--timeout", type=int, default=30)
            command.add_argument("--receipt-directory", type=Path, help="new directory for the validated receipts")
    args = parser.parse_args()
    try:
        fixture, plan = read(args.fixture), read(args.plan)
        if args.mode == "run":
            report = run_pair(fixture, plan, {"baseline": args.baseline, "candidate": args.candidate},
                              order=ROLES[::-1] if args.candidate_first else ROLES,
                              timeout=args.timeout, retain_receipts=args.receipt_directory)
        else:
            report = compare(fixture, plan, read(args.baseline), read(args.candidate))
        print(json.dumps(report, sort_keys=True, indent=2, ensure_ascii=True, allow_nan=False))
        return 0
    except (EvaluationError, OSError, RecursionError) as error:
        print(f"paired evaluation: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
