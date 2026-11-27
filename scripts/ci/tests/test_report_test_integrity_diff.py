"""Report-only test integrity controls, including real pinned Git comparisons."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report_test_integrity_diff as guard  # noqa: E402

PY_PATH = "suite/test_contract.py"


class PatternControls(TestCase):
    def test_weakened_assertion_records_exact_locations(self):
        old = "def test_count():\n    assert count() == 3\n"
        new = "def test_count():\n\n    assert count() is not None\n"
        rows = guard.scan_python(old, new, PY_PATH, PY_PATH)
        self.assertEqual([(r["signal"], r["base_line"], r["head_line"], r["test"]) for r in rows],
                         [("python-assertion-changed", 2, 3, "test_count")])

    def test_removed_negative_control_and_unittest_assertion(self):
        old = ("import pytest\nclass TestContract:\n"
               "    def test_invalid(self):\n"
               "        self.assertEqual(count(), 3)\n"
               "        with pytest.raises(ValueError):\n            convert(-1)\n")
        new = "class TestContract:\n    def test_invalid(self):\n        convert(1)\n"
        signals = guard.scan_python(old, new, PY_PATH, PY_PATH)
        self.assertEqual([(s["signal"], s["base_line"]) for s in signals],
                         [("python-assertion-removed", 4), ("python-assertion-removed", 5), ("negative-control-removed", 5)])

    def test_new_and_changed_skip_are_real_ast_signals(self):
        for marker in ("skip", "skipif(False)", 'xfail(reason="fixture")'):
            with self.subTest(marker=marker):
                old = "def test_count():\n    assert count() == 3\n"
                new = "@pytest.mark." + marker + "\n" + old
                got = guard.scan_python(old, new, PY_PATH, PY_PATH)
                self.assertEqual([(x["signal"], x["head_line"]) for x in got],
                                 [("python-skip-or-xfail-added-or-changed", 1)])
        conditional = "@pytest.mark.skipif(False)\n" + old
        self.assertEqual(len(guard.scan_python(conditional, conditional.replace("False", "True"), PY_PATH, PY_PATH)), 1)

    def test_syntax_equivalent_refactors_and_stronger_assertions(self):
        old = "def test_count():\n    assert count() == 3, 'old message'\n"
        new = "# skip marker example only\ndef test_count():\n    assert (count()==3), 'new message'\n    assert ok()\n"
        self.assertEqual(guard.scan_python(old, new, PY_PATH, PY_PATH), [])
        self.assertEqual(guard.scan_python(old, old.replace("test_count", "test_exact_count"), PY_PATH, PY_PATH), [])

    def test_selection_patterns_keep_line_locations(self):
        workflow = ".github/workflows/ci.yml"
        old = "steps:\n  - run: dotnet test\n"
        new = "steps:\n  - run: dotnet test --filter Category=Unit\n"
        changes = guard.scan_selection(old, new, "workflow", workflow, workflow)
        self.assertEqual([(x["signal"], x["head_line"]) for x in changes],
                         [("test-selection-or-discovery-changed", 2)])
        self.assertEqual(guard.scan_selection(new, new.replace("  - ", "    - "), "workflow", workflow, workflow), [])
        self.assertEqual(guard.scan_selection("", "# pytest -k excluded\n", "workflow", workflow, workflow), [])
        config = "pytest.ini"
        changes = guard.scan_selection("[pytest]\ntestpaths = tests\n", "[pytest]\ntestpaths = tests/unit\n",
                                       "pytest-config", config, config)
        self.assertEqual([(x["base_line"], x["head_line"]) for x in changes], [(2, 2)])


class GitControls(TestCase):
    def setUp(self):
        self.repo = Path(self.enterContext(TemporaryDirectory()))
        self.git("init", "-q")
        self.git("config", "user.name", "Fixture")
        self.git("config", "user.email", "fixture@example.invalid")

    def git(self, *args):
        return subprocess.check_output(["git", *args], cwd=self.repo, text=True).strip()

    def write(self, path, text):
        file = self.repo / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(text, encoding="utf-8")

    def commit(self):
        self.git("add", "-A")
        self.git("commit", "-qm", "fixture")
        return self.git("rev-parse", "HEAD")

    def test_base_only_changes_are_excluded_from_pr_signals(self):
        self.write(PY_PATH, "def test_contract():\n    assert count() == 3\n")
        common = self.commit()
        self.git("checkout", "-qb", "base-branch")
        self.write(PY_PATH, "def test_contract():\n    assert count() == 4\n")
        base = self.commit()
        self.git("checkout", "--quiet", "--detach", common)
        self.write("README.md", "unrelated\n")
        head = self.commit()
        result = guard.report(self.repo, base, head)
        self.assertEqual(result["merge_base"], common)
        self.assertEqual(result["status"], "no-supported-changes")
        self.assertEqual(result["finding_count"], 0)

    def test_detected_rename_preserves_test_and_reports_leaving_discovery(self):
        old_path = "suite/test with tab\t_test.py"
        self.write(old_path, "def test_contract():\n    assert count() == 3\n")
        base = self.commit()
        new_path = "suite/test_renamed.py"
        self.git("mv", old_path, new_path)
        renamed = self.commit()
        result = guard.report(self.repo, base, renamed)
        self.assertEqual(result["files_scanned"], 1)
        self.assertEqual(result["scanned_paths"], [new_path])
        self.assertEqual(result["finding_count"], 0)
        self.git("mv", new_path, "suite/contract.py")
        moved = guard.report(self.repo, renamed, self.commit())
        self.assertEqual(moved["findings"][0]["signal"], "python-test-file-left-supported-discovery")
        self.assertEqual(moved["findings"][0]["base_line"], 1)

    def test_incomplete_unsupported_and_budget_cases_are_not_clean(self):
        self.write(PY_PATH, "def test_contract():\n    assert ok()\n")
        base = self.commit()
        self.write(PY_PATH, "def test_contract(:\n")
        self.write("Example.Tests/FooTests.go", "unparsed fixture source\n")
        head = self.commit()
        result = guard.report(self.repo, base, head)
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["unscanned_files"], [PY_PATH])
        self.assertEqual(result["unsupported_files"], 1)
        self.assertEqual(guard.report(self.repo, "a" * 40, head)["status"], "incomplete")
        with patch.object(guard, "LIMIT_FILES", 0):
            self.assertEqual(guard.report(self.repo, base, head)["reason"], "scan budget exhausted")

    def test_snapshot_findings_use_the_file_without_fabricating_line_spans(self):
        self.write("README.md", "fixture")
        base = self.commit()
        snapshot = "ui/__snapshots__/golden[fixture].snap"
        self.write(snapshot, "new accepted output")
        report = guard.report(self.repo, base, self.commit())
        row, = report["findings"]
        self.assertEqual((row["signal"], row["head_path"], row["head_line"]),
                         ("snapshot-or-golden-changed", snapshot, None))

    def test_historical_debt_change_stays_visible_and_truncation_is_partial(self):
        self.write(PY_PATH, "def test_contract():\n    assert value() == 3\n")
        debt = {"finding_id": "a" * 64, "path": PY_PATH, "decision": "historical-debt",
                "owner": "Maintainer", "evidence": "https://example.invalid/pr/1",
                "revisit": "next audit", "reason": "existing debt"}
        self.write(guard.REVIEW_PATH, json.dumps({"schema_version": 1, "records": [debt]}))
        base = self.commit()
        self.write(PY_PATH, "def test_contract():\n    assert value()\n")
        self.write(guard.REVIEW_PATH, json.dumps({"schema_version": 1, "records": []}))
        head = self.commit()
        full = guard.report(self.repo, base, head)
        self.assertEqual(full["finding_count"], 1)
        self.assertTrue(full["review_errors"][0].startswith("historical debt record changed or removed"))
        with patch.object(guard, "LIMIT_FINDINGS", 0):
            bounded = guard.report(self.repo, base, head)
            self.assertTrue(bounded["findings_truncated"])
            self.assertEqual(bounded["status"], "partial")
            self.assertEqual(bounded["finding_count"], 1)

    def test_report_only_returns_zero_with_a_finding(self):
        self.write(PY_PATH, "def test_contract():\n    assert value() == 3\n")
        base = self.commit()
        self.write(PY_PATH, "def test_contract():\n    assert value()\n")
        head = self.commit()
        output = self.repo / "report.json"
        process = subprocess.run(
            [sys.executable, str(Path(guard.__file__).resolve()), "--repo-root", str(self.repo),
             "--base", base, "--head", head, "--output", str(output)],
            timeout=10, capture_output=True, check=False,
        )
        self.assertEqual(process.returncode, 0, process.stderr)
        data = json.loads(output.read_text())
        self.assertEqual((data["mode"], data["finding_count"]), ("report-only", 1))
