from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("roi_measurement", ROOT / "scripts/ci/report_roi_measurement_evidence.py")
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def test_measured_difference_requires_both_values_and_sources() -> None:
    report = module.evaluate(
        {"runId": "r1", "baselineReviewCycleHours": 10, "architectPrepHoursPerReview": 4,
         "baselineReviewCycleSource": "buyer-provided"},
        {"schema": "archlucid.roi-measured-outcomes.v1", "runId": "r1",
         "measurementKind": "observed", "sourceArtifact": "run-timing.json",
         "reviewCycleHours": 7, "architectHoursPerReview": 3}, run_id="r1")
    assert report["rows"][0]["hoursSaved"] == 3
    assert report["rows"][1]["hoursSaved"] == 1
    assert report["rows"][2]["status"] == "INSUFFICIENT_DATA"
    assert report["status"] == "MEASURED", "optional evidence assembly time must not block measured required metrics"
    assert report["projectedDollarValue"] is None


def test_unobserved_or_mismatched_run_cannot_be_presented_as_measured() -> None:
    baseline = {"baselineReviewCycleHours": 10, "baselineReviewCycleSource": "buyer-provided"}
    outcome = {"schema": "archlucid.roi-measured-outcomes.v1", "runId": "r1",
               "measurementKind": "estimate", "reviewCycleHours": 7, "sourceArtifact": "estimate.json"}
    assert module.evaluate(baseline, outcome, run_id="r1")["rows"][0]["hoursSaved"] is None
    try:
        module.evaluate(baseline, outcome, run_id="r2")
    except ValueError as exc:
        assert "runId" in str(exc)
    else:
        raise AssertionError("mismatched run accepted")
