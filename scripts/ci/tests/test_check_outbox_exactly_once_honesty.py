from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_outbox_exactly_once_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_outbox_exactly_once_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load outbox exactly-once honesty guard.")

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
                "**TB-992**",
                "at-least-once",
                "MessageId",
                "MarkProcessedAsync",
                "Exactly-once integration events",
            ]
        ),
        encoding="utf-8",
    )


def _write_catalog(root: Path) -> None:
    path = root / G.CATALOG_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "TRANSACTIONAL_OUTBOX_REPLAY_VS_IDEMPOTENCY_CONTRACT.md",
                "TB-992",
                "Handle duplicates",
                "idempotent handlers",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestOutboxExactlyOnceHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.outbox_exactly_once_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_catalog(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "At-least-once delivery with replay.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-992" in item or "at-least-once" in item for item in violations))

    def test_overclaim_in_buyer_doc_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_catalog(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "We provide exactly-once integration events for all tenants.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("exactly-once integration" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_catalog(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Unsafe |\n| At-least-once | "Exactly-once integration events" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
