#!/usr/bin/env python3
"""Emit advisory-only Terraform snippets from a mock manifest and run terraform fmt/validate.

CI-only mirror of (keep in sync):
  ArchLucid.ArtifactSynthesis/Services/TerraformAdvisoryDecommissionIntentDetector.cs
  ArchLucid.ArtifactSynthesis/Services/TerraformAdvisoryDecommissionSnippetBuilder.cs
  ArchLucid.Application/TerraformAdvisory/TerraformAdvisorySnippetTemplates.cs
  ArchLucid.ArtifactSynthesis/Generators/TerraformAdvisoryArtifactGenerator.cs

Does not invoke product export paths or change Emit business logic."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
FIXTURE_PATH = SCRIPT_DIR / "fixtures" / "sample_terraform_advisory_manifest.json"

ADVISORY_HEADER_LINE = "# ArchLucid advisory \u2013 review before apply"
ADVISORY_MD_POINTER_LINE = (
    "# See ADVISORY.md in the Terraform advisory export bundle \u2014 ArchLucid never runs "
    "apply or removal on your behalf."
)

_MARKERS = (
    "delete",
    "remove",
    "decommission",
    "tear down",
    "tear-down",
    "unprovision",
    "destroy",
)


def looks_like_decommission_request(decision: dict[str, Any]) -> bool:
    haystack = "\n".join(
        [
            _s(decision.get("title")),
            _s(decision.get("category")),
            _s(decision.get("selectedOption")),
            _s(decision.get("rationale")),
            _s(decision.get("rawDecisionJson")),
        ]
    ).lower()

    return any(marker in haystack for marker in _MARKERS)


def _s(value: Any) -> str:
    if value is None:
        return ""

    return str(value)


def try_resolve_resource_address_hint(decision: dict[str, Any]) -> str:
    related = decision.get("relatedNodeIds")
    if isinstance(related, list) and len(related) > 0:
        return ", ".join(str(x) for x in related)

    option = _s(decision.get("selectedOption")).strip()

    if len(option) > 0 and "." in option:
        return option

    return "(unspecified \u2014 validate against extractor manifest)"


def build_decision_section(decision: dict[str, Any]) -> str:
    address_hint = try_resolve_resource_address_hint(decision)
    lines = (
        ADVISORY_HEADER_LINE,
        ADVISORY_MD_POINTER_LINE,
        (
            f"# Decision {decision.get('decisionId', '')} \u2014 agent asked to change infrastructure; "
            "emitting comment-only advisory (no automated removal blocks)."
        ),
        f"# Terraform address hint: {address_hint}",
    )

    return "\n".join(lines).rstrip()


def build_no_decommission_manifest_stub() -> str:
    return "\n".join(
        (
            ADVISORY_HEADER_LINE,
            "# No decommission-style decisions in this manifest \u2014 no removal blocks emitted.",
        )
    ).rstrip()


def synthesize_artifact_content(decisions: list[dict[str, Any]]) -> str:
    decommission = [d for d in decisions if looks_like_decommission_request(d)]

    if len(decommission) == 0:
        return build_no_decommission_manifest_stub()

    return "\n\n".join(build_decision_section(d) for d in decommission)


def example_right_size_vm_snippet(finding_id: str, recommendation_id: str) -> str:
    if not str(finding_id).strip():
        raise ValueError("findingId is required.")
    if not str(recommendation_id).strip():
        raise ValueError("recommendationId is required.")

    return (
        f"{ADVISORY_HEADER_LINE}\n"
        f"# findingId={finding_id} recommendationId={recommendation_id}\n"
        "# Replace with a real resource block after aztfexport; placeholder comments keep fmt/validate green in CI.\n"
    ).rstrip()


def explainer_instead_of_destroy(resource_terraform_address: str, reason: str) -> str:
    return (
        f"{ADVISORY_HEADER_LINE}\n"
        f"# Omitting terraform destroy for `{resource_terraform_address}` \u2014 {reason}\n"
    ).rstrip()


def load_fixture() -> dict[str, Any]:
    raw = FIXTURE_PATH.read_text(encoding="utf-8")
    return json.loads(raw)


def emit_snippets_to_dir(out_dir: Path, data: dict[str, Any]) -> None:
    for scenario in data.get("artifactScenarios", []):
        sid = _s(scenario.get("id")).strip() or "unnamed"
        decisions = scenario.get("decisions", [])
        if not isinstance(decisions, list):
            raise TypeError(f"artifactScenarios[{sid}].decisions must be a list")

        content = synthesize_artifact_content(decisions)
        (out_dir / f"artifact_{_safe_filename(sid)}.tf").write_text(content + "\n", encoding="utf-8")

    for row in data.get("standaloneDecisionSnippets", []):
        sid = _s(row.get("id")).strip() or "unnamed"
        content = build_decision_section(row)
        (out_dir / f"decision_{_safe_filename(sid)}.tf").write_text(content + "\n", encoding="utf-8")

    for row in data.get("templateSnippets", []):
        sid = _s(row.get("id")).strip() or "unnamed"
        kind = _s(row.get("kind"))
        if kind == "ExampleRightSizeVm":
            body = example_right_size_vm_snippet(
                _s(row.get("findingId")),
                _s(row.get("recommendationId")),
            )
        elif kind == "ExplainerInsteadOfDestroy":
            body = explainer_instead_of_destroy(
                _s(row.get("resourceTerraformAddress")),
                _s(row.get("reason")),
            )
        else:
            raise ValueError(f"Unknown template kind: {kind!r}")

        (out_dir / f"template_{_safe_filename(sid)}.tf").write_text(body + "\n", encoding="utf-8")


def _safe_filename(value: str) -> str:
    allowed = [c if c.isalnum() or c in ("-", "_") else "_" for c in value]

    return "".join(allowed).strip("_") or "snippet"


def run_terraform(root: Path) -> None:
    env = os.environ.copy()
    subprocess.run(
        ["terraform", "init", "-backend=false", "-input=false"],
        cwd=root,
        env=env,
        check=True,
    )
    subprocess.run(
        ["terraform", "validate"],
        cwd=root,
        env=env,
        check=True,
    )
    subprocess.run(
        ["terraform", "fmt", "-check", "-recursive"],
        cwd=root,
        env=env,
        check=True,
    )


def main() -> None:
    data = load_fixture()

    with tempfile.TemporaryDirectory(prefix="archlucid-tf-advisory-") as tmp:
        root = Path(tmp)
        emit_snippets_to_dir(root, data)
        run_terraform(root)


if __name__ == "__main__":
    main()
