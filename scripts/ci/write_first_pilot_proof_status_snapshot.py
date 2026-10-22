#!/usr/bin/env python3
"""Write operator Home proof status strip from the latest local first-pilot proof artifacts."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS_ROOT = REPO_ROOT / "artifacts"
OUT_PATH = REPO_ROOT / "archlucid-ui" / "public" / "first-pilot-proof-status-snapshot.json"


def find_latest_proof_dir() -> Path | None:
    if not ARTIFACTS_ROOT.is_dir():
        return None

    candidates = sorted(
        (path for path in ARTIFACTS_ROOT.iterdir() if path.is_dir() and path.name.startswith("first-pilot-proof")),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )

    if not candidates:
        default_dir = ARTIFACTS_ROOT / "first-pilot-proof"
        return default_dir if default_dir.is_dir() else None

    return candidates[0]


def load_json(path: Path) -> dict | None:
    if not path.is_file():
        return None

    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None

    return loaded if isinstance(loaded, dict) else None


def main() -> int:
    proof_dir = find_latest_proof_dir()
    disposition = "NOT_RUN"
    verdict = "NOT_RUN"
    block_count = 0
    warn_count = 0
    next_action = "Run collect-first-pilot-proof.ps1 or dotnet run --project ArchLucid.Cli -- pilot proof after your first committed review."
    proof_folder: str | None = None
    generated_utc = datetime.now(timezone.utc).isoformat()

    if proof_dir is not None:
        summary = load_json(proof_dir / "go-no-go-summary.json")
        command_center = load_json(proof_dir / "first-pilot-command-center.json")

        if summary is not None:
            verdict = str(summary.get("verdict") or "UNKNOWN")
            block_count = int(summary.get("blockCount") or 0)
            warn_count = int(summary.get("warnCount") or 0)
            proof_folder = proof_dir.name

            if verdict == "PASS":
                disposition = "PASS"
            elif verdict == "WARN":
                disposition = "WARN"
            elif verdict == "BLOCK":
                disposition = "BLOCK"
            else:
                disposition = "WARN"

            command_center_block = summary.get("commandCenter")
            if isinstance(command_center_block, dict):
                next_from_summary = command_center_block.get("nextActionSummary")
                if isinstance(next_from_summary, str) and next_from_summary.strip():
                    next_action = next_from_summary.strip()

        if command_center is not None:
            next_block = command_center.get("nextAction")
            if isinstance(next_block, dict):
                summary_text = next_block.get("summary")
                if isinstance(summary_text, str) and summary_text.strip():
                    next_action = summary_text.strip()

    payload = {
        "generatedUtc": generated_utc,
        "disposition": disposition,
        "verdict": verdict,
        "blockCount": block_count,
        "warnCount": warn_count,
        "nextAction": next_action,
        "proofFolder": proof_folder,
        "remediationLinks": [
            {"label": "Operator checklist", "path": "docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md"},
            {"label": "Collect proof", "path": "scripts/collect-first-pilot-proof.ps1"},
            {"label": "Workflow handoff", "path": "docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md"},
        ],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"first-pilot proof status snapshot: {disposition} -> {OUT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
