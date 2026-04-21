"""
assert_pgp_key_present.py
-------------------------
Advisory guard: if the Trust Center promises a **PGP** key at ``/.well-known/pgp-key.txt``,
the corresponding repo file ``archlucid-ui/public/.well-known/pgp-key.txt`` must exist and be non-empty.

Run: python scripts/ci/assert_pgp_key_present.py

Exit 0 = OK (key present, or Trust Center does not reference PGP). Exit 1 = Trust Center references PGP but key file missing/empty.

**Workflow:** keep ``continue-on-error: true`` until the custodian commits ``pgp-key.txt``; then flip the step to merge-blocking.
"""

from __future__ import annotations

import os
import re
import sys

REPO_ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))

TRUST_CENTER_REL = os.path.normpath("docs/go-to-market/TRUST_CENTER.md")
PGP_KEY_REL = os.path.normpath("archlucid-ui/public/.well-known/pgp-key.txt")

# Match buyer-facing PGP promise without firing on unrelated "pgp" substrings in URLs we do not control.
PGP_SIGNAL = re.compile(r"(?i)pgp-key\.txt|/\.well-known/pgp|well-known/pgp")


def _read(rel_path: str) -> str:
    path = os.path.join(REPO_ROOT, rel_path)
    if not os.path.isfile(path):
        print(f"assert_pgp_key_present: missing tracked file: {rel_path}", file=sys.stderr)
        return ""

    with open(path, encoding="utf-8") as handle:
        return handle.read()


def _key_material_ok() -> bool:
    path = os.path.join(REPO_ROOT, PGP_KEY_REL)
    if not os.path.isfile(path):
        return False

    with open(path, encoding="utf-8") as handle:
        body = handle.read().strip()

    return len(body) > 20


def main() -> int:
    trust_center = _read(TRUST_CENTER_REL)

    if not trust_center.strip():
        return 0

    if not PGP_SIGNAL.search(trust_center):
        return 0

    if _key_material_ok():
        return 0

    print(
        "assert_pgp_key_present: Trust Center references PGP publication "
        f"({TRUST_CENTER_REL}) but {PGP_KEY_REL} is missing or effectively empty. "
        "Add the custodian-published public key, or remove the PGP promise from the Trust Center.",
        file=sys.stderr,
    )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
