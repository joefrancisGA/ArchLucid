from __future__ import annotations

import importlib.util
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "audit",
    Path(__file__).resolve().parents[1] / "agent" / "al-bug-audit-proven-rows.py",
)
audit = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(audit)


def test_classify_synthetic_redaction() -> None:
    assert audit.classify_row("beefAccessKey prefix redaction") == "synthetic-redaction"


def test_classify_realistic_cross_tenant() -> None:
    assert audit.classify_row("cross-tenant publish returned 200") == "realistic"


def test_stratified_sample_size() -> None:
    rows = [
        audit.ProvenRow("archlucid-core", f"row {i}") for i in range(60)
    ] + [
        audit.ProvenRow("api-governance-tenancy-controllers", f"api {i}") for i in range(30)
    ] + [
        audit.ProvenRow("other-zone", f"other {i}") for i in range(40)
    ]
    sample = audit.stratified_sample(rows, seed=1)
    assert len(sample) == 100
