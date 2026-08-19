#!/usr/bin/env python3
"""Locate the ``AuditEventTypes`` family partials that form one logical durable-audit catalog.

The catalog lives in ``ArchLucid.Core/Audit/AuditEventTypes.cs`` plus per-family partials
(``AuditEventTypes.<Family>.cs``). Guards must read every partial, otherwise a constant that moved
between families looks deleted.
"""

from __future__ import annotations

from pathlib import Path

AUDIT_DIR_PARTS = ("ArchLucid.Core", "Audit")
PARTIAL_GLOB = "AuditEventTypes*.cs"


def audit_event_types_dir(repo_root: Path) -> Path:
    return repo_root.joinpath(*AUDIT_DIR_PARTS)


def audit_event_types_paths(repo_root: Path) -> list[Path]:
    """Every catalog partial, root file first so ``Run``/``Operation`` keys keep a stable order."""

    directory = audit_event_types_dir(repo_root)
    root = directory / "AuditEventTypes.cs"
    partials = sorted(path for path in directory.glob(PARTIAL_GLOB) if path != root)

    if root.is_file():
        return [root, *partials]

    return partials


def read_audit_event_types_text(repo_root: Path) -> str:
    return "\n".join(path.read_text(encoding="utf-8") for path in audit_event_types_paths(repo_root))
