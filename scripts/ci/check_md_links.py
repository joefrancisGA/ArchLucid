#!/usr/bin/env python3
"""
Alias entrypoint for ``scripts/ci/check_doc_links.py`` (markdown link integrity).

Some automation and humans look for ``check_md_links.py`` by name; the canonical
implementation remains ``check_doc_links.py``.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    script = Path(__file__).resolve().with_name("check_doc_links.py")
    return subprocess.call([sys.executable, str(script)])


if __name__ == "__main__":
    raise SystemExit(main())
