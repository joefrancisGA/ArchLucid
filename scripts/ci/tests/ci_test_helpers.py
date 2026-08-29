"""Shared helpers for scripts/ci/tests."""

from __future__ import annotations

import sys
from pathlib import Path

PYTHON: str = sys.executable
REPO_ROOT: Path = Path(__file__).resolve().parents[3]


def read_text_union(*paths: Path) -> str:
    return "".join(path.read_text(encoding="utf-8") for path in paths if path.is_file())


def read_controller_union(controller_path: Path) -> str:
    """Read a controller file and any sibling partials (Foo.cs + Foo.*.cs)."""
    directory = controller_path.parent
    stem = controller_path.stem
    partials = sorted(directory.glob(f"{stem}.*.cs"))
    return read_text_union(controller_path, *partials)
