from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SPEC = importlib.util.spec_from_file_location("support_drill", ROOT / "scripts/ci/run_support_failure_drill.py")
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def test_synthetic_rehearsal_covers_failure_and_recovery(tmp_path: Path) -> None:
    result = module.run(tmp_path, module.synthetic_events(), synthetic=True)
    assert result["status"] == "PASS"
    assert result["bundleStatus"] == "PASS"
    assert len(result["rows"]) == 3
    assert all(row["observedStates"][-1] == "RECOVERED" for row in result["rows"])


def test_missing_recovery_holds_and_untrusted_values_are_not_exported(tmp_path: Path) -> None:
    events = module.synthetic_events()[:-1]
    events[0]["correlationId"] = "Bearer SecretTokenThatMustNeverBeExported123456"
    events[0]["state"] = "Password=SecretTokenThatMustNeverBeExported123456"
    result = module.run(tmp_path, events, synthetic=False)
    assert result["status"] == "HOLD"
    assert result["redactionStatus"] == "PASS"
    assert "SecretToken" not in (tmp_path / "support-bundle-summary.md").read_text()
    assert "SecretToken" not in (tmp_path / "support-failure-drill.json").read_text()


def test_staging_capture_checks_order_identity_and_redacts_raw_events(tmp_path: Path) -> None:
    capture = tmp_path / "staging.jsonl"
    events = module.synthetic_events()
    for index, event in enumerate(events):
        event.update(environment="staging", eventId=f"receipt-{index}",
                     correlationId=f"observed-{event['scenario']}", artifactId=f"artifact-{event['scenario']}",
                     occurredAt=f"2026-09-26T00:{index:02d}:00Z", secret="SensitiveValueMustNotExport")
    capture.write_text("\n".join(json.dumps(event) for event in events))
    imported, digest = module.read_staging_events(capture)
    result = module.run(tmp_path / "bundle", imported, synthetic=False, capture_sha256=digest)
    assert result["status"] == "PASS"
    assert result["evidenceClass"] == "staging-capture-unverified"
    assert result["captureSha256"] == digest
    assert "SensitiveValue" not in (tmp_path / "bundle/support-failure-drill.json").read_text()
    events[1]["correlationId"] = "wrong-job"
    capture.write_text("\n".join(json.dumps(event) for event in events))
    try:
        module.read_staging_events(capture)
    except ValueError as error:
        assert "mismatched identifiers" in str(error)
    else:
        assert False, "mismatched staging correlation must fail"
