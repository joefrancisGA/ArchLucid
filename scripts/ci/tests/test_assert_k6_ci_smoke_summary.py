import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "scripts" / "ci" / "assert_k6_ci_smoke_summary.py"


def _payload(**tag_p95: float) -> dict:
    metrics: dict = {"http_req_failed": {"values": {"rate": 0.0}}}
    for key, p95 in tag_p95.items():
        metrics[key] = {"values": {"p(95)": p95}}
    return {"metrics": metrics}


class AssertK6CiSmokeSummaryTests(unittest.TestCase):
    def test_mutually_exclusive_flags_exit_code_two(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tmp:
            json.dump({"metrics": {}}, tmp)
            tmp_path = Path(tmp.name)

        try:
            proc = subprocess.run(
                [
                    "python",
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
                    "python",
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
                    "python",
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
                    "python",
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
