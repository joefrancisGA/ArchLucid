#!/usr/bin/env python3
"""Shared helpers for release evidence bundle profiles (T2-11)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_PROFILES_PATH = Path(__file__).resolve().parent / "data" / "release_evidence_bundle_profiles.v1.json"


def profiles_path() -> Path:
    return _PROFILES_PATH


def load_profiles() -> dict[str, Any]:
    return json.loads(_PROFILES_PATH.read_text(encoding="utf-8"))


def profile_names() -> list[str]:
    profiles = load_profiles().get("profiles", {})
    return sorted(str(name) for name in profiles.keys())


def profile_definition(profile: str) -> dict[str, Any]:
    profiles = load_profiles().get("profiles", {})

    if profile not in profiles:
        raise KeyError(f"Unknown profile: {profile}")

    return profiles[profile]


def profile_doc_owners(profile: str) -> list[dict[str, str]]:
    definition = profile_definition(profile)
    owners = definition.get("docOwners", [])

    if not isinstance(owners, list):
        return []

    rows: list[dict[str, str]] = []

    for owner in owners:
        if isinstance(owner, dict) and owner.get("path"):
            rows.append(
                {
                    "path": str(owner["path"]),
                    "purpose": str(owner.get("purpose", "")),
                }
            )

    return rows
