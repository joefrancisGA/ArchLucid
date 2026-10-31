"""Offline correctness and privacy contracts for Azure revision startup-phase correlation."""
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from subprocess import CompletedProcess

from scripts.ci.join_archlucid_staging_phase_logs import (
    PHASES, azure_logs, correlate, parse_events, parse_iso_utc, main,
)

SHA = "a" * 40
BOOT = "b" * 32
CREATED = "2026-10-28T10:00:00Z"
HEALTHY = "2026-10-28T10:00:30Z"
REV = "archlucid-api--r123"
ARTIFACT = {
    "schemaVersion": 1, "environment": "staging",
    "status": "OBSERVED_NOT_PROVEN_FRESH_REVISION",
    "expectedCommitSha": SHA, "revisionName": REV,
    "azureRevisionCreatedUtc": CREATED, "versionMatch": True,
    "readiness": {"firstHealthyObservedUtc": HEALTHY},
    "applicationStartupPhases": {"status": "LOG_EVENTS_NOT_JOINED", "phases": []},
}


def lines(boot=BOOT, sha=SHA, phases=PHASES, start=1793181600000):
    return "\n".join(
        f"2026-10-28T10:00:01Z [INF] ArchLucidColdStartPhase "
        f"RecordedUtc=2026-10-28T10:00:01+00:00 RecordedUnixMs={start + i * 1000} "
        f"ProcessBootId={boot} BuildCommitSha={sha} Phase={phase} "
        f"DurationMs={10.25 * (i + 1)} Environment=Staging"
        for i, phase in enumerate(phases)
    )


class StartupPhaseCorrelationTests(unittest.TestCase):
    def test_complete_five_phases_correlate_one_process(self):
        join = correlate(ARTIFACT, {"replica-a": lines()})
        self.assertEqual("CORRELATED_SINGLE_PROCESS", join["status"])
        self.assertEqual(5, join["matchedEventCount"])
        self.assertEqual(153.75, join["sumOfInstrumentedPhasesMs"])
        self.assertEqual(10.25, join["phaseDurationsMs"]["builder-create"])
        self.assertEqual(BOOT, join["processBootId"])
        self.assertEqual("replica-a", join["replica"])

    def test_wrong_commit_and_out_of_window_are_not_attributed(self):
        for data in (lines(sha="c"*40), lines(start=1793181000000)):
            join = correlate(ARTIFACT, {"replica-a": data})
            self.assertEqual("INCONCLUSIVE", join["status"])
            self.assertEqual("NO_MATCHING_STARTUP_PHASE_EVENTS", join["reason"])

    def test_partial_or_multiple_replica_is_inconclusive(self):
        partial = correlate(ARTIFACT, {"replica-a": lines(phases=PHASES[:3])})
        self.assertEqual("INCOMPLETE_STARTUP_PHASE_SEQUENCE", partial["reason"])
        self.assertEqual({}, partial["phaseDurationsMs"])
        multiple = correlate(ARTIFACT, {"replica-a": lines(), "replica-b": lines(boot="c"*32)})
        self.assertEqual("MULTIPLE_STARTUP_PROCESSES_AMBIGUOUS", multiple["reason"])
        self.assertIsNone(multiple["sumOfInstrumentedPhasesMs"])

    def test_inconsistent_duplicate_is_inconclusive(self):
        stream = lines() + "\n" + lines().replace("DurationMs=10.25", "DurationMs=999.0")
        join = correlate(ARTIFACT, {"replica-a": stream})
        self.assertEqual("CONFLICTING_DUPLICATE_PHASE_EVENTS", join["reason"])

    def test_forged_or_invalid_duration_and_phase_are_ignored(self):
        stream = lines() + "\n" + lines(phases=["nonexistent"])
        self.assertEqual(5, len(parse_events(stream, expected_sha=SHA,
            revision_created=parse_iso_utc(CREATED), first_healthy=parse_iso_utc(HEALTHY),
            replica="a")))
        self.assertEqual("CORRELATED_SINGLE_PROCESS", correlate(ARTIFACT, {"a": stream})["status"])
        modified = lines().replace("DurationMs=20.5", "DurationMs=-0.5")
        self.assertEqual("INCOMPLETE_STARTUP_PHASE_SEQUENCE",
            correlate(ARTIFACT, {"a": modified})["reason"])

    def test_unverified_staging_identity_does_not_trigger_a_log_claim(self):
        for edit in ({"status": "INCONCLUSIVE"}, {"versionMatch": False},
                     {"azureRevisionCreatedUtc": None}):
            result = correlate({**ARTIFACT, **edit}, {"a": lines()})
            self.assertEqual("INCONCLUSIVE", result["status"])

    def test_no_raw_log_content_in_report_and_cli_failure_is_inconclusive(self):
        with tempfile.TemporaryDirectory() as tmp:
            artifact = Path(tmp) / "evidence.json"
            artifact.write_text(json.dumps(ARTIFACT))
            with patch("scripts.ci.join_archlucid_staging_phase_logs.azure_logs",
                       return_value=({"replica-a": lines() + "\nSECRET_DO_NOT_PERSIST"}, None)):
                with patch("sys.argv", ["join", "--artifact", str(artifact),
                                        "--resource-group", "rg", "--app", "api",
                                        "--revision", REV]):
                    self.assertEqual(0, main())
            report = artifact.read_text()
            self.assertNotIn("SECRET_DO_NOT_PERSIST", report)
            self.assertEqual("CORRELATED_SINGLE_PROCESS",
                             json.loads(report)["applicationStartupPhases"]["status"])

    def test_cli_rejects_unsafe_names_before_invoking_azure(self):
        with patch("scripts.ci.join_archlucid_staging_phase_logs.subprocess.run") as run:
            streams, reason = azure_logs("rg;cat", "app", REV)
            self.assertEqual("INVALID_REVISION_TARGET", reason)
            self.assertFalse(streams)
            run.assert_not_called()

    def test_replica_metadata_fail_closed_instead_of_selecting_wrong_replica(self):
        listing = CompletedProcess(args=[], returncode=0,
            stdout=json.dumps([{"name": "replica-a", "properties": {"containers": [
                {"name": "a"}, {"name": "b"}]}}]))
        with patch("scripts.ci.join_archlucid_staging_phase_logs.subprocess.run",
                   return_value=listing):
            streams, reason = azure_logs("rg", "api", REV)
        self.assertEqual("CONTAINER_METADATA_AMBIGUOUS", reason)
        self.assertEqual({}, streams)

    def test_matching_workflows_run_join_before_artifact_upload(self):
        root = Path(__file__).resolve().parents[2]
        for path in (".github/workflows/cd-staging-on-merge.yml",
                     ".github/workflows/cd.yml"):
            text = (root / path).read_text(encoding="utf-8")
            self.assertIn("join_archlucid_staging_phase_logs.py", text)
            self.assertLess(text.index("capture_archlucid_staging_cold_start.py"),
                            text.index("join_archlucid_staging_phase_logs.py"))
            self.assertIn('rm -f "$REVISION_JSON"', text)

    def test_api_process_identity_is_stable_and_machine_readable(self):
        root = Path(__file__).resolve().parents[2]
        text = (root / "ArchLucid.Api/Program.cs").read_text(encoding="utf-8")
        self.assertIn("private static readonly string ColdStartProcessBootId", text)
        self.assertIn("RecordedUnixMs={RecordedUnixMs}", text)
        self.assertIn("ProcessBootId={ProcessBootId}", text)


if __name__ == "__main__":
    unittest.main()
