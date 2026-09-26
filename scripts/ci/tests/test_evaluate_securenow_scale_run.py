from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("scale", ROOT / "scripts/ci/evaluate_securenow_scale_run.py")
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def _summary() -> dict:
    return {"metrics": {
        "http_req_failed": {"values": {"rate": 0.001}, "thresholds": {"rate<0.01": {"ok": True}}},
        "http_req_duration": {"values": {"p(95)": 1100}, "thresholds": {"p(95)<3000": {"ok": True}}},
        "checks": {"values": {"rate": 1.0}, "thresholds": {"rate>0.99": {"ok": True}}},
        "http_reqs": {"values": {"count": 200}},
    }}


def _run() -> dict:
    return {"profile": "synthetic-multitenant", "tenantCount": 2, "gitSha": "abc123",
            "environment": "staging", "workload": "scripts/load/securenow-multitenant-read.js"}


def test_qualified_synthetic_run_has_explicit_limitations() -> None:
    result = module.evaluate(_summary(), _run())
    assert result["status"] == "PASS"
    assert result["evidenceClass"] == "synthetic-multitenant"
    assert "does not prove production" in result["limitations"]


def test_missing_metrics_failed_threshold_and_one_tenant_hold() -> None:
    summary, run = _summary(), _run()
    summary["metrics"]["checks"]["thresholds"]["rate>0.99"]["ok"] = False
    summary["metrics"]["http_reqs"]["values"] = {}
    run["tenantCount"] = 1
    result = module.evaluate(summary, run)
    assert result["status"] == "HOLD"
    assert len(result["errors"]) >= 3
