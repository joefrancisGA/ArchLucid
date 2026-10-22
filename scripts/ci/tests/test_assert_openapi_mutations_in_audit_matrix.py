from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

_CI_ROOT = Path(__file__).resolve().parents[1]
if str(_CI_ROOT) not in sys.path:
    sys.path.insert(0, str(_CI_ROOT))

import assert_openapi_mutations_in_audit_matrix as sut


class TestAssertOpenapiMutationsInAuditMatrix(unittest.TestCase):
    def test_matrix_exact_path_documents_route(self) -> None:
        text = "Operations:\n\n| Op | Route |\n| `RunsController` | `POST /v1/widget/action` |\n"
        exact, suffix = sut.parse_matrix(text)

        self.assertIn(("POST", "/v1/widget/action"), exact)

        self.assertTrue(sut.is_documented("POST", "/v1/widget/action", exact, suffix))

    def test_matrix_ellipsis_suffix_matches_openapi_path(self) -> None:
        text = "Batch replay uses `POST …/replay/batch` from ComparisonsController.\n"
        exact, suffix = sut.parse_matrix(text)

        self.assertEqual(exact, set())
        self.assertIn(("POST", "/replay/batch"), suffix)

        self.assertTrue(
            sut.is_documented("POST", "/v1/architecture/comparisons/replay/batch", exact, suffix)
        )

    def test_fixture_fails_without_matrix_then_passes_with_match(self) -> None:
        fixture_openapi = {
            "openapi": "3.0.1",
            "paths": {"/v1/a": {"post": {"responses": {"200": {"description": "ok"}}}}},
        }

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            oa = tmp_path / "openapi.json"
            md = tmp_path / "matrix.md"
            oa.write_text(json.dumps(fixture_openapi), encoding="utf-8")
            md.write_text("> **Scope:** test fixture only.\n\n# Matrix\n\nno routes\n", encoding="utf-8")

            buf = io.StringIO()
            out = io.StringIO()

            with redirect_stderr(buf), redirect_stdout(out):
                r1 = sut.main(
                    [
                        "--repo-root",
                        str(tmp_path),
                        "--openapi",
                        str(oa),
                        "--matrix",
                        str(md),
                    ]
                )

            self.assertEqual(r1, 1)

            md.write_text(
                "> **Scope:** test fixture only.\n\n# Matrix\n\n`POST /v1/a`\n",
                encoding="utf-8",
            )

            buf2 = io.StringIO()
            out2 = io.StringIO()

            with redirect_stderr(buf2), redirect_stdout(out2):
                r2 = sut.main(
                    [
                        "--repo-root",
                        str(tmp_path),
                        "--openapi",
                        str(oa),
                        "--matrix",
                        str(md),
                    ]
                )

            self.assertEqual(r2, 0)


if __name__ == "__main__":
    unittest.main()
