"""Tests for TECH_BACKLOG next-batch hygiene guard."""

from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load():
    script = _CI / "check_tech_backlog_next_batch.py"
    spec = importlib.util.spec_from_file_location("check_tech_backlog_next_batch", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load check_tech_backlog_next_batch.py")

    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


GUARD = _load()


class CheckTechBacklogNextBatchTests(unittest.TestCase):
    def test_stale_done_reference_fails(self) -> None:
        text = """
**Next recommended batch:** **TB-106–108** (run detail) or **TB-138** (owner).
| TB-106 | title | **Done (2026-05-31)** | S |
| TB-138 | owner task | owner-gated secrets | M |
"""

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "docs" / "library" / "TECH_BACKLOG.md"
            path.parent.mkdir(parents=True)
            path.write_text(text, encoding="utf-8")

            violations = GUARD.next_batch_violations(root)

        self.assertTrue(any("TB-106" in item for item in violations))

    def test_open_reference_passes(self) -> None:
        text = """
**Next recommended batch:** **TB-165** (assessment score consistency) or **TB-138** (owner).
| TB-165 | assessment score consistency guard | Documentation quality — keep weighted tables synchronized | XS-S |
| TB-138 | owner secrets | owner-gated Azure OpenAI | M |
"""

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "docs" / "library" / "TECH_BACKLOG.md"
            path.parent.mkdir(parents=True)
            path.write_text(text, encoding="utf-8")

            violations = GUARD.next_batch_violations(root)

        self.assertEqual(violations, [])

    def test_expand_range_ids(self) -> None:
        ids = GUARD.parse_referenced_tb_ids("TB-106–108 and TB-138")

        self.assertEqual(ids, [106, 107, 108, 138])


if __name__ == "__main__":
    unittest.main()
