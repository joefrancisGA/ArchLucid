from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("admission", ROOT / "scripts/ci/evaluate_architecture_admission_run.py")
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def test_admission_requires_completed_checked_requests_and_no_drops() -> None:
    metrics = {"http_reqs": {"values": {"count": 24}},
               "http_req_failed": {"values": {"rate": 0}},
               "http_req_duration": {"values": {"p(95)": 500}},
               "checks": {"values": {"rate": 1}},
               "dropped_iterations": {"values": {"count": 0}}}
    assert module.evaluate({"metrics": metrics}, git_sha="abc")["status"] == "PASS"
    metrics["http_reqs"]["values"]["count"] = 0
    metrics["dropped_iterations"]["values"]["count"] = 1
    result = module.evaluate({"metrics": metrics}, git_sha="abc")
    assert result["status"] == "HOLD"
    assert len(result["errors"]) == 2
