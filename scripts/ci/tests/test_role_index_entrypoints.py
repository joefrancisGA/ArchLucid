"""Guard role-index persona entrypoints and required canonical links."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
ROLE_INDEX = REPO_ROOT / "docs" / "runbooks" / "ROLE_INDEX.md"
LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def _resolve_relative_link(source: Path, target: str) -> Path | None:
    target = target.strip()

    if not target or target.startswith(("http://", "https://", "mailto:", "#")):
        return None

    if "#" in target:
        target = target.split("#", 1)[0]

    if not target:
        return None

    if target.startswith("/"):
        return None

    return (source.parent / target).resolve()


def test_role_index_file_exists_with_personas() -> None:
    text = ROLE_INDEX.read_text(encoding="utf-8")
    assert "Operator" in text
    assert "Platform engineer" in text
    assert "Release owner" in text
    assert "FIRST_PILOT_OPERATOR_PATH.md" in text
    assert "V1_RELEASE_CHECKLIST.md" in text
    assert "PILOT_PREREQUISITES.md" in text


def test_role_index_relative_links_resolve() -> None:
    text = ROLE_INDEX.read_text(encoding="utf-8")
    missing: list[str] = []

    for match in LINK_RE.finditer(text):
        resolved = _resolve_relative_link(ROLE_INDEX, match.group(1))

        if resolved is None:
            continue

        if not resolved.is_file():
            missing.append(f"{match.group(1)} -> {resolved.relative_to(REPO_ROOT)}")

    assert not missing, "Broken ROLE_INDEX links:\n" + "\n".join(missing)


def test_canonical_doc_entry_includes_role_index() -> None:
    script = REPO_ROOT / "scripts" / "ci" / "check_canonical_doc_entry.py"
    result = subprocess.run(
        [sys.executable, str(script)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
