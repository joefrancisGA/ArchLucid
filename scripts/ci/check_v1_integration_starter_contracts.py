#!/usr/bin/env python3
"""Validate V1 integration starter contract fixtures against OpenAPI and doc links."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from release_evidence_common import load_json, repo_root  # noqa: E402

_FIXTURES_REL = Path("scripts/ci/data/v1_integration_starter_contracts.v1.json")
_OPENAPI_REL = Path("ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json")
_REQUIRED_SCHEMA = "archlucid.v1-integration-starter-contracts.v1"
_PRE_COMMIT_STARTER_DOC = Path("docs/runbooks/CI_GOVERNANCE_GATE.md")
_PRE_COMMIT_GHA_STARTER = Path("scripts/ci/data/pre_commit_ci_gate_starter.github-actions.yml")
_PRE_COMMIT_ADO_STARTER = Path("scripts/ci/data/pre_commit_ci_gate_starter.azure-pipelines-snippet.yml")
_REQUIRED_STARTER_PATHS = (
    "/v1/governance/pre-finalize/simulate",
    "/v1/architecture/review/{runId}/finalize",
)
_FORBIDDEN_SECRET_PATTERNS = (
    "sk_live_",
    "AKIA",
    "password: \"",
    "api_key: \"archlucid",
)


def _load_openapi_paths(root: Path) -> set[str]:
    openapi_path = root / _OPENAPI_REL
    payload = json.loads(openapi_path.read_text(encoding="utf-8-sig"))
    paths = payload.get("paths")

    if not isinstance(paths, dict):
        return set()

    return {str(key) for key in paths.keys()}


def _validate_workflows(workflows: Any, openapi_paths: set[str]) -> list[str]:
    errors: list[str] = []

    if not isinstance(workflows, list) or not workflows:
        errors.append("workflows must be a non-empty list")
        return errors

    seen_ids: set[str] = set()

    for workflow in workflows:
        if not isinstance(workflow, dict):
            errors.append("workflow entry must be an object")
            continue

        workflow_id = str(workflow.get("id") or "")

        if not workflow_id:
            errors.append("workflow missing id")
            continue

        if workflow_id in seen_ids:
            errors.append(f"duplicate workflow id: {workflow_id}")

        seen_ids.add(workflow_id)

        steps = workflow.get("steps")

        if not isinstance(steps, list) or not steps:
            errors.append(f"{workflow_id}: steps must be a non-empty list")
            continue

        for step in steps:
            if not isinstance(step, dict):
                errors.append(f"{workflow_id}: step must be an object")
                continue

            method = str(step.get("method") or "").upper()
            path = str(step.get("path") or "")

            if not method or not path:
                errors.append(f"{workflow_id}: step missing method or path")
                continue

            if path not in openapi_paths:
                errors.append(f"{workflow_id}/{step.get('id')}: path not in OpenAPI snapshot: {path}")

            statuses = step.get("expectedSuccessStatuses")

            if not isinstance(statuses, list) or not statuses:
                errors.append(f"{workflow_id}/{step.get('id')}: expectedSuccessStatuses required")

    return errors


def _validate_pre_commit_ci_gate_starter(root: Path) -> list[str]:
    errors: list[str] = []
    doc_path = root / _PRE_COMMIT_STARTER_DOC
    gha_path = root / _PRE_COMMIT_GHA_STARTER
    ado_path = root / _PRE_COMMIT_ADO_STARTER

    for path in (doc_path, gha_path, ado_path):
        if not path.is_file():
            errors.append(f"pre-commit CI starter missing: {path.relative_to(root).as_posix()}")

    if errors:
        return errors

    doc_text = doc_path.read_text(encoding="utf-8", errors="replace")
    gha_text = gha_path.read_text(encoding="utf-8", errors="replace")
    ado_text = ado_path.read_text(encoding="utf-8", errors="replace")
    combined = f"{doc_text}\n{gha_text}\n{ado_text}"

    for starter_rel in (_PRE_COMMIT_GHA_STARTER, _PRE_COMMIT_ADO_STARTER):
        starter_posix = starter_rel.as_posix()

        if starter_posix not in doc_text:
            errors.append(f"CI_GOVERNANCE_GATE.md must link: {starter_posix}")

    if "governance-pre-commit-blocked" not in combined:
        errors.append("pre-commit CI starter must document #governance-pre-commit-blocked problem type")

    if "PreCommitGateResult" not in doc_text:
        errors.append("CI_GOVERNANCE_GATE.md must reference PreCommitGateResult")

    for api_path in _REQUIRED_STARTER_PATHS:
        if api_path not in combined:
            errors.append(f"pre-commit CI starter must reference OpenAPI path: {api_path}")

    for pattern in _FORBIDDEN_SECRET_PATTERNS:
        if pattern in combined:
            errors.append(f"pre-commit CI starter must not embed secret pattern: {pattern}")

    if "secrets.ARCHLUCID_API_KEY" not in gha_text:
        errors.append("GitHub Actions starter must use secrets.ARCHLUCID_API_KEY")

    if "$(ARCHLUCID_API_KEY)" not in ado_text:
        errors.append("Azure DevOps starter must reference $(ARCHLUCID_API_KEY) variable")

    return errors


def validate(root: Path) -> tuple[list[str], dict[str, Any] | None]:
    fixtures_path = root / _FIXTURES_REL
    payload = load_json(fixtures_path)
    errors: list[str] = []

    if payload is None:
        return [f"missing or invalid fixtures: {_FIXTURES_REL.as_posix()}"], None

    if payload.get("schema") != _REQUIRED_SCHEMA:
        errors.append(f"schema must be {_REQUIRED_SCHEMA}")

    doc_refs = payload.get("docRefs")

    if not isinstance(doc_refs, list):
        errors.append("docRefs must be a list")
    else:
        fixture_link = _FIXTURES_REL.as_posix()

        for doc_ref in doc_refs:
            doc_path = root / str(doc_ref)

            if not doc_path.is_file():
                errors.append(f"docRef missing: {doc_ref}")
                continue

            text = doc_path.read_text(encoding="utf-8", errors="replace")

            if fixture_link not in text and "v1_integration_starter_contracts" not in text:
                errors.append(f"docRef must link fixtures: {doc_ref}")

    openapi_paths = _load_openapi_paths(root)
    errors.extend(_validate_workflows(payload.get("workflows"), openapi_paths))
    errors.extend(_validate_pre_commit_ci_gate_starter(root))

    return errors, payload


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    args = parser.parse_args(argv)
    errors, _ = validate(args.repo_root.resolve())

    if errors:
        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("v1 integration starter contracts: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
