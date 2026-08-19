"""Regenerate the appendix blob for docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md from the JSON registry.

Prefer the one-shot sync:

  python scripts/ci/assert_route_tier_policy_nav.py --sync

This script writes `_route_matrix_appendix.md` for manual paste when you only need the appendix blob.
"""

from __future__ import annotations

import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from assert_route_tier_policy_nav import repo_root, render_matrix_appendix

root = repo_root()
out = root / "_route_matrix_appendix.md"
out.write_text("\n" + render_matrix_appendix(root), encoding="utf-8")
print(out)
