"""Tests for TECH_BACKLOG open-by-category count refresh."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from collections import Counter
from pathlib import Path

_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load():
    script = _CI / "refresh_tech_backlog_category_counts.py"
    spec = importlib.util.spec_from_file_location(
        "refresh_tech_backlog_category_counts",
        script,
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load refresh_tech_backlog_category_counts.py")

    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    return mod


GUARD = _load()


class RefreshTechBacklogCategoryCountsTests(unittest.TestCase):
    def test_counts_open_rows_and_skips_done(self) -> None:
        text = """
# Tech backlog

| ID | Title | Priority driver | Size |
|----|-------|----------------|------|
| TB-100 | Open trust item | Trustworthiness P1 — **V1** | S |
| TB-101 | ~~Shipped~~ **Done** | Trustworthiness P1 — **V1** | S |
| TB-102 | Open adoption | Adoption friction P2 — **V1** | M |
| TB-103 | Duplicate later | Trustworthiness P0 — **V1** | S |

### Later cluster

| ID | Title | Priority driver | Size |
|----|-------|----------------|------|
| TB-100 | Open trust item | Trustworthiness P1 — **V1** | S |
| TB-214 | Non-Azure ingest | **Closed — Rejected** (owner) | S |

## TB-100 — detail
"""
        cats, prios, total = GUARD.count_open_by_category(text)

        self.assertEqual(total, 3)
        self.assertEqual(cats["Trustworthiness"], 2)
        self.assertEqual(cats["Adoption friction"], 1)
        self.assertEqual(prios["P1"], 1)
        self.assertEqual(prios["P2"], 1)
        self.assertEqual(prios["P0"], 1)

    def test_normalizes_aliases_and_composites(self) -> None:
        self.assertEqual(
            GUARD.normalize_category("Commercial"),
            "Commercial / marketability",
        )
        self.assertEqual(
            GUARD.normalize_category("Proof-of-ROI"),
            "Proof-of-ROI / sponsor value",
        )
        self.assertEqual(
            GUARD.normalize_category("Trustworthiness / adoption"),
            "Trustworthiness",
        )
        self.assertEqual(
            GUARD.normalize_category("Performance / testability"),
            "Performance",
        )

    def test_render_and_check_roundtrip(self) -> None:
        cats = Counter({"Trustworthiness": 2, "Adoption friction": 1})
        prios = Counter({"P1": 2, "P2": 1})
        block = GUARD.render_counts_block(cats, prios, 3)

        self.assertIn(GUARD._START_MARKER, block)
        self.assertIn(GUARD._END_MARKER, block)
        self.assertIn("| Trustworthiness | 2 |", block)
        self.assertIn("| **Total (unique open)** | **3** |", block)
        self.assertIn("P0 **0** | P1 **2** | P2 **1** | P3 **0**", block)

        legacy = (
            "## Cursor-actionable backlog — remaining by architectural quality\n\n"
            "| Architectural quality | Remaining tasks |\n"
            "| --- | ---: |\n"
            "| Trustworthiness | 99 |\n"
            "| **Total (unique)** | **~99** |\n\n"
            "**BDA register:** keep me\n"
        )
        updated = GUARD.replace_or_insert_counts_block(legacy, block)

        self.assertIn(GUARD._START_MARKER, updated)
        self.assertIn("**BDA register:** keep me", updated)
        self.assertNotIn("| Trustworthiness | 99 |", updated)

        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = root / "docs" / "library" / "TECH_BACKLOG.md"
            path.parent.mkdir(parents=True)
            path.write_text(
                "# Scope\n\n"
                + updated
                + "\n\n| ID | Title | Priority driver | Size |\n"
                + "|----|-------|----------------|------|\n"
                + "| TB-1 | a | Trustworthiness P1 — **V1** | S |\n"
                + "| TB-2 | b | Trustworthiness P1 — **V1** | S |\n"
                + "| TB-3 | c | Adoption friction P2 — **V1** | S |\n"
                + "\n## TB-1 — detail\n",
                encoding="utf-8",
            )

            self.assertEqual(GUARD.main(["--check", "--root", str(root)]), 0)

            # Stale block should fail check.
            stale = path.read_text(encoding="utf-8").replace(
                "| Trustworthiness | 2 |",
                "| Trustworthiness | 99 |",
            )
            path.write_text(stale, encoding="utf-8")
            self.assertEqual(GUARD.main(["--check", "--root", str(root)]), 1)


if __name__ == "__main__":
    unittest.main()
