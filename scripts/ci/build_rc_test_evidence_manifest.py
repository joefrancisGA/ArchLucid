#!/usr/bin/env python3
"""Build rc-test-evidence-manifest.json/.md from release confidence lanes."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from build_release_confidence_rollup import build_rollup  # noqa: E402
from release_evidence_common import load_json, repo_root  # noqa: E402

_SCHEMA = "archlucid.rc-test-evidence-manifest.v1"


def build_manifest(root: Path, bundle_dir: Path) -> dict[str, Any]:
    rollup = build_rollup(root, bundle_dir)
    readiness = load_json(bundle_dir / "release-readiness-index.json") or {}

    suites: list[dict[str, Any]] = []

    for lane in rollup["lanes"]:
        suites.append(
            {
                "id": lane["id"],
                "label": lane["label"],
                "status": lane["status"],
                "releaseBlocking": lane.get("releaseBlocking"),
                "generatedUtc": lane.get("generatedUtc"),
                "artifactRef": Path(str(lane.get("source") or "")).name if lane.get("source") else None,
                "detail": lane.get("detail") or lane.get("laneDetail"),
            }
        )

    return {
        "schema": _SCHEMA,
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "gitCommitSha": readiness.get("gitCommitSha"),
        "workflowRunId": None,
        "suites": suites,
        "disposition": rollup.get("disposition"),
        "strictDisposition": rollup.get("strictDisposition"),
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# RC test evidence manifest",
        "",
        f"Generated UTC: **{payload['generatedUtc']}**",
        "",
        f"Disposition: **{payload.get('disposition')}** · Strict: **{payload.get('strictDisposition') or '(not computed)'}**",
        "",
        "| Suite | Status | Blocking | Artifact | Detail |",
        "| --- | --- | :---: | --- | --- |",
    ]

    for suite in payload.get("suites") or []:
        blocking = "yes" if suite.get("releaseBlocking") else "no"
        detail = str(suite.get("detail") or "")[:100].replace("|", "/")
        artifact = suite.get("artifactRef") or "(missing)"
        lines.append(
            f"| {suite.get('label')} | **{suite.get('status')}** | {blocking} | `{artifact}` | {detail} |"
        )

    lines.append("")
    return "\n".join(lines)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--json-out", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = build_manifest(args.repo_root.resolve(), args.bundle_dir.resolve())

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.markdown_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
