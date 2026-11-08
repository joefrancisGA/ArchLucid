#!/usr/bin/env python3
"""Correlate exact Azure Container Apps revision console startup events with staging probe evidence.

No raw console logs, credentials, container environment, or Azure CLI errors are
saved in the artifact. Absence/mixed identities are inconclusive, not zero duration.
"""
import argparse
import json
import math
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

PHASES = (
    "builder-create", "service-registration", "application-build",
    "persistence-bootstrap", "host-start",
)
EVENT_RE = re.compile(r"ArchLucidColdStartPhase\b[^\r\n]*")
FIELD_RE = re.compile(r"\b(RecordedUnixMs|ProcessBootId|BuildCommitSha|Phase|DurationMs|Environment)=([a-zA-Z0-9._+:-]+)")
BOOT_RE = re.compile(r"^[a-f0-9]{32}$")
COMMIT_RE = re.compile(r"^[a-f0-9]{40}$")
SAFE_AZURE_NAME = re.compile(r"^[a-zA-Z0-9._-]{1,160}$")


def parse_iso_utc(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(timezone.utc) if parsed.tzinfo else None


def parse_events(log_text, *, expected_sha, revision_created, first_healthy, replica):
    if len(log_text) > 512_000:
        return []
    matches = []
    start_ms = int(revision_created.timestamp() * 1000)
    end_ms = int(first_healthy.timestamp() * 1000) + 60000
    for match in EVENT_RE.finditer(log_text):
        values = dict(FIELD_RE.findall(match.group(0)))
        if values.get("BuildCommitSha", "").lower() != expected_sha:
            continue
        phase = values.get("Phase")
        boot = values.get("ProcessBootId", "").lower()
        if phase not in PHASES or not BOOT_RE.fullmatch(boot):
            continue
        try:
            unix_ms = int(values["RecordedUnixMs"])
            duration_ms = float(values["DurationMs"])
        except (KeyError, ValueError, OverflowError):
            continue
        if not math.isfinite(duration_ms) or duration_ms < 0 or duration_ms > 3600000:
            continue
        if unix_ms < start_ms - 10000 or unix_ms > end_ms:
            continue
        matches.append({
            "replica": replica, "processBootId": boot, "phase": phase,
            "durationMs": round(duration_ms, 3), "recordedUnixMs": unix_ms,
        })
    return matches


def correlate(artifact, log_streams):
    result = {
        "status": "INCONCLUSIVE", "reason": "UNVERIFIED_DEPLOYMENT",
        "processBootId": None, "replica": None,
        "phaseDurationsMs": {}, "sumOfInstrumentedPhasesMs": None,
        "revisionCreatedToHostStartEventMs": None,
        "matchedEventCount": 0,
        "limitations": [
            "Only logs from the exact requested ACA revision and selected replicas are eligible.",
            "Five instrumented phases exclude OS start, image pull, network routing, and uninstrumented gaps.",
            "Durations are process-local. Joining them does not prove first auth hit this process.",
            "Multiple/partial process boot sequences are inconclusive, not a measured zero.",
        ],
    }
    if artifact.get("status") != "OBSERVED_NOT_PROVEN_FRESH_REVISION" or artifact.get("versionMatch") is not True:
        return result
    sha = artifact.get("expectedCommitSha")
    created = parse_iso_utc(artifact.get("azureRevisionCreatedUtc"))
    healthy = parse_iso_utc((artifact.get("readiness") or {}).get("firstHealthyObservedUtc"))
    if not isinstance(sha, str) or not COMMIT_RE.fullmatch(sha) or created is None or healthy is None or healthy < created:
        result["reason"] = "MISSING_OR_INCONSISTENT_REVISION_IDENTITY"
        return result
    if not log_streams:
        result["reason"] = "NO_REVISION_CONSOLE_LOGS"
        return result

    groups = {}
    for replica, log_text in log_streams.items():
        if not isinstance(replica, str) or not isinstance(log_text, str):
            continue
        for event in parse_events(log_text, expected_sha=sha, revision_created=created,
                                  first_healthy=healthy, replica=replica):
            key = (event["replica"], event["processBootId"])
            phases = groups.setdefault(key, {})
            phase = event["phase"]
            if phase in phases and phases[phase] != event:
                result["reason"] = "CONFLICTING_DUPLICATE_PHASE_EVENTS"
                return result
            phases[phase] = event
    result["matchedEventCount"] = sum(map(len, groups.values()))
    if not groups:
        result["reason"] = "NO_MATCHING_STARTUP_PHASE_EVENTS"
        return result
    if len(groups) != 1:
        result["reason"] = "MULTIPLE_STARTUP_PROCESSES_AMBIGUOUS"
        return result
    (replica, boot), phases = next(iter(groups.items()))
    if set(phases) != set(PHASES):
        result["reason"] = "INCOMPLETE_STARTUP_PHASE_SEQUENCE"
        result["observedPhases"] = sorted(phases)
        return result
    event_times = [phases[phase]["recordedUnixMs"] for phase in PHASES]
    if event_times != sorted(event_times):
        result["reason"] = "STARTUP_PHASE_ORDER_INCONSISTENT"
        return result
    durations = {phase: phases[phase]["durationMs"] for phase in PHASES}
    result.update({
        "status": "CORRELATED_SINGLE_PROCESS",
        "reason": "COMPLETE_FIVE_PHASE_SEQUENCE",
        "processBootId": boot, "replica": replica,
        "phaseDurationsMs": durations,
        "sumOfInstrumentedPhasesMs": round(sum(durations.values()), 3),
        "revisionCreatedToHostStartEventMs": max(
            0, phases["host-start"]["recordedUnixMs"] - int(created.timestamp() * 1000)),
    })
    return result


def azure_logs(resource_group, app, revision):
    """Retrieve logs from each replica through CLI, returning only in-memory strings.

    Azure CLI console log streams belong to one replica/container. Do not silently
    treat a random replica's log as the whole revision; enumerate candidates.
    """
    if not all(SAFE_AZURE_NAME.fullmatch(v or "") for v in (resource_group, app, revision)):
        return {}, "INVALID_REVISION_TARGET"
    base = ["az", "containerapp"]
    def call(args, timeout):
        try:
            return subprocess.run(args, capture_output=True, text=True,
                                  timeout=timeout, check=False)
        except (OSError, subprocess.TimeoutExpired):
            return None
    listing = call(base + ["replica", "list", "--resource-group", resource_group,
                           "--name", app, "--revision", revision, "-o", "json"], 20)
    if listing is None or listing.returncode != 0:
        return {}, "REPLICA_LIST_UNAVAILABLE"
    try:
        replicas = json.loads(listing.stdout)
    except (ValueError, TypeError):
        return {}, "REPLICA_LIST_INVALID"
    if not isinstance(replicas, list) or not replicas or len(replicas) > 8:
        return {}, "REPLICA_COUNT_UNSUPPORTED"
    streams = {}
    for item in replicas:
        if not isinstance(item, dict):
            return {}, "REPLICA_METADATA_INVALID"
        name = item.get("name")
        containers = (item.get("properties") or {}).get("containers")
        if not isinstance(name, str) or not SAFE_AZURE_NAME.fullmatch(name):
            return {}, "REPLICA_METADATA_INVALID"
        if not isinstance(containers, list) or len(containers) != 1 or not isinstance(containers[0], dict):
            return {}, "CONTAINER_METADATA_AMBIGUOUS"
        container = containers[0].get("name")
        if not isinstance(container, str) or not SAFE_AZURE_NAME.fullmatch(container):
            return {}, "CONTAINER_METADATA_INVALID"
        log = call(base + ["logs", "show", "--name", app,
                           "--resource-group", resource_group, "--revision", revision,
                           "--replica", name, "--container", container, "--type", "console",
                           "--tail", "300", "--format", "text", "--follow", "false"], 22)
        if log is None or log.returncode != 0:
            return {}, "REVISION_CONSOLE_LOGS_UNAVAILABLE"
        streams[name] = log.stdout[:512000]
    return streams, None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifact", type=Path, required=True)
    parser.add_argument("--resource-group", required=True)
    parser.add_argument("--app", required=True)
    parser.add_argument("--revision", required=True)
    args = parser.parse_args()
    if not args.artifact.is_file() or args.artifact.stat().st_size > 128000:
        return 0
    try:
        artifact = json.loads(args.artifact.read_text(encoding="utf-8"))
        if not isinstance(artifact, dict):
            return 0
        if artifact.get("revisionName") != args.revision:
            join = {"status": "INCONCLUSIVE", "reason": "REVISION_IDENTITY_MISMATCH"}
        elif artifact.get("status") != "OBSERVED_NOT_PROVEN_FRESH_REVISION":
            join = correlate(artifact, {})
        else:
            streams, error = azure_logs(args.resource_group, args.app, args.revision)
            join = correlate(artifact, streams)
            if error:
                join["reason"] = error
        artifact["applicationStartupPhases"] = join
        args.artifact.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
        print("Staging startup phase correlation:", join["status"], join.get("reason"))
    except (OSError, ValueError, TypeError, KeyError):
        # Optional evidence must not override existing deployment approval/rollback.
        print("Staging startup phase correlation: INCONCLUSIVE (collector error)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
