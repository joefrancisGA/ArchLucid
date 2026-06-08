#!/usr/bin/env python3
"""Validate release-critical runbook command references match script param blocks (T1-6)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

_PARAM_BLOCK_RE = re.compile(r"param\s*\((.*?)\n\)", re.DOTALL | re.IGNORECASE)
_PARAM_VAR_RE = re.compile(r"\$([A-Za-z][A-Za-z0-9_]*)\b")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_contract(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    schema = payload.get("schema")

    if schema != "archlucid.release-runbook-script-contract.v1":
        raise ValueError(f"Unexpected contract schema: {schema!r}")

    return payload


def extract_script_params(script_path: Path) -> set[str]:
    text = script_path.read_text(encoding="utf-8", errors="replace")
    match = _PARAM_BLOCK_RE.search(text)

    if match is None:
        return set()

    block = match.group(1)
    names = {name for name in _PARAM_VAR_RE.findall(block)}
    names.discard("ErrorActionPreference")

    return names


def normalize_mention(mention: str) -> str:
    token = mention.lstrip("-")
    return token[:1].upper() + token[1:] if token else token


def check_entry(root: Path, entry: dict[str, object]) -> list[str]:
    errors: list[str] = []
    script_rel = str(entry["script"])
    script_path = root / script_rel

    if not script_path.is_file():
        return [f"{script_rel}: script file missing"]

    script_params = extract_script_params(script_path)
    required_mentions = [str(item) for item in entry.get("requiredParamMentions", [])]

    for mention in required_mentions:
        normalized = normalize_mention(mention)

        if normalized not in script_params:
            errors.append(f"{script_rel}: param ${normalized} missing from script param() block")

    for doc_rel in entry.get("docs", []):
        doc_path = root / str(doc_rel)

        if not doc_path.is_file():
            errors.append(f"{doc_rel}: doc file missing")
            continue

        doc_text = doc_path.read_text(encoding="utf-8", errors="replace")

        if script_rel not in doc_text and Path(script_rel).name not in doc_text:
            errors.append(f"{doc_rel}: does not reference script {script_rel}")

        for mention in required_mentions:
            if mention not in doc_text and normalize_mention(mention) not in doc_text:
                errors.append(f"{doc_rel}: missing documented flag {mention} for {script_rel}")

    return errors


def evaluate_contract(root: Path, contract_path: Path) -> tuple[list[str], int]:
    contract = load_contract(contract_path)
    errors: list[str] = []

    for entry in contract.get("entries", []):
        if not isinstance(entry, dict):
            errors.append("contract entry must be an object")
            continue

        errors.extend(check_entry(root, entry))

    return errors, len(contract.get("entries", []))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--contract",
        type=Path,
        default=repo_root() / "scripts" / "ci" / "data" / "release_runbook_script_contract.v1.json",
    )
    args = parser.parse_args(argv)

    root = repo_root()
    errors, entry_count = evaluate_contract(root, args.contract)

    if errors:
        for error in sorted(set(errors)):
            print(error, file=sys.stderr)

        return 1

    print(f"check_release_runbook_script_parity: OK ({entry_count} entries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
