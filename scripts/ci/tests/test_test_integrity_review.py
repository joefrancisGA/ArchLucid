"""Cross-runner, disposition, and registered-source controls for FND-165/171."""

from collections import Counter
from datetime import date
import json
from pathlib import Path
import sys
import unittest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS.parent / "assurance"))

import check_independent_oracles as oracle  # noqa: E402
import report_test_integrity_diff as report  # noqa: E402
from test_integrity_patterns import token_anchors  # noqa: E402
from test_integrity_review import disposition_index, register_findings  # noqa: E402


def lexical(old, new, kind, path):
    return report.scan_anchors(token_anchors(old, kind), token_anchors(new, kind), path, path)


class CrossRunner(unittest.TestCase):
    def test_dotnet_exact_anchors_for_expected_outcome_and_skips(self):
        path = "Example.Tests/QuotaTests.cs"
        old = "[Fact]\npublic void Counts() { Assert.Equal(3, Actual()); }"
        new = '[Fact(Skip = "fixture")]\npublic void Counts() { Assert.Equal(1, Actual()); }'
        rows = lexical(old, new, "dotnet-test", path)
        self.assertEqual([(r["signal"], r["base_line"], r["head_line"]) for r in rows],
                         [("assertion-changed", 2, 2), ("skip-or-exclusive-added-or-changed", None, 1)])

    def test_fluent_and_test_name_refactors_are_not_reductions(self):
        old = "[Fact] public void OldName() { actual.Should().Be(3); }"
        new = "// matcher lookalike: expect(1).toBe(1)\n[Fact]\nvoid NewName(){ actual . Should ( ) . Be(3); }"
        self.assertEqual(lexical(old, new, "dotnet-test", "Example.Tests/QuotaTests.cs"), [])

    def test_typescript_negative_control_tolerance_exclusive_and_mock(self):
        path = "ui/a.test.ts"
        old = 'test("bounds", () => {\n expect(fn).toThrow(RangeError);\n expect(n).toBeCloseTo(1, 8);\n});'
        new = 'vi.mock("./data");\ntest.only("bounds", () => {\n expect(n).toBeCloseTo(1, 1);\n});'
        rows = lexical(old, new, "js-test", path)
        got = {row["signal"]: (row["base_line"], row["head_line"]) for row in rows}
        self.assertEqual(got, {"negative-control-removed": (2, None), "tolerance-changed": (3, 3),
                               "mock-setup-added-or-changed": (None, 1),
                               "skip-or-exclusive-added-or-changed": (None, 2)})

    def test_typescript_playwright_declaration_and_snapshot_assertion(self):
        old = 'test("view", async () => { await expect(locator).toHaveScreenshot("a.png"); });'
        new = old.replace('"a.png"', '"b.png"')
        rows = lexical(old, new, "js-test", "e2e/view.spec.ts")
        self.assertEqual([(r["signal"], r["head_line"]) for r in rows],
                         [("snapshot-assertion-changed", 1)])

    def test_named_expected_value_changes_even_when_assertion_is_unchanged(self):
        old = '[Fact] void Counts() { int expected = 3; Assert.Equal(expected, Actual()); }'
        new = old.replace('expected = 3', 'expected = 1')
        rows = lexical(old, new, "dotnet-test", "Example.Tests/QuotaTests.cs")
        self.assertEqual([r["signal"] for r in rows], ["expected-outcome-changed"])

    def test_named_runner_settings_and_precise_suppression(self):
        for path, old, new in (
                ("test.runsettings", "<TestCaseFilter>All</TestCaseFilter>", "<TestCaseFilter>Unit</TestCaseFilter>"),
                ("vitest.config.ts", "  exclude: [],", "  exclude: ['e2e/**'],"),
                (".editorconfig", "dotnet_diagnostic.CA1000.severity = warning",
                 "dotnet_diagnostic.CA1000.severity = none")):
            with self.subTest(path=path):
                self.assertEqual(report.path_kind(path), "runner-config")
                matches = report.scan_selection(old, new, "runner-config", path, path)
                self.assertEqual((matches[0]["base_line"], matches[0]["head_line"]), (1, 1))
        self.assertEqual(report.path_kind("suite/__snapshots__/shape.snap"), "snapshot")
        self.assertEqual(len(report.scan_selection("", "#pragma warning disable CA1000",
                                                  "suppression", "a.cs", "a.cs")), 1)

    def test_python_alias_fixture_and_branch_changes(self):
        path = "tests/test_p.py"
        previous = ("import pytest as pt\n@pytest.fixture\ndef source():\n    return Real()\n"
                    "def test_a():\n    if ready():\n        assert source().x == 5\n")
        after = previous.replace("Real()", "Mock()").replace("ready()", "False").replace(
                                 "def test_a()", "@pt.mark.skip\ndef test_a()")
        got = {r["signal"] for r in report.scan_python(previous, after, path, path)}
        self.assertEqual(got, {"fixture-body-changed", "mock-setup-added-or-changed",
                               "assertion-branch-guard-changed", "python-skip-or-xfail-added-or-changed"})

    def test_new_standalone_mock_fixture_does_not_imply_a_coverage_reduction(self):
        path = "Demo.Tests/ContractTests.cs"
        existing = "[Fact] void Existing() { Assert.True(Run()); }"
        addition = '[Fact] void New() { var fake = new Mock<IService>(); Assert.True(fake.Object.Read()); }'
        self.assertEqual(lexical(existing, existing + addition, "dotnet-test", path), [])
        self.assertEqual(report.scan_anchors([], token_anchors(addition, "dotnet-test"), None, path), [])
        changed = existing.replace("Assert.True(Run());", "var fake = new Mock<IService>(); Assert.True(Run());")
        self.assertEqual([r["signal"] for r in lexical(existing, changed, "dotnet-test", path)],
                         ["mock-setup-added-or-changed"])

    def test_new_shared_configuration_mock_and_new_skipped_tests_stay_visible(self):
        fixture = "import pytest\n@pytest.fixture\ndef source():\n    return Mock()"
        signals = report.scan_python("", fixture, None, "tests/conftest.py")
        self.assertEqual([r["signal"] for r in signals], ["mock-setup-added-or-changed"])
        test = 'test.only("new", () => { expect(1).toBe(1); });'
        signals = report.scan_anchors([], token_anchors(test, "js-test"), None, "src/new.test.ts")
        self.assertEqual([r["signal"] for r in signals], ["skip-or-exclusive-added-or-changed"])

    def test_strings_and_formatting_are_not_runner_controls(self):
        old = 'test("only text", () => { const p = "expect(1).toBe(true)"; expect(actual).toBe(2); });'
        new = old.replace("expect(1).toBe(true)", "test.only()").replace("toBe(2)", "toBe ( 2 )")
        self.assertEqual(lexical(old, new, "js-test", "ui/a.test.ts"), [])
        with self.assertRaises(ValueError):
            token_anchors("test(]", "js-test")


class Dispositions(unittest.TestCase):
    def datum(self, base_line=2):
        return report.finding("assertion-changed", "x.test.ts", "x.test.ts",
                              base_line=base_line, test="case", evidence="before/after")

    def test_ids_ignore_line_movement_and_proposals_stay_visible(self):
        initial = [self.datum()]
        register_findings(initial, {}, {}, Counter())
        key = initial[0]["finding_id"]
        pending = {key: {"path": "x.test.ts", "decision": "reviewed-refactor"}}
        next_rows = [self.datum(95)]
        register_findings(next_rows, {}, pending, Counter())
        self.assertEqual(next_rows[0]["finding_id"], key)
        self.assertEqual(next_rows[0]["review_status"], "new")
        self.assertEqual(next_rows[0]["proposed_disposition"], "reviewed-refactor")

    def test_expired_and_out_of_scope_records_are_not_accepted(self):
        row = self.datum()
        register_findings([row], {}, {}, Counter())
        record = {"finding_id": row["finding_id"], "path": "x.test.ts", "decision": "exception",
                  "owner": "Maintainer", "evidence": "https://example.invalid/pr/1", "revisit": "fixture update",
                  "reason": "temporary", "expires": "2026-11-27"}
        source = {"schema_version": 1, "records": [record]}
        before = disposition_index(json.dumps(source), date(2026, 11, 27))
        found = [self.datum()]
        register_findings(found, before, {}, Counter())
        self.assertEqual(found[0]["review_status"], "expired-exception")
        record["path"] = "unrelated.test.ts"
        before = disposition_index(json.dumps(source), date(2026, 11, 26))
        found = [self.datum()]
        register_findings(found, before, {}, Counter())
        self.assertEqual(found[0]["review_status"], "new")
        del record["expires"]
        with self.assertRaises(ValueError):
            disposition_index(json.dumps(source), date(2026, 11, 27))


class OracleProvenance(unittest.TestCase):
    def row(self):
        return {"product": "ArchLucid", "path": "suite/VectorTests.cs", "test": "KnownVector",
                "classification": "independent", "contract": "ratio", "intent": "preserve ratio",
                "derivation": "hand calculated", "cases": ["positive", "boundary"], "limitations": [],
                "source": {"kind": "worked-example", "revision": "d" * 40,
                           "path": "docs/worked.md", "locator": "2/3"}}

    def test_requires_pinned_locator_and_test_identity(self):
        doc = {"schema_version": 1, "tests": [self.row()]}
        seen = []
        def lookup(rev, path, locator, digest):
            seen.append((rev, path, locator, digest))
            return True
        self.assertEqual(oracle.inspect(doc, lookup)["errors"], [])
        self.assertEqual(seen, [("d" * 40, "docs/worked.md", "2/3", None),
                                (None, "suite/VectorTests.cs", "KnownVector", None)])
        self.assertEqual(len(oracle.inspect(doc, lambda *args: False)["errors"]), 2)
        doc["tests"][0]["source"]["revision"] = "master"
        self.assertIn("invalid independent source", oracle.inspect(doc)["errors"][0])

    def test_coupled_and_unresolved_are_not_counted_as_independent(self):
        row = self.row() | {"classification": "coupled", "revisit": "derive from a requirement",
                            "requirement_conflict": "two definitions disagree"}
        report = oracle.inspect({"schema_version": 1, "tests": [row]})
        self.assertEqual(report["classifications"], {"coupled": 1})
        self.assertEqual(report["unresolved"], ["KnownVector"])
        self.assertTrue(oracle.inspect({"schema_version": 1, "tests": [row, row]})["errors"])

    def test_rejects_a_reference_to_same_test_and_malformed_values(self):
        row = self.row()
        row["source"] |= {"kind": "reference-evaluator", "path": row["path"]}
        self.assertTrue(oracle.inspect({"schema_version": 1, "tests": [row]})["errors"])
        row["product"] = []
        self.assertTrue(oracle.inspect({"schema_version": 1, "tests": [row]})["errors"])


if __name__ == "__main__":
    unittest.main()
