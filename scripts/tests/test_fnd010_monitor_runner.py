import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, Mock

from scripts.security import fnd010_monitor_runner as runner


class MonitorRunnerTests(unittest.TestCase):
    def test_incident_is_bounded_and_contains_no_raw_alert(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "alert.json"
            path.write_text(json.dumps({"errorType": "HashMismatch",
                                        "secret": "should-never-appear"}))
            event = runner.incident_from_failure(path, "https://example.test/run")
            self.assertEqual(event["severity"], "critical")
            self.assertEqual(event["errorType"], "HashMismatch")
            self.assertNotIn("secret", json.dumps(event))

    def test_missing_alert_produces_critical_incident(self):
        event = runner.incident_from_failure(Path("/nonexistent/fnd010-alert"), "")
        self.assertEqual(event["errorType"], "VerifierUnavailable")

    def test_verifier_failure_exits_nonzero_and_writes_incident(self):
        with tempfile.TemporaryDirectory() as directory:
            incident = Path(directory) / "incident.json"
            argv = ["monitor", "--checkpoint", "checkpoint.json",
                    "--pinned-public-key", "key.pem", "--expected-key-id", "kid",
                    "--incident", str(incident), "--sqlcmd", "sqlcmd"]
            with patch("sys.argv", argv), patch.object(runner.subprocess, "run",
                    return_value=Mock(returncode=2)):
                self.assertEqual(runner.main(), 2)
            self.assertEqual(json.loads(incident.read_text())["severity"], "critical")

    def test_success_does_not_emit_incident(self):
        with tempfile.TemporaryDirectory() as directory:
            incident = Path(directory) / "incident.json"
            argv = ["monitor", "--checkpoint", "checkpoint.json",
                    "--pinned-public-key", "key.pem", "--expected-key-id", "kid",
                    "--incident", str(incident), "--sqlcmd", "sqlcmd"]
            with patch("sys.argv", argv), patch.object(runner.subprocess, "run",
                    return_value=Mock(returncode=0)):
                self.assertEqual(runner.main(), 0)
            self.assertFalse(incident.exists())


if __name__ == "__main__":
    unittest.main()
