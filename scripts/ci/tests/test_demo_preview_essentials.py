"""Unit tests for demo preview essentials validation."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts" / "demo_preview_essentials.py"
    spec = importlib.util.spec_from_file_location("demo_preview_essentials", path)
    module = importlib.util.module_from_spec(spec)
    if spec.loader is None:
        raise RuntimeError("loader missing")
    spec.loader.exec_module(module)
    return module


dpe = _load_module()


def _minimal_preview(*, include_artifacts: bool = True) -> dict:
    payload = {
        "isDemoData": True,
        "run": {"runId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"},
        "manifest": {"manifestId": "11111111-1111-1111-1111-111111111111"},
        "authorityChain": {"goldenManifestId": "11111111-1111-1111-1111-111111111111"},
        "artifacts": [{"name": "review-package.zip"}] if include_artifacts else [],
        "runExplanation": {
            "overallAssessment": "Low",
            "explanation": {"summary": "stub"},
        },
    }
    return payload


def test_validate_preview_payload_passes_on_minimal_fixture() -> None:
    violations = dpe.validate_preview_payload(_minimal_preview())

    assert violations == []


def test_validate_preview_payload_holds_when_artifacts_missing() -> None:
    violations = dpe.validate_preview_payload(_minimal_preview(include_artifacts=False))

    assert "demo-preview-artifacts-empty" in violations


def test_validate_preview_payload_holds_on_secret_like_token() -> None:
    payload = _minimal_preview()
    payload["run"]["runId"] = "AKIAIOSFODNN7EXAMPLE"

    violations = dpe.validate_preview_payload(payload)

    assert "demo-preview-secret-like-token-detected" in violations


def test_golden_fixture_preview_json_passes_when_present() -> None:
    fixture = REPO_ROOT / "ArchLucid.Api.Tests" / "Fixtures" / "demo-preview-essentials-golden.json"
    if not fixture.is_file():
        pytest.skip("golden fixture not present")

    payload = json.loads(fixture.read_text(encoding="utf-8"))
    violations = dpe.validate_preview_payload(payload)

    assert violations == []
