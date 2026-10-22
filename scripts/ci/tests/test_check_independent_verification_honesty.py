from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_independent_verification_honesty.py"
    spec = importlib.util.spec_from_file_location(
        "_check_independent_verification_honesty",
        script,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load independent verification honesty guard.")
    sys.path.insert(0, str(_CI))
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


GUARD = _load_guard()


class TestIndependentVerificationHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = GUARD.independent_verification_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_unqualified_claim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = root / "docs/go-to-market/POSITIONING.md"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(
                "ArchLucid produces independently verified findings for every review.\n",
                encoding="utf-8",
            )

            violations = GUARD.scan_doc_claims(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
            )

            self.assertTrue(any("independent" in item.lower() for item in violations))

    def test_negative_boundary_statement_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = root / "docs/go-to-market/POSITIONING.md"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(
                "Do not claim findings are independently verified without a verifier record.\n",
                encoding="utf-8",
            )

            violations = GUARD.scan_doc_claims(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
            )

            self.assertEqual(violations, [])

    def test_explicit_allowlist_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            target = root / "docs/go-to-market/POSITIONING.md"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(
                "Independently verified independent-verification-honesty: allow — negative fixture.\n",
                encoding="utf-8",
            )

            violations = GUARD.scan_doc_claims(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
            )

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
