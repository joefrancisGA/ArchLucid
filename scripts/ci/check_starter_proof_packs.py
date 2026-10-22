#!/usr/bin/env python3
"""Validate templates/starter-proof-packs/* metadata and required artifacts (TB-171/TB-172)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REQUIRED_METADATA_KEYS: tuple[str, ...] = (
    "id",
    "title",
    "targetBuyer",
    "buyerJob",
    "owner",
    "lastReviewedUtc",
    "requiredInputs",
    "expectedOutputs",
    "scopeLabel",
    "doNotUseWhen",
    "deferredScopeNotes",
)

ALLOWED_SCOPE_LABELS: frozenset[str] = frozenset(
    {
        "V1-ready",
        "V1.1-deferred",
        "V2-deferred",
        "owner-input-required",
    }
)

REQUIRED_PACK_FILES: tuple[str, ...] = (
    "architecture-request.json",
    "second-run.json",
    "policy-context.json",
    "proof-package-checklist.md",
    "README.md",
    "starter-pack.json",
)

PLACEHOLDER_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bTODO\b", re.IGNORECASE),
    re.compile(r"\bTBD\b", re.IGNORECASE),
    re.compile(r"<\s*insert", re.IGNORECASE),
    re.compile(r"your-api-key-here", re.IGNORECASE),
    re.compile(r"sk_live_[a-zA-Z0-9]+"),
)

FORBIDDEN_V1_READY_PHRASES: tuple[str, ...] = (
    "soc 2 certified",
    "soc 2 type ii report issued",
    "buy on marketplace today",
    "stripe live",
    "mcp server",
    "plugin marketplace",
)

FIRST_PILOT_PATH_MARKERS: tuple[str, ...] = (
    "CORE_PILOT.md",
    "FIRST_PILOT_OPERATOR_PATH.md",
)

DEMO_LABEL_MARKERS: tuple[str, ...] = (
    "synthetic",
    "illustrative",
    "fictional",
    "demo",
    "no real",
    "no roi claims",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_json(path: Path) -> dict[str, object]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must be a JSON object")
    return payload


def _forbidden_claim_in_positive_context(text: str, phrase: str) -> bool:
    index = text.find(phrase)

    if index < 0:
        return False

    window = text[max(0, index - 48) : index]

    return not any(
        marker in window
        for marker in ("do not", "does not", "not ", "no ", "without ", "out of scope")
    )


def validate_pack(pack_dir: Path) -> list[str]:
    errors: list[str] = []
    pack_id = pack_dir.name

    for filename in REQUIRED_PACK_FILES:
        if not (pack_dir / filename).is_file():
            errors.append(f"{pack_id}: missing required file {filename}")

    metadata_path = pack_dir / "starter-pack.json"
    if not metadata_path.is_file():
        return errors

    try:
        meta = load_json(metadata_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        errors.append(f"{pack_id}: starter-pack.json invalid: {exc}")
        return errors

    for key in REQUIRED_METADATA_KEYS:
        if key not in meta or meta[key] in (None, "", []):
            errors.append(f"{pack_id}: starter-pack.json missing or empty '{key}'")

    scope = str(meta.get("scopeLabel", "")).strip()
    if scope and scope not in ALLOWED_SCOPE_LABELS:
        errors.append(f"{pack_id}: invalid scopeLabel '{scope}'")

    if scope == "V1-ready":
        deferred = str(meta.get("deferredScopeNotes", "")).lower()
        combined = " ".join([str(meta.get("title", "")), deferred]).lower()

        if not deferred.startswith("does not"):
            for phrase in FORBIDDEN_V1_READY_PHRASES:
                if _forbidden_claim_in_positive_context(combined, phrase):
                    errors.append(f"{pack_id}: V1-ready pack implies forbidden claim '{phrase}'")
        else:
            title_only = str(meta.get("title", "")).lower()

            for phrase in FORBIDDEN_V1_READY_PHRASES:
                if _forbidden_claim_in_positive_context(title_only, phrase):
                    errors.append(f"{pack_id}: V1-ready pack implies forbidden claim '{phrase}'")

    for filename in ("architecture-request.json", "second-run.json", "policy-context.json"):
        path = pack_dir / filename
        if not path.is_file():
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{pack_id}: {filename} is not valid JSON: {exc}")

    if scope == "V1-ready":
        for path in pack_dir.rglob("*"):
            if path.is_dir() or path.suffix not in {".md", ".json"}:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            for pattern in PLACEHOLDER_PATTERNS:
                if pattern.search(text):
                    errors.append(f"{pack_id}: placeholder pattern {pattern.pattern!r} in {path.name}")
                    break

    errors.extend(validate_demo_labeling(pack_dir, meta))

    return errors


def validate_chooser(packs_root: Path, pack_ids: list[str]) -> list[str]:
    errors: list[str] = []
    chooser = packs_root / "STARTER_PROOF_PACK_CHOOSER.md"

    if not chooser.is_file():
        return [f"missing chooser markdown: {chooser.as_posix()}"]

    text = chooser.read_text(encoding="utf-8", errors="replace")
    lower = text.lower()

    if not any(marker.lower() in lower for marker in FIRST_PILOT_PATH_MARKERS):
        errors.append("chooser must link to Core Pilot / first-pilot operator path docs")

    for pack_id in pack_ids:
        if pack_id not in text:
            errors.append(f"chooser does not reference pack folder '{pack_id}'")

    for phrase in FORBIDDEN_V1_READY_PHRASES:
        if _forbidden_claim_in_positive_context(lower, phrase):
            errors.append(f"chooser implies unsupported claim '{phrase}' without safe negation")

    return errors


def validate_demo_labeling(pack_dir: Path, meta: dict[str, object]) -> list[str]:
    errors: list[str] = []
    scope = str(meta.get("scopeLabel", "")).strip()

    if scope != "V1-ready":
        return errors

    request_path = pack_dir / "architecture-request.json"

    if not request_path.is_file():
        return errors

    text = request_path.read_text(encoding="utf-8", errors="replace").lower()

    if not any(marker in text for marker in DEMO_LABEL_MARKERS):
        errors.append(
            f"{pack_dir.name}: V1-ready pack must label demo/synthetic data in architecture-request.json",
        )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--packs-root",
        type=Path,
        default=repo_root() / "templates" / "starter-proof-packs",
        help="Root directory containing pack subfolders",
    )
    parser.add_argument(
        "--json-out",
        type=Path,
        default=None,
        help="Optional machine-readable validation report path",
    )
    args = parser.parse_args(argv)

    root: Path = args.packs_root
    chooser = root / "STARTER_PROOF_PACK_CHOOSER.md"
    if not chooser.is_file():
        print(f"error: missing {chooser}", file=sys.stderr)
        return 1

    pack_dirs = sorted(p for p in root.iterdir() if p.is_dir())
    if not pack_dirs:
        print(f"error: no pack directories under {root}", file=sys.stderr)
        return 1

    pack_ids = [pack_dir.name for pack_dir in pack_dirs]
    all_errors: list[str] = []
    all_errors.extend(validate_chooser(root, pack_ids))

    for pack_dir in pack_dirs:
        all_errors.extend(validate_pack(pack_dir))

    if all_errors:
        for err in all_errors:
            print(f"error: {err}", file=sys.stderr)
        if args.json_out is not None:
            payload = {
                "schema": "archlucid.starter-proof-pack-validation.v1",
                "disposition": "HOLD",
                "packCount": len(pack_dirs),
                "errors": all_errors,
            }
            args.json_out.parent.mkdir(parents=True, exist_ok=True)
            args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        return 1

    if args.json_out is not None:
        payload = {
            "schema": "archlucid.starter-proof-pack-validation.v1",
            "disposition": "PASS",
            "packCount": len(pack_dirs),
            "errors": [],
        }
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"OK: validated {len(pack_dirs)} starter proof pack(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
