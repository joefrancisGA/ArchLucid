#!/usr/bin/env python3
"""Validate and report FND-171 provenance for the registered scope, not correctness."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess

MANIFEST = "scripts/assurance/regression-evidence/independent-oracles.json"
SHA = re.compile(r"[0-9a-f]{40}")
SHA256 = re.compile(r"[0-9a-f]{64}")
SYMBOL = re.compile(r"\w+(?:::\w+|\.\w+)*")
CLASSES = {"independent", "characterization", "coupled", "uncertain"}
SOURCES = {"requirement", "accepted-adr", "invariant", "specification", "worked-example", "property", "reference-evaluator"}
CASES = {"positive", "negative", "boundary"}
PRODUCTS = {"ArchLucid", "SecureNow"}
MAX_BYTES = 256 * 1024


def safe_path(value):
    return (isinstance(value, str) and bool(value) and not value.startswith("/") and "\\" not in value
            and all(ord(c) >= 32 for c in value) and ".." not in PurePosixPath(value).parts
            and str(PurePosixPath(value)) == value)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def string_list(value, *, allow_empty=False):
    return (isinstance(value, list) and (allow_empty or bool(value)) and all(nonempty(item) for item in value)
            and len(value) == len(set(value)))


def inspect(data, lookup=None):
    errors, unresolved, counts, seen = [], [], Counter(), set()
    result = {"registered": 0, "classifications": {}, "unresolved": unresolved, "errors": errors,
              "scope": "registered-tests-only", "source_objects_checked": lookup is not None}
    if (not isinstance(data, dict) or data.get("schema_version") != 1 or
            not isinstance(data.get("tests"), list) or not 0 < len(data["tests"]) <= 100):
        errors.append("expected schema_version 1 and 1–100 registered tests")
        return result
    for i, row in enumerate(data["tests"], 1):
        if not isinstance(row, dict):
            errors.append(f"row {i}: expected an object")
            continue
        product, classification = row.get("product"), row.get("classification")
        path, test = row.get("path"), row.get("test")
        if (not safe_path(path) or not isinstance(test, str) or not SYMBOL.fullmatch(test)
                or not isinstance(product, str) or product not in PRODUCTS
                or not isinstance(classification, str) or classification not in CLASSES):
            errors.append(f"row {i}: invalid product, test identity, path or classification")
            continue
        if (path, test) in seen:
            errors.append(f"row {i}: duplicate test identity")
            continue
        seen.add((path, test))
        counts[classification] += 1
        if not all(nonempty(row.get(field)) for field in ("contract", "intent", "derivation")):
            errors.append(f"row {i}: contract, intent and derivation are required")
        if not string_list(row.get("limitations"), allow_empty=True):
            errors.append(f"row {i}: limitations must be a list of distinct strings")
        named_cases = row.get("cases", [])
        if not string_list(named_cases, allow_empty=True) or not set(named_cases) <= CASES:
            errors.append(f"row {i}: invalid case coverage")
        if classification in {"uncertain", "coupled"}:
            if not nonempty(row.get("revisit")):
                errors.append(f"row {i}: gap requires a revisit condition")
            unresolved.append(test)
        if row.get("requirement_conflict"):
            if not nonempty(row["requirement_conflict"]):
                errors.append(f"row {i}: malformed requirement conflict")
            if test not in unresolved:
                unresolved.append(test)
        if classification == "independent":
            source = row.get("source")
            if not named_cases or not isinstance(source, dict):
                errors.append(f"row {i}: independent coverage needs cases and a pinned source")
                continue
            kind, rev, digest, needle = (source.get(key) for key in ("kind", "revision", "sha256", "locator"))
            if (not isinstance(kind, str) or kind not in SOURCES or not safe_path(source.get("path"))
                    or not ((digest is None and isinstance(rev, str) and SHA.fullmatch(rev)) or
                            (rev is None and isinstance(digest, str) and SHA256.fullmatch(digest)))
                    or not nonempty(needle)
                    or (source["path"] == path and kind == "reference-evaluator")):
                errors.append(f"row {i}: invalid independent source provenance")
                continue
            if lookup and not lookup(rev, source["path"], needle, digest):
                errors.append(f"row {i}: pinned source or locator is unavailable")
        if lookup and not lookup(None, path, test.split(".")[-1].split("::")[-1], None):
            errors.append(f"row {i}: test identity not found at requested head")
    result["registered"] = len(seen)
    result["classifications"] = dict(sorted(counts.items()))
    return result


def read_git(repo, revision, path):
    name = f"{revision}:{path}"
    args = ["git", "-C", str(repo), "cat-file"]
    size = subprocess.check_output(args + ["-s", name], stderr=subprocess.DEVNULL, timeout=10)
    if int(size) > MAX_BYTES:
        raise ValueError("provenance source exceeds size cap")
    return subprocess.check_output(args + ["blob", name], stderr=subprocess.DEVNULL,
                                   timeout=10).decode("utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--head", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if not SHA.fullmatch(args.head):
        parser.error("--head must be a full commit SHA")

    def lookup(revision, path, text, digest):
        try:
            content = read_git(args.repo_root, revision or args.head, path)
            if digest and hashlib.sha256(content.encode("utf-8")).hexdigest() != digest:
                return False
            return text in content
        except (ValueError, OSError, subprocess.SubprocessError):
            return False

    try:
        data = json.loads(read_git(args.repo_root, args.head, MANIFEST))
        payload = inspect(data, lookup)
    except (ValueError, OSError, subprocess.SubprocessError):
        payload = {"scope": "registered-tests-only", "errors": ["manifest unavailable or invalid"]}
    payload["head"] = args.head
    payload["status"] = ("incomplete" if payload["errors"] else
                         "registered-with-open-questions" if payload["unresolved"] else "registered")
    rendered = json.dumps(payload, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return int(bool(payload["errors"]))


if __name__ == "__main__":
    raise SystemExit(main())
