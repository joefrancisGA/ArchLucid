#!/usr/bin/env python3
"""Capture staging cold-start evidence without claiming a fresh revision was unwarmed.

The only network requests are explicit HTTPS GET probes in the opt-in --probe mode.
No API credential, response body or authorization header is written to artifacts.
"""
import argparse
import json
import math
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SHA = re.compile(r"^[0-9a-fA-F]{40}$")


def parse_utc(value):
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo else None
    except ValueError:
        return None


def utc_now():
    return datetime.now(timezone.utc)


def safe_https_base(url):
    parts = urllib.parse.urlsplit(url)
    if (parts.scheme != "https" or not parts.hostname or parts.username or
            parts.password or parts.query or parts.fragment or parts.path not in ("", "/")):
        raise ValueError("Expected an HTTPS API origin with no credentials or path")
    return url.rstrip("/")


def http_get(url, api_key=None, timeout=10):
    headers = {"Accept": "application/json", "Cache-Control": "no-cache, no-store"}
    if api_key is not None:
        headers["X-Api-Key"] = api_key
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as reply:
            raw = reply.read(32769)
            if len(raw) > 32768:
                return reply.status, None
            try:
                return reply.status, json.loads(raw)
            except (json.JSONDecodeError, UnicodeDecodeError):
                return reply.status, None
    except urllib.error.HTTPError as exc:
        return exc.code, None
    except (urllib.error.URLError, TimeoutError, OSError):
        return 0, None


def revision_created_utc(revision):
    props = revision.get("properties", {})
    system = revision.get("systemData", {})
    if not isinstance(props, dict) or not isinstance(system, dict):
        return None
    return parse_utc(props.get("createdTime") or system.get("createdAt"))


def capture(*, expected_sha, revision_name, update_start_utc, revision,
            base_url=None, api_key=None, get=http_get, now=utc_now, attempts=12):
    if not SHA.fullmatch(expected_sha):
        raise ValueError("An immutable 40-character deploy SHA is required")
    if not revision_name or len(revision_name) > 200:
        raise ValueError("Revision identity is required")
    if not 1 <= attempts <= 30:
        raise ValueError("Invalid readiness attempt count")
    if not isinstance(revision, dict):
        raise ValueError("Invalid Azure revision record")
    created = revision_created_utc(revision)
    update_started = parse_utc(update_start_utc)
    artifact = {
        "schemaVersion": 1,
        "environment": "staging",
        "status": "INCONCLUSIVE",
        "expectedCommitSha": expected_sha.lower(),
        "revisionName": revision_name,
        "azureRevisionCreatedUtc": created.isoformat() if created else None,
        "containerAppUpdateStartedUtc": update_started.isoformat() if update_started else None,
        "readiness": {"status": "NOT_MEASURED", "attempts": 0, "firstHealthyObservedUtc": None,
                      "revisionToFirstObservedHealthySeconds": None,
                      "timingMeaning": "UPPER_BOUND_ONLY_IF_REVISION_TIMESTAMP_AND_ROUTING_VERIFIED"},
        "firstAuthenticatedBusinessRead": {
            "status": "NOT_MEASURED", "endpoint": "/api/auth/me",
            "firstMilliseconds": None, "subsequentMedianMilliseconds": None,
            "sampleCount": 0, "coldness": "NOT_VERIFIED_UNWARMED"},
        "versionMatch": False,
        "applicationStartupPhases": {"status": "LOG_EVENTS_NOT_JOINED", "phases": []},
        "limitations": [
            "First observed readiness is not the exact instant application became ready.",
            "An already-warm revision or another client can prewarm /api/auth/me.",
            "Staging ingress may serve another revision during traffic changes.",
            "Application-side startup phase durations require separate correlated application logs.",
        ],
    }
    if not base_url or not api_key or not api_key.strip():
        artifact["reason"] = "NO_DEPLOYMENT_OR_MISSING_PROBE_CONFIG"
        return artifact
    origin = safe_https_base(base_url)
    if revision.get("name") != revision_name:
        artifact["reason"] = "AZURE_REVISION_IDENTITY_MISMATCH"
        return artifact
    if created is None or update_started is None or created < update_started:
        artifact["reason"] = "REVISION_OR_UPDATE_TIMESTAMP_UNAVAILABLE"
        # Probe may still run, but do not label the result revision-to-ready.
    readiness = artifact["readiness"]
    first_healthy = None
    for attempt in range(attempts):
        stamp = now()
        response, data = get(origin + "/health/ready")
        readiness["attempts"] += 1
        if response == 200 and isinstance(data, dict) and data.get("status") == "Healthy":
            first_healthy = stamp
            readiness["firstHealthyObservedUtc"] = stamp.isoformat()
            readiness["status"] = "HEALTHY_OBSERVED"
            if created and update_started and created >= update_started and stamp >= created:
                readiness["revisionToFirstObservedHealthySeconds"] = round((stamp - created).total_seconds(), 3)
            break
        if attempt + 1 < attempts:
            time.sleep(2)
    if first_healthy is None:
        artifact["reason"] = "READINESS_NOT_OBSERVED"
        return artifact

    # Record first auth read BEFORE any workflow's product smoke or /api/auth/me warm-up.
    business = artifact["firstAuthenticatedBusinessRead"]
    timings = []
    for _ in range(3):
        started = time.perf_counter()
        status, _ = get(origin + "/api/auth/me", api_key=api_key)
        elapsed = round((time.perf_counter() - started) * 1000, 3)
        if status != 200:
            business["status"] = "NON_200"
            business["sampleCount"] = len(timings)
            artifact["reason"] = "AUTHENTICATED_READ_FAILED"
            return artifact
        timings.append(elapsed)
    business["firstMilliseconds"] = timings[0]
    business["subsequentMedianMilliseconds"] = round(sum(sorted(timings[1:])) / 2, 3)
    business["sampleCount"] = len(timings)
    business["status"] = "OBSERVED"
    status, info = get(origin + "/version")
    version_sha = info.get("commitSha") if status == 200 and isinstance(info, dict) else None
    artifact["versionMatch"] = (isinstance(version_sha, str) and version_sha.lower() == expected_sha.lower())
    if not artifact["versionMatch"]:
        artifact["reason"] = "VERSION_MISMATCH_OR_UNAVAILABLE"
        return artifact
    if created is None or update_started is None or created < update_started:
        artifact["reason"] = "REVISION_OR_UPDATE_TIMESTAMP_UNAVAILABLE"
        return artifact
    # An ingress-visible commit does not prove which replica handled preceding calls.
    artifact["status"] = "OBSERVED_NOT_PROVEN_FRESH_REVISION"
    artifact["reason"] = "PASSIVE_READINESS_UPPER_BOUND_AND_FIRST_AUTH_PROBE_ONLY"
    return artifact


def skipped(*, reason, expected_sha="", deployment_attempted=False):
    return {
        "schemaVersion": 1, "environment": "staging",
        "status": "INCONCLUSIVE_DEPLOYMENT" if deployment_attempted else "NOT_DEPLOYED",
        "reason": reason,
        "expectedCommitSha": expected_sha if SHA.fullmatch(expected_sha) else None,
        "readiness": {"status": "NOT_MEASURED"},
        "firstAuthenticatedBusinessRead": {"status": "NOT_MEASURED"},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-sha", default="")
    parser.add_argument("--revision", default="")
    parser.add_argument("--update-start-utc", default="")
    parser.add_argument("--revision-json", type=Path)
    parser.add_argument("--base-url")
    parser.add_argument("--api-key-env", default="ARCHLUCID_API_KEY")
    parser.add_argument("--skip-reason", default="")
    parser.add_argument("--deployment-attempted", action="store_true")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.skip_reason:
        report = skipped(reason=args.skip_reason, expected_sha=args.expected_sha,
                         deployment_attempted=args.deployment_attempted)
    else:
        if args.revision_json is None or not args.revision_json.is_file():
            report = skipped(reason="AZURE_REVISION_METADATA_UNAVAILABLE", expected_sha=args.expected_sha)
        else:
            try:
                revision = json.loads(args.revision_json.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                revision = {}
            report = capture(expected_sha=args.expected_sha, revision_name=args.revision,
                             update_start_utc=args.update_start_utc, revision=revision,
                             base_url=args.base_url, api_key=os.environ.get(args.api_key_env))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print("Cold-start staging evidence:", report["status"], report.get("reason", ""))
    return 0  # Informational; never silently weaken the existing CD release gates.


if __name__ == "__main__":
    raise SystemExit(main())
