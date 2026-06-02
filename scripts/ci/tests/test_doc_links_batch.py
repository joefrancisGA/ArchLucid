"""Batch 5F (TB-170): guard markdown link integrity regression after repair pass."""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def broken_link_lines(stderr: str) -> list[str]:
    return [line.strip() for line in stderr.splitlines() if "-> missing path" in line]


class DocLinksBatchTests(unittest.TestCase):
    def test_check_doc_links_exits_zero(self) -> None:
        root = repo_root()
        result = subprocess.run(
            ["python", "scripts/ci/check_doc_links.py"],
            cwd=root,
            capture_output=True,
            text=True,
            check=False,
        )
        broken = broken_link_lines(result.stderr)

        if broken:
            preview = "\n".join(broken[:25])

            if len(broken) > 25:
                preview += f"\n... and {len(broken) - 25} more"

            self.fail(
                f"check_doc_links.py reported {len(broken)} broken link(s):\n{preview}"
            )

        self.assertEqual(result.returncode, 0, msg=result.stderr or result.stdout)


if __name__ == "__main__":
    unittest.main()
