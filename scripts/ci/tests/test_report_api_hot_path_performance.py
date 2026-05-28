from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "report_api_hot_path_performance.py"


class ReportApiHotPathPerformanceTests(unittest.TestCase):
    def test_renders_production_like_summary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            summary_path = Path(tmp) / "summary.json"
            out_path = Path(tmp) / "api-hot-path-performance.md"
            summary_path.write_text(
                json.dumps(
                    {
                        "schema": "archlucid.k6-production-like-summary.v1",
                        "profile": "ci-smoke",
                        "mode": "simulator",
                        "baseUrl": "http://localhost:5128",
                        "p95Ms": 812.4,
                        "errorRate": 0.01,
                        "slowestRouteTag": "http_req_duration{k6ci:create_run}",
                        "generatedUtc": "2026-05-28T12:00:00Z",
                    }
                ),
                encoding="utf-8",
            )

            completed = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--summary",
                    str(summary_path),
                    "--markdown-out",
                    str(out_path),
                    "--environment-label",
                    "ci-smoke",
                    "--evidence-class",
                    "ci-smoke-not-sla",
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            self.assertEqual(completed.returncode, 0)
            text = out_path.read_text(encoding="utf-8")
            self.assertIn("812.4 ms", text)
            self.assertIn("ci-smoke-not-sla", text)
            self.assertIn("not** a production SLA certificate", text)

    def test_missing_summary_writes_skipped_markdown(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out_path = Path(tmp) / "api-hot-path-performance.md"

            subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--markdown-out",
                    str(out_path),
                ],
                check=True,
                capture_output=True,
                text=True,
            )

            text = out_path.read_text(encoding="utf-8")
            self.assertIn("SKIPPED", text)


if __name__ == "__main__":
    unittest.main()
