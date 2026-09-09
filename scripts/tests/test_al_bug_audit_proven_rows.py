from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "audit",
    Path(__file__).resolve().parents[1] / "agent" / "al-bug-audit-proven-rows.py",
)
audit = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
# Registered before exec so @dataclass can resolve the module for its type checks.
sys.modules["audit"] = audit
SPEC.loader.exec_module(audit)


def test_classify_redaction_treadmill() -> None:
    assert audit.classify_row("AzureExtractorSensitivePropertyRedactor missed SuperAccessKey") == "redaction-treadmill"


def test_classify_substantive_cross_tenant() -> None:
    assert audit.classify_row("cross-tenant publish returned 200") == "substantive"


def test_classify_negation_treadmill_by_guard_symbol() -> None:
    # Keying on the guard symbol keeps novel surface phrases from falling through, which is
    # what made the earlier phrase-list classifier under-report the treadmill share.
    rows = (
        "`GenericArchitectureAdvicePatterns.IsAdviceStyleNegation` — `daren't ensure` prefix gap",
        "`RequestConstraintTokenMatcher.ContainsMidSentenceNegation` — `ought not require` negation gap",
        "`GenericArchitectureAdvicePatterns.IsSuffixNegatedAdviceFragment` — `weren't maintain` suffix gap",
    )

    for row in rows:
        assert audit.classify_row(row) == "negation-treadmill", row


def test_novel_negation_phrase_is_still_treadmill() -> None:
    # A phrase the classifier has never seen must still classify by its guard symbol.
    row = "`GenericArchitectureAdvicePatterns.IsAdviceStyleNegation` — `mustn't frobnicate` prefix gap"

    assert audit.is_treadmill(row)


def test_unclassified_is_not_counted_as_treadmill() -> None:
    assert audit.classify_row("some unrelated parser rounding difference") == "unclassified"
    assert not audit.is_treadmill("some unrelated parser rounding difference")


def test_treadmill_classes_exclude_substantive_and_unclassified() -> None:
    assert "substantive" not in audit.TREADMILL_CLASSES
    assert "unclassified" not in audit.TREADMILL_CLASSES


def test_stratified_sample_size() -> None:
    rows = (
        [audit.ProvenRow("archlucid-core", f"row {i}") for i in range(60)]
        + [audit.ProvenRow("api-governance-tenancy-controllers", f"api {i}") for i in range(30)]
        + [audit.ProvenRow("other-zone", f"other {i}") for i in range(40)]
    )
    sample = audit.stratified_sample(rows, seed=1)

    assert len(sample) == 100


def test_render_report_totals_cover_full_population_not_sample() -> None:
    rows = [
        audit.ProvenRow("zone-a", "`IsAdviceStyleNegation` — negation gap")
        for _ in range(200)
    ]
    report = audit.render_report(rows, audit.stratified_sample(rows, seed=1), seed=1)

    assert "all 200 rows" in report
    assert "100.0%" in report


if __name__ == "__main__":
    failures = 0

    for name, fn in sorted(globals().items()):
        if not name.startswith("test_") or not callable(fn):
            continue

        try:
            fn()
            print(f"PASS {name}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL {name}: {exc}")

    print(f"\n{failures} failure(s)")
    raise SystemExit(1 if failures else 0)
