"""Unit tests for report_release_gate_playwright_workspace_digest.py."""

from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_release_gate_playwright_workspace_digest.py"
_SPEC = importlib.util.spec_from_file_location("release_gate_digest", _SCRIPT)
assert _SPEC is not None and _SPEC.loader is not None
digest = importlib.util.module_from_spec(_SPEC)
sys.modules["release_gate_digest"] = digest
_SPEC.loader.exec_module(digest)


def _result(status: str, message: str, line: int) -> dict:
    return {
        "status": status,
        "errors": [
            {
                "message": message,
                "location": {
                    "file": "/home/runner/work/ArchLucid/ArchLucid/archlucid-ui/e2e/demo-workspace-a.smoke.spec.ts",
                    "line": line,
                    "column": 5,
                },
            }
        ],
    }


def _spec(file_name: str, title: str, status: str, results: list[dict]) -> dict:
    return {
        "title": title,
        "file": file_name,
        "line": 42,
        "tests": [
            {
                "projectName": "chromium",
                "status": status,
                "results": results,
            }
        ],
    }


class TestReleaseGateWorkspaceDigest(unittest.TestCase):
    def test_splits_workspaces_and_keeps_the_first_failure(self) -> None:
        report = {
            "suites": [
                {
                    "title": "demo-workspace-a-smoke",
                    "file": "e2e/demo-workspace-a.smoke.spec.ts",
                    "suites": [
                        {
                            "file": "e2e/demo-workspace-a.smoke.spec.ts",
                            "specs": [
                                _spec(
                                    "e2e/demo-workspace-a.smoke.spec.ts",
                                    "canonical Product Tour",
                                    "unexpected",
                                    [
                                        _result(
                                            "failed",
                                            "Error: expect(locator).toBeVisible() failed\n\nCall log:\n- waiting",
                                            155,
                                        )
                                    ],
                                )
                            ],
                        }
                    ],
                },
                {
                    "title": "demo-workspace-b-smoke",
                    "specs": [
                        _spec(
                            "e2e/demo-workspace-b.smoke.spec.ts",
                            "regulated storyline",
                            "expected",
                            [{"status": "passed", "errors": []}],
                        )
                    ],
                },
                {
                    "title": "other",
                    "specs": [
                        _spec(
                            "e2e/marketing-demo-preview.spec.ts",
                            "preview",
                            "flaky",
                            [{"status": "failed"}, {"status": "passed"}],
                        )
                    ],
                },
            ]
        }

        summary = digest.build_digest(report)
        counts = summary["counts"]

        self.assertEqual(summary["disposition"], "FAIL")
        self.assertEqual(counts["A"]["failed"], 1)
        self.assertEqual(counts["B"]["passed"], 1)
        self.assertEqual(counts["other"]["flaky"], 1)
        failure = summary["firstFailure"]
        self.assertEqual(failure["workspace"], "A")
        self.assertEqual(failure["file"], "e2e/demo-workspace-a.smoke.spec.ts")
        self.assertEqual(failure["line"], 155)
        self.assertNotIn("Call log", failure["message"])
        annotation = digest.format_github_annotation(failure)
        self.assertNotIn("\n", annotation)
        self.assertIn("title=Workspace A release-gate", annotation)
        self.assertIn("file=e2e/demo-workspace-a.smoke.spec.ts,line=155", annotation)

    def test_workspace_b_is_first_when_workspace_a_passed(self) -> None:
        report = {
            "suites": [
                {
                    "specs": [
                        _spec("e2e/demo-workspace-a.smoke.spec.ts", "tour", "expected", [{"status": "passed"}]),
                        _spec(
                            "e2e/demo-workspace-b.smoke.spec.ts",
                            "pack inspect",
                            "unexpected",
                            [_result("timedOut", "Error: Timeout 90000ms exceeded", 217)],
                        ),
                    ]
                }
            ]
        }

        summary = digest.build_digest(report)

        self.assertEqual(summary["counts"]["A"]["passed"], 1)
        self.assertEqual(summary["counts"]["B"]["failed"], 1)
        self.assertEqual(summary["firstFailure"]["workspace"], "B")
        self.assertEqual(summary["firstFailure"]["title"], "pack inspect")

    def test_missing_report_is_inconclusive_and_exits_zero(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            missing = root / "missing.json"
            markdown_out = root / "digest.md"
            json_out = root / "digest.json"
            code = digest.main(
                [
                    "--json-in",
                    str(missing),
                    "--markdown-out",
                    str(markdown_out),
                    "--json-out",
                    str(json_out),
                ]
            )
            payload = json.loads(json_out.read_text(encoding="utf-8"))

            self.assertEqual(code, 0)
            self.assertEqual(payload["disposition"], "INCONCLUSIVE")
            self.assertIn("was not written", markdown_out.read_text(encoding="utf-8"))
            self.assertIsNone(payload["firstFailure"])


if __name__ == "__main__":
    unittest.main()
