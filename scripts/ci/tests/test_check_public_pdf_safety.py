from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_public_pdf_safety.py"
    spec = importlib.util.spec_from_file_location("_check_public_pdf_safety", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load public PDF safety guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


class TestPublicPdfSafety(unittest.TestCase):
    def test_current_registry_public_docs_pass(self) -> None:
        violations = G.public_pdf_safety_violations(_REPO)

        self.assertEqual(violations, [], [str(v) for v in violations])

    def test_internal_route_path_fails(self) -> None:
        violations = G.scan_public_pdf_markdown(
            slug="fixture",
            source_path="docs/fixture.md",
            markdown="Call `POST /v1/architecture/request` to start.\n",
        )

        self.assertTrue(any("internal API route" in v.message for v in violations))

    def test_allow_marker_skips_line(self) -> None:
        violations = G.scan_public_pdf_markdown(
            slug="fixture",
            source_path="docs/fixture.md",
            markdown=(
                "POST /v1/architecture/request public-pdf-safety: allow\n"
                "GET /v1/compare without marker\n"
            ),
        )

        self.assertEqual(len(violations), 1)
        self.assertIn("/v1/compare", violations[0].excerpt)

    def test_localhost_and_env_var_fail(self) -> None:
        violations = G.scan_public_pdf_markdown(
            slug="fixture",
            source_path="docs/fixture.md",
            markdown=(
                "curl http://localhost:5128/health\n"
                "Set ARCHLUCID_API_BASE_URL in .env.local\n"
            ),
        )

        messages = {v.message for v in violations}

        self.assertIn("localhost reference", messages)
        self.assertIn("environment-variable-looking string", messages)

    def test_fixture_registry_entry_scan(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            registry_dir = root / "archlucid-ui" / "src" / "lib"
            registry_dir.mkdir(parents=True)
            docs_dir = root / "docs" / "library"
            docs_dir.mkdir(parents=True)

            (docs_dir / "PUBLIC_FIXTURE.md").write_text(
                "Safe buyer copy only.\n",
                encoding="utf-8",
            )
            (registry_dir / "product-documentation-registry.ts").write_text(
                """
const PRODUCT_DOCUMENTATION_REGISTRY_INPUT = [
  {
    slug: "fixture-public",
    title: "Fixture",
    summary: "Fixture",
    audience: "buyer",
    sourcePaths: ["docs/library/PUBLIC_FIXTURE.md"],
    pdfStatus: "public",
  },
];
""",
                encoding="utf-8",
            )

            self.assertEqual(G.public_pdf_safety_violations(root), [])

            (docs_dir / "PUBLIC_FIXTURE.md").write_text(
                "Use ArchLucid.Api/Controllers/FooController.cs for debugging.\n",
                encoding="utf-8",
            )

            violations = G.public_pdf_safety_violations(root)

            self.assertTrue(len(violations) >= 1)


if __name__ == "__main__":
    unittest.main()
