from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_manifest_schema_evolution_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_manifest_schema_evolution_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load manifest schema evolution honesty guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_contract(root: Path) -> None:
    path = root / G.CONTRACT_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "**TB-1277**",
                "tolerant",
                "upcasting",
                "dual-write",
                "never rewritten",
                "default-empty",
                "M-223",
            ]
        ),
        encoding="utf-8",
    )


def _write_pa_one_pager(root: Path) -> None:
    path = root / G.PA_ONE_PAGER_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "MANIFEST_CONTENT_SCHEMA_EVOLUTION_CONTRACT.md",
                "TB-1277",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestManifestSchemaEvolutionHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.manifest_schema_evolution_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_pa_one_pager(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Tolerant readers keep old manifests readable.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1277" in item or "tolerant" in item for item in violations))

    def test_overclaim_in_buyer_doc_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "SchemaVersion upgrades historical sealed manifests automatically.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("schemaversion" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Unsafe |\n| Tolerant readers | "SchemaVersion upgrades history" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
