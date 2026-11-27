#!/usr/bin/env python3
"""Checks for the revert verifier and regression evidence receipts (no .NET build)."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from tempfile import TemporaryDirectory
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

_SPEC = importlib.util.spec_from_file_location(
    "verifier",
    _AGENT_DIR / "al-bug-verify-proven-revert.py",
)
verifier = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["verifier"] = verifier
_SPEC.loader.exec_module(verifier)

import al_bug_ledger  # noqa: E402

sys.path.insert(0, str(_AGENT_DIR.parent / "assurance"))
import regression_ledger  # noqa: E402


def test_extract_test_citation_from_backticks() -> None:
    text = "`FindingJsonConverterTests.Reads_schema_version` — boolean coercion abcdef1"
    assert verifier.extract_test_citation(text) == "FindingJsonConverterTests.Reads_schema_version"


def test_extract_commit_sha() -> None:
    assert verifier.extract_commit_sha("merged in deadbeef1 2026-09-01") == "deadbeef1"


def test_is_excluded_revert_path() -> None:
    assert verifier.is_excluded_revert_path("ArchLucid.Core.Tests/FooTests.cs")
    assert verifier.is_excluded_revert_path("docs/library/AL_BUG_HUNT_LEDGER.md")
    assert not verifier.is_excluded_revert_path("ArchLucid.Core/Json/StrictSchemaVersionReader.cs")


def test_classify_after_test_run() -> None:
    passed = verifier.TestObservation("passed", "ArchLucid.FooTests.Bar")
    failed = verifier.TestObservation("failed", passed.identity, "expected lower bound")
    assert verifier.classify_after_test_run(passed, failed, "expected lower bound") == "guarded"
    assert verifier.classify_after_test_run(passed, passed, "expected lower bound") == "unguarded"
    assert verifier.classify_after_test_run(passed, failed, "some other reason") == "could-not-run"
    assert verifier.classify_after_test_run(passed, failed, None) == "could-not-run"
    assert verifier.classify_after_test_run(failed, failed, "expected lower bound") == "could-not-run"
    assert verifier.classify_after_test_run(passed, verifier.TestObservation("failed", "Other.Bar", "expected lower bound"),
                                            "expected lower bound") == "could-not-run"


def test_render_report_fixture() -> None:
    results = [
        verifier.RowVerification("zone-a", "row", "guarded", test_name="FooTests.Bar", commit_sha="abc1234"),
        verifier.RowVerification("zone-b", "row2", "unguarded", test_name="BarTests.Baz", commit_sha="def5678"),
    ]
    report = verifier.render_report(results, 40, 12)
    assert "Unguarded rows" in report
    assert "zone-b" in report
    assert "**Rows in selection window:** 40" in report
    assert "**Rows in selection window citing a test and commit:** 12" in report


def test_fail_on_unguarded_exit_code() -> None:
    unguarded = verifier.RowVerification("z", "t", "unguarded")
    guarded = verifier.RowVerification("z", "t", "guarded")
    assert any(item.classification == "unguarded" for item in [unguarded])
    assert not any(item.classification == "unguarded" for item in [guarded])


def test_select_rows_since_filter() -> None:
    from datetime import datetime, timezone

    rows = [
        al_bug_ledger.ProvenRow("z", "old row 2020-01-01"),
        al_bug_ledger.ProvenRow("z", "new row 2026-09-05"),
    ]
    since = datetime(2026, 9, 1, tzinfo=timezone.utc)
    selected = verifier.select_rows(rows, None, since, 10)
    assert len(selected) == 1
    assert "2026-09-05" in selected[0].text


def test_new_unguarded_minus_baseline() -> None:
    baseline = {"zone-b|BarTests.Baz|def5678"}
    results = [
        verifier.RowVerification("zone-a", "row", "unguarded", test_name="FooTests.Bar", commit_sha="abc1234"),
        verifier.RowVerification("zone-b", "row2", "unguarded", test_name="BarTests.Baz", commit_sha="def5678"),
        verifier.RowVerification("zone-c", "row3", "could-not-run", test_name="SkipTests.X", commit_sha="aaa1111"),
    ]
    fresh = verifier.new_unguarded_keys(results, baseline)
    assert fresh == ["zone-a|FooTests.Bar|abc1234"]
    assert verifier.unguarded_key(results[1]) in baseline


def test_could_not_run_is_not_new_unguarded() -> None:
    results = [
        verifier.RowVerification("z", "t", "could-not-run", test_name="FooTests.Bar", commit_sha="abc1234"),
        verifier.RowVerification("z", "t", "no-test-cited"),
        verifier.RowVerification("z", "t", "no-commit-cited"),
    ]
    assert verifier.new_unguarded_keys(results, set()) == []


def test_fail_on_unguarded_still_detects_any() -> None:
    unguarded = verifier.RowVerification("z", "t", "unguarded", test_name="T", commit_sha="abc1234")
    assert any(item.classification == "unguarded" for item in [unguarded])


def test_uncheckable_key_in_baseline_exits_zero_logic() -> None:
    baseline = {"zone-a|no-test-cited||"}
    results = [verifier.RowVerification("zone-a", "row", "no-test-cited")]
    assert verifier.new_uncheckable_keys(results, baseline) == []


def test_extra_no_test_cited_is_new_uncheckable() -> None:
    results = [verifier.RowVerification("zone-a", "row", "no-test-cited")]
    assert verifier.new_uncheckable_keys(results, set()) == ["zone-a|no-test-cited||"]


def test_could_not_run_in_new_uncheckable() -> None:
    results = [
        verifier.RowVerification(
            "zone-a",
            "row",
            "could-not-run",
            test_name="FooTests.Bar",
            commit_sha="abc1234",
        )
    ]
    fresh = verifier.new_uncheckable_keys(results, set())
    assert fresh == ["zone-a|could-not-run|FooTests.Bar|abc1234"]


def test_unguarded_ratchet_ignores_uncheckable() -> None:
    results = [verifier.RowVerification("z", "t", "no-test-cited")]
    assert verifier.new_unguarded_keys(results, set()) == []


def test_trx_distinguishes_assertion_failures_from_no_execution_or_bad_results() -> None:
    with TemporaryDirectory() as directory:
        trx = Path(directory) / "case.trx"
        read = lambda status: verifier.read_trx(trx, "FooTests.Bar", status)
        assert read(1).outcome == "not-run"  # Nonzero exit with no result, e.g. a compile error.
        trx.write_text("<TestRun/>")
        assert read(0).outcome == "not-run"
        passed = '<UnitTestResult testId="a" outcome="Passed"/>'
        failed = ('<UnitTestResult testId="a" outcome="Failed"><Output><ErrorInfo>'
                  '<Message>expected lower bound</Message></ErrorInfo></Output></UnitTestResult>')
        definition = ('<TestDefinitions><UnitTest id="a"><TestMethod className="ArchLucid.FooTests" name="Bar"/>'
                      '</UnitTest></TestDefinitions>')

        def write(results: str) -> None:
            counts = (f'<ResultSummary><Counters total="1" executed="1" passed="{int(passed in results)}" '
                      f'failed="{int(failed in results)}"/></ResultSummary>')
            trx.write_text(f'<TestRun xmlns="urn:trx"><Results>{results}</Results>{definition}{counts}</TestRun>')

        write(passed)
        assert read(0).identity == "ArchLucid.FooTests.Bar"
        assert read(0).outcome == "passed"
        assert read(1).outcome == "uncheckable"
        write(failed)
        assert read(1).outcome == "failed" and read(1).failure_message == "expected lower bound"
        assert read(0).outcome == "uncheckable"
        assert read(124).outcome == "uncheckable"
        assert verifier.read_trx(trx, "FooTests.Other", 1).outcome == "uncheckable"
        write(failed + passed)
        assert read(1).outcome == "uncheckable"
        write(passed)
        trx.write_text(trx.read_text().replace('executed="1"', 'executed="0"'))
        assert read(0).outcome == "uncheckable"
        write('<UnitTestResult testId="a" outcome="NotExecuted"/>')
        assert read(0).outcome == "not-run"


def test_workspace_isolation_and_same_test_red_green_after_production_revert() -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)

        def git(*args: str) -> str:
            return subprocess.check_output(["git", *args], cwd=root, text=True, stderr=subprocess.STDOUT).strip()

        git("init", "-q")
        git("config", "user.name", "Fixture")
        git("config", "user.email", "fixture@example.invalid")
        production = root / "product.py"
        production.write_text("def lower_bound(value):\n    return value\n")
        git("add", "product.py")
        git("commit", "-qm", "baseline")
        production.write_text("def lower_bound(value):\n    return max(value, 0)\n")
        case = root / "Example.Tests" / "check.py"
        case.parent.mkdir()
        case.write_text("from product import lower_bound\nassert lower_bound(-1) == 0, 'expected lower bound'\n")
        git("add", "product.py", "Example.Tests/check.py")
        git("commit", "-qm", "corrected behavior and regression")
        sha = git("rev-parse", "HEAD")
        production.write_text("user working-tree edit\n")
        before = git("status", "--porcelain")
        seen = []

        def execute(_test: str, _sha: str, cwd: Path):
            seen.append(cwd)
            completed = subprocess.run(
                [sys.executable, "-c", (cwd / "Example.Tests/check.py").read_text()],
                cwd=cwd, capture_output=True, text=True, timeout=5,
            )
            return verifier.TestObservation("passed" if completed.returncode == 0 else "failed",
                                            "ArchLucid.FooTests.Bar", completed.stderr)

        row = al_bug_ledger.ProvenRow("zone", f"`FooTests.Bar` — {sha} [expected-failure: expected lower bound]")
        result = verifier.verify_row(row, root, verifier.default_git_runner, execute)
        assert result.classification == "guarded", result.detail
        assert len(seen) == 2 and seen[0] == seen[1] and seen[0] != root
        assert not seen[0].exists()
        assert production.read_text() == "user working-tree edit\n"
        assert git("rev-parse", "HEAD") == sha
        assert git("status", "--porcelain") == before
        assert git("worktree", "list", "--porcelain").count("worktree ") == 1


def receipt() -> dict:
    identity = "Namespace.FooTests.Bar"
    return {
        "schemaVersion": 1, "defectId": "SYNTHETIC-1", "regressionDisposition": "regression-test",
        "intendedBehavior": "Negative values clamp to zero", "testIdentity": identity,
        "expectedFailureReason": "expected lower bound",
        "baseline": {"revision": "a" * 40, "testIdentity": identity, "executedCount": 1,
                     "exitCode": 1, "outcome": "assertion-failed", "failureReason": "expected lower bound"},
        "corrected": {"revision": "b" * 40, "testIdentity": identity, "executedCount": 1,
                      "exitCode": 0, "outcome": "passed"},
    }


def write_receipt(root: Path, evidence: dict) -> dict:
    raw = json.dumps(evidence).encode()
    (root / "proof.json").write_bytes(raw)
    return {"defectId": "SYNTHETIC-1", "regressionDisposition": evidence["regressionDisposition"],
            "regressionArtifact": "proof.json", "regressionArtifactSha256": hashlib.sha256(raw).hexdigest()}


def test_regression_ledger_accepts_list_and_envelope_with_matching_receipt() -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        row = write_receipt(root, receipt())
        for payload in ([row], {"defects": [row]}):
            assert not regression_ledger.validate(payload, artifact_root=root)


def test_regression_ledger_rejects_malformed_records_and_unbound_receipts() -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        row = write_receipt(root, receipt())
        for payload in ({}, {"defects": None}, [None], [row, row], [dict(row, confirmed="false")],
                        [dict(row, regressionArtifact=None)], [dict(row, regressionArtifact="../proof.json")],
                        [dict(row, regressionArtifact="missing.json")], [dict(row, regressionArtifactSha256="0" * 64)],
                        [dict(row, defectId="SYNTHETIC-2")]):
            assert regression_ledger.validate(payload, artifact_root=root), payload
        (root / "proof.json").write_text("{}")
        assert any("does not match" in error for error in regression_ledger.validate([row], artifact_root=root))


def test_regression_ledger_rejects_compile_timeout_skips_and_mismatched_test_reasons() -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        for change in ({"outcome": "compile-error"}, {"exitCode": 124}, {"executedCount": 0},
                       {"outcome": "skipped"}, {"failureReason": "different issue"},
                       {"testIdentity": "OtherTests.Bar"}, {"revision": "b" * 40}):
            evidence = receipt()
            evidence["baseline"].update(change)
            assert regression_ledger.validate([write_receipt(root, evidence)], artifact_root=root), change
        evidence = receipt()
        evidence["corrected"]["exitCode"] = 1
        assert regression_ledger.validate([write_receipt(root, evidence)], artifact_root=root)


def test_regression_ledger_accepts_structural_proof_and_accountable_exception() -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        evidence = {"schemaVersion": 1, "defectId": "SYNTHETIC-1", "regressionDisposition": "structural-prevention",
                    "intendedBehavior": "Invalid state cannot compile",
                    "proof": {"revision": "a" * 40, "outcome": "verified", "mechanism": "type invariant",
                              "verificationReference": "strict compile fixture NegativeCase"}}
        exception = {"defectId": "SYNTHETIC-2", "regressionDisposition": "documented-nonautomatable",
                     "owner": "team", "approvedBy": "reviewer", "reason": "one-off manual dependency",
                     "revisitCondition": "revisit when the external interface becomes replayable"}
        assert not regression_ledger.validate([write_receipt(root, evidence), exception], artifact_root=root)
        assert regression_ledger.validate([dict(exception, owner="")], artifact_root=root)
        evidence["proof"]["outcome"] = "not-run"
        assert regression_ledger.validate([write_receipt(root, evidence)], artifact_root=root)


def test_regression_ledger_cli_reports_invalid_input_without_traceback() -> None:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        ledger = root / "ledger.json"
        script = Path(regression_ledger.__file__)
        for content, status in (('{"defects":[],"defects":[]}', 2), ("{", 2), ("{}", 1), ("[]", 0)):
            ledger.write_text(content)
            cp = subprocess.run([sys.executable, str(script), str(ledger), "--enforce"],
                                capture_output=True, text=True, timeout=5)
            assert cp.returncode == status and not cp.stderr, cp.stderr
            report = json.loads(cp.stdout)
            assert bool(report["errorCount"]) == bool(status)
            assert report["recordCount"] == report["confirmedCount"] == (None if status else 0)


def test_missing_commit_is_uncheckable_for_the_existing_ratchet() -> None:
    results = [verifier.RowVerification("z", "row", "no-commit-cited", test_name="FooTests.Bar")]
    assert verifier.new_uncheckable_keys(results, set()) == ["z|no-commit-cited|FooTests.Bar|"]


if __name__ == "__main__":
    failures = 0
    total = 0
    for name, fn in sorted(globals().items()):
        if not name.startswith("test_") or not callable(fn):
            continue
        total += 1
        try:
            fn()
            print(f"PASS {name}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL {name}: {exc}")
    print(f"\n{total} checks, {failures} failure(s)")
    raise SystemExit(1 if failures else 0)
