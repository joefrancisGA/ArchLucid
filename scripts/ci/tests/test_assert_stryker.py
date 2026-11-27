"""Independent metric fixtures and evidence/CI controls for pinned Stryker.NET."""

from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import io
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from unittest import TestCase

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import assert_stryker_score_vs_baseline as checker
import stryker_evidence as evidence
from stryker_pr_plan import FULL_MATRIX
from refresh_stryker_baselines import STRYKER_TARGETS

ROOT = "/fixture/Product"


def report(*statuses, **extra):
    mutants = [{"id": str(i), "status": status} for i, status in enumerate(statuses)]
    return {"schemaVersion": "2", "projectRoot": ROOT,
            "files": {f"{ROOT}/Logic.cs": {"mutants": mutants}}, **extra}


class StrykerEvidenceTests(TestCase):
    def test_pinned_oracle_mixed_statuses(self):
        # Pinned upstream ProjectComponent: 2 detected / 4 valid, not 4 / 5.
        result = evidence.inventory(report("Killed", "Timeout", "Survived", "NoCoverage",
                                           "RuntimeError", "CompileError", "Ignored"))
        self.assertEqual(result["official_score_percent"], 50)
        self.assertEqual(result["official_detected_count"], 2)
        self.assertEqual(result["official_denominator"], 4)
        self.assertEqual(result["assertion_kill_percent"], 50)
        self.assertAlmostEqual(result["coverage_inclusive_kill_percent"], 100 / 3)
        self.assertEqual(result["status_counts"]["CompileError"], 1)
        self.assertIsNone(result["equivalent_count"])

    def test_lost_coverage_is_not_a_score_improvement(self):
        self.assertEqual(evidence.inventory(report("Killed", *["NoCoverage"] * 9))["official_score_percent"], 10)
        self.assertEqual(evidence.inventory(report("NoCoverage"))["official_score_percent"], 0)
        self.assertIsNone(evidence.inventory(report("CompileError"))["official_score_percent"])

    def test_nested_score_cannot_override_project_result(self):
        sample = report("Survived")
        sample["files"][f"{ROOT}/Logic.cs"]["mutationScore"] = 100
        self.assertEqual(evidence.inventory(sample)["official_score_percent"], 0)
        self.assertEqual(evidence.inventory(report("Killed", "Survived", mutationScore=50))["official_score_percent"], 50)
        with self.assertRaisesRegex(ValueError, "conflicts"):
            evidence.inventory(report("Survived", mutationScore=100))

    def test_invalid_scores_and_incomplete_reports(self):
        for value in (True, False, -1, 101, None, float("nan"), float("inf"), "100"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                evidence.inventory(report("Killed", mutationScore=value))
        for status in ("Pending", "unknown future status"):
            result = evidence.inventory(report("Killed", status))
            self.assertIsNone(result["official_score_percent"])
            self.assertIsNone(result["assertion_kill_percent"])
            self.assertFalse(result["complete_status_inventory"])

    def test_malformed_json_schema_duplicate_ids_and_wrong_paths(self):
        for raw in (b"{}", b'{"schemaVersion":"1"}', b'{"files":{},"files":{}}', b'{"mutationScore":NaN}'):
            with self.assertRaises(ValueError):
                evidence.inventory(evidence.read_json(raw))
        sample = report("Killed")
        sample["files"][f"{ROOT}/Logic.cs"]["mutants"].append({"id": "0", "status": "Survived"})
        with self.assertRaisesRegex(ValueError, "duplicate mutant"):
            evidence.inventory(sample)
        sample = report("Killed")
        sample["files"]["/other/Logic.cs"] = sample["files"].pop(f"{ROOT}/Logic.cs")
        with self.assertRaisesRegex(ValueError, "outside"):
            evidence.inventory(sample)

    def test_console_evidence_requires_actual_completion_and_tool_pin(self):
        log = ("Version: 4.16.0\nNumber of tests found: 1 for project Probe. Initial test run started.\n"
               "2 mutants created\nThe final mutation score is 50.00 %\n")
        self.assertEqual(evidence.console_observations(log)["tool_score_percent"], 50)
        for value in (log.replace("4.16.0", "5.0.0"), log.replace("found: 1", "found: 0"),
                      log + "The final mutation score is 60.00%\n", log.split("The final")[0]):
            with self.assertRaises(ValueError):
                evidence.console_observations(value)

    def test_baseline_inventory_is_unchanged_and_consumer_targets_match(self):
        baseline = evidence.read_json((Path(checker.__file__).parent / "stryker-baselines.json").read_bytes())
        self.assertEqual(STRYKER_TARGETS, FULL_MATRIX)
        self.assertEqual({name for name in baseline if not name.startswith("_")}, {name for name, _ in FULL_MATRIX})
        self.assertEqual(len(FULL_MATRIX), 10)
        for label, _ in FULL_MATRIX:
            self.assertEqual(evidence.percent(baseline[label]["mutationScore"]), baseline[label]["mutationScore"])


class StrykerGateTests(TestCase):
    def setUp(self):
        self.root = Path(self.enterContext(TemporaryDirectory()))
        self.run = self.root / "output"
        self.run.mkdir()
        self.config = self.root / "config.json"
        self.config.write_text('{"stryker-config":{"project":"Product/Product.csproj","reporters":["json"]}}')
        for args in (("init", "-q"), ("config", "user.email", "test@example.invalid"),
                     ("config", "user.name", "Fixture"), ("add", "config.json"), ("commit", "-qm", "fixture")):
            subprocess.run(["git", *args], cwd=self.root, check=True, capture_output=True)
        self.head = evidence.head_revision(self.root)
        self.baseline = self.root / "baseline.json"
        self.baseline.write_text('{"Fixture":{"mutationScore":50}}')
        self.raw_report = self.run / "mutation-report.json"

    def write(self, data, tool_score, base=None, **overrides):
        raw = json.dumps(data).encode()
        self.raw_report.write_bytes(raw)
        untrusted = {"schema_version": 1, "tool_version": evidence.VERSION, "head": self.head, "target": "Fixture",
                     "config_sha256": evidence.digest(self.config.read_bytes()), "project_dir": "Product", "base": base,
                     "exit_code": 0, "initial_tests_found": 2, "report_sha256": evidence.digest(raw),
                     "mutants_created": sum(len(node["mutants"]) for node in data["files"].values()),
                     "tool_score_percent": tool_score} | overrides
        (self.run / evidence.RECEIPT).write_text(json.dumps(untrusted))

    def gate(self, *extra):
        with redirect_stdout(io.StringIO()) as out, redirect_stderr(io.StringIO()) as err:
            status = checker._main(["--baseline", str(self.baseline), "--label", "Fixture",
                                    "--repo-root", str(self.root), "--config", "config.json",
                                    "--stryker-root", str(self.run), *extra])
        return status, out.getvalue() + err.getvalue()

    def test_scored_run_must_meet_baseline_and_reconcile_runner(self):
        self.write(report("Killed", "Survived"), 50)
        self.assertEqual(self.gate()[0], 0)
        sample = report("Survived")
        sample["files"][f"{ROOT}/Logic.cs"]["mutationScore"] = 100
        self.write(sample, 0)
        self.assertEqual(self.gate()[0], 1)
        self.write(sample, 100)
        self.assertEqual(self.gate()[0], 2)

    def test_stale_tampered_wrong_run_and_missing_or_ambiguous_report(self):
        for changed in ({"head": "a"*40}, {"target": "Other"}, {"config_sha256": "0"*64},
                        {"report_sha256": "0"*64}, {"project_dir": "Other"},
                        {"mutants_created": 2}, {"initial_tests_found": 0}, {"exit_code": 1}):
            self.write(report("Killed"), 100, **changed)
            self.assertEqual(self.gate()[0], 2, changed)
        self.write(report("Killed"), 100)
        sub = self.run / "other"
        sub.mkdir()
        (sub / self.raw_report.name).write_bytes(self.raw_report.read_bytes())
        self.assertEqual(self.gate()[0], 2)
        (sub / self.raw_report.name).unlink()
        self.raw_report.unlink()
        self.assertEqual(self.gate()[0], 2)

    def test_only_attested_differential_empty_scope_is_not_scored(self):
        base = "b" * 40
        sample = report("Ignored")
        sample["files"][f"{ROOT}/Logic.cs"]["mutants"][0]["statusReason"] = "Removed by since filter"
        self.write(sample, None, base=base)
        self.assertEqual(self.gate("--base", base)[0], 2)
        status, output = self.gate("--base", base, "--allow-zero-denominator")
        self.assertEqual(status, 0)
        self.assertIn("NOT SCORED", output)
        self.assertNotIn("meets the baseline", output)
        for invalid in (report("CompileError"), report("RuntimeError"), report("Ignored"), report("Pending")):
            self.write(invalid, None, base=base)
            self.assertEqual(self.gate("--base", base, "--allow-zero-denominator")[0], 2)
        self.write(report(), None)
        self.assertEqual(self.gate()[0], 2)
