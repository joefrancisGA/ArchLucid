import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from ci_test_helpers import PYTHON

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "assert_k6_ci_smoke_summary.py"


def _payload(**tag_p95: float) -> dict:
    metrics: dict = {"http_req_failed": {"values": {"rate": 0.0}}}
    for key, p95 in tag_p95.items():
        metrics[key] = {"values": {"p(95)": p95}}
    return {"metrics": metrics}


class AssertK6CiSmokeSummaryTests(unittest.TestCase):
    def test_write_admission_requires_completed_requests_checks_and_no_drops(self):
        data = _payload(**{"http_req_duration": 120})
        data["metrics"].update({"http_reqs": {"values": {"count": 4}},
                                "checks": {"values": {"rate": 1.0}},
                                "dropped_iterations": {"values": {"count": 0}}})
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)
        args = [PYTHON, str(SCRIPT), str(tmp_path), "--min-http-requests", "2",
                "--max-dropped-iterations", "0", "--min-check-rate", "1"]
        try:
            self.assertEqual(subprocess.run(args, capture_output=True, text=True).returncode, 0)
            data["metrics"]["dropped_iterations"]["values"]["count"] = 1
            data["metrics"]["http_reqs"]["values"]["count"] = 0
            tmp_path.write_text(json.dumps(data))
            proc = subprocess.run(args, capture_output=True, text=True)
            self.assertEqual(proc.returncode, 1)
            self.assertIn("completed HTTP requests 0 below minimum 2", proc.stderr)
            self.assertIn("dropped iterations 1 exceeds cap 0", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_present_tag_without_p95_cannot_pass(self):
        data = _payload(**{"http_req_duration{k6ci:list_runs}": 100})
        data["metrics"]["http_req_duration{k6ci:version}"] = {"values": {}}
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)
        try:
            proc = subprocess.run(
                [PYTHON, str(SCRIPT), str(tmp_path), "--per-tag-ci-smoke"],
                capture_output=True, text=True,
            )
            self.assertEqual(proc.returncode, 1, proc.stderr)
            self.assertIn("version} p(95) missing", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_ci_smoke_uses_same_tier2_override_as_k6(self):
        data = _payload(**{"http_req_duration{k6ci:list_runs}": 1000})
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)
        try:
            proc = subprocess.run(
                [PYTHON, str(SCRIPT), str(tmp_path), "--per-tag-ci-smoke"],
                capture_output=True, text=True,
                env={**os.environ, "ARCHLUCID_K6_P95_TIER2_MS": "1200"},
            )
            self.assertEqual(proc.returncode, 0, proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_nonfinite_environment_cap_is_rejected(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(_payload(**{"http_req_duration{k6api:version}": 999999}), tmp)
            tmp_path = Path(tmp.name)
        try:
            proc = subprocess.run(
                [PYTHON, str(SCRIPT), str(tmp_path), "--per-tag-k6-api-smoke"],
                capture_output=True, text=True,
                env={**os.environ, "ARCHLUCID_K6_P95_TIER2_MS": "nan"},
            )
            self.assertEqual(proc.returncode, 1, proc.stderr)
            self.assertIn("invalid k6 p95 cap", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_nonfinite_latency_cap_is_rejected(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(_payload(**{"http_req_duration": 999999}), tmp)
            tmp_path = Path(tmp.name)
        try:
            proc = subprocess.run(
                [PYTHON, str(SCRIPT), str(tmp_path), "--max-p95-ms", "nan"],
                capture_output=True, text=True,
            )
            self.assertEqual(proc.returncode, 2, proc.stderr)
            self.assertIn("finite positive", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_nonfinite_tagged_latency_cannot_pass(self):
        data = _payload(**{"http_req_duration{k6api:version}": float("nan")})
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)
        try:
            proc = subprocess.run(
                [PYTHON, str(SCRIPT), str(tmp_path), "--per-tag-k6-api-smoke"],
                capture_output=True, text=True,
            )
            self.assertEqual(proc.returncode, 1, proc.stderr)
            self.assertIn("invalid k6 metric", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_missing_global_duration_cannot_pass(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(_payload(), tmp)
            tmp_path = Path(tmp.name)
        try:
            for mode in ([], ["--per-tag-ci-smoke"], ["--per-tag-k6-api-smoke"]):
                proc = subprocess.run([PYTHON, str(SCRIPT), str(tmp_path), *mode], capture_output=True, text=True)
                self.assertEqual(proc.returncode, 1, proc.stderr)
                self.assertIn("http_req_duration p(95) missing", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_missing_failure_rate_cannot_pass(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump({"metrics": {"http_req_duration": {"values": {"p(95)": 100}}}}, tmp)
            tmp_path = Path(tmp.name)
        try:
            proc = subprocess.run([PYTHON, str(SCRIPT), str(tmp_path)], capture_output=True, text=True)
            self.assertEqual(proc.returncode, 1, proc.stderr)
            self.assertIn("http_req_failed rate missing", proc.stderr)
        finally:
            tmp_path.unlink(missing_ok=True)

    def test_mutually_exclusive_flags_exit_code_two(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump({"metrics": {}}, tmp)
            tmp_path = Path(tmp.name)

        try:
            proc = subprocess.run(
                [
                    PYTHON,
                    str(SCRIPT),
                    str(tmp_path),
                    "--per-tag-ci-smoke",
                    "--per-tag-k6-api-smoke",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(proc.returncode, 2, proc.stderr + proc.stdout)

        finally:
            tmp_path.unlink(missing_ok=True)

    def test_per_tag_k6_api_smoke_passes_under_caps(self):
        data = _payload(
            **{
                "http_req_duration{k6api:health_ready}": 400,
                "http_req_duration{k6api:version}": 100,
                "http_req_duration{k6api:create_run}": 1000,
                "http_req_duration{k6api:list_authority_runs}": 200,
                "http_req_duration{k6api:run_status}": 150,
                "http_req_duration{k6api:seed_fake}": 500,
                "http_req_duration{k6api:pilot_commit}": 600,
                "http_req_duration{k6api:artifacts_list}": 120,
            }
        )

        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)

        try:
            env = os.environ.copy()
            env.pop("ARCHLUCID_K6_OPERATOR_MINIMAL", None)
            proc = subprocess.run(
                [
                    PYTHON,
                    str(SCRIPT),
                    str(tmp_path),
                    "--max-failed-rate",
                    "0.02",
                    "--max-p95-ms",
                    "2000",
                    "--per-tag-k6-api-smoke",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                check=False,
                env=env,
            )
            self.assertEqual(proc.returncode, 0, proc.stderr + proc.stdout)
            self.assertIn("Core Pilot operator-path smoke budget", proc.stdout)
            self.assertIn("[PASS]", proc.stdout)

        finally:
            tmp_path.unlink(missing_ok=True)

    def test_per_tag_k6_api_smoke_fails_when_cap_exceeded(self):
        data = _payload(
            **{
                "http_req_duration{k6api:health_ready}": 400,
                "http_req_duration{k6api:version}": 100,
                "http_req_duration{k6api:create_run}": 9000,
                "http_req_duration{k6api:list_authority_runs}": 200,
                "http_req_duration{k6api:run_status}": 150,
                "http_req_duration{k6api:seed_fake}": 500,
                "http_req_duration{k6api:pilot_commit}": 600,
                "http_req_duration{k6api:artifacts_list}": 120,
            }
        )

        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)

        try:
            proc = subprocess.run(
                [
                    PYTHON,
                    str(SCRIPT),
                    str(tmp_path),
                    "--max-failed-rate",
                    "0.02",
                    "--max-p95-ms",
                    "2000",
                    "--per-tag-k6-api-smoke",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertNotEqual(proc.returncode, 0, proc.stdout)
            self.assertIn("k6 smoke gate failed", proc.stderr)

        finally:
            tmp_path.unlink(missing_ok=True)

    def test_operator_minimal_skips_extended_caps(self):
        data = _payload(
            **{
                "http_req_duration{k6api:health_ready}": 400,
                "http_req_duration{k6api:version}": 100,
                "http_req_duration{k6api:create_run}": 1000,
                "http_req_duration{k6api:list_authority_runs}": 200,
            }
        )

        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump(data, tmp)
            tmp_path = Path(tmp.name)

        try:
            proc = subprocess.run(
                [
                    PYTHON,
                    str(SCRIPT),
                    str(tmp_path),
                    "--max-failed-rate",
                    "0.02",
                    "--max-p95-ms",
                    "2000",
                    "--per-tag-k6-api-smoke",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                check=False,
                env={**os.environ, "ARCHLUCID_K6_OPERATOR_MINIMAL": "1"},
            )
            self.assertEqual(proc.returncode, 0, proc.stderr + proc.stdout)

        finally:
            tmp_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
