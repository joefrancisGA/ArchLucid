from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_live_demo_see_it_ladder_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_live_demo_see_it_ladder_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load live-demo see-it ladder honesty guard.")

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
                "**TB-1427** fused ladder contract.",
                "**TB-1428** honesty CI.",
                "Guided sample walkthrough",
                "fabricated sample walkthrough",
                "## Explicit non-claims",
                "check_live_demo_see_it_ladder_honesty.py",
                "| **TB-1029** | Anti-Claims-banner-Contoso-payload honesty CI | **Open** |",
                "| **TB-1266** | hero budget | **Open** |",
            ]
        ),
        encoding="utf-8",
    )


def _write_procurement_packet(root: Path) -> None:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "## Ladder {#live-demo-see-it-ladder-m-260}",
                "TB-1427 contract.",
                "TB-1428 honesty CI.",
                "Guided fabricated sample walkthrough.",
            ]
        ),
        encoding="utf-8",
    )


def _write_live_demo_copy(root: Path) -> None:
    path = root / "archlucid-ui/src/lib/live-demo-page-copy.ts"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                'export const LIVE_DEMO_PAGE_TITLE = "Guided sample walkthrough";',
                'export const LIVE_DEMO_FABRICATED_DISCLOSURE = "fabricated sample data";',
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_targets(root: Path, *, body: str) -> None:
    _write_contract(root)
    _write_procurement_packet(root)
    _write_live_demo_copy(root)

    for rel in G.DOCS_TO_SCAN:
        if rel.as_posix() == "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md":
            continue

        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


class TestLiveDemoSeeItLadderHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.live_demo_see_it_ladder_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_safe_fixture_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Do not sell /live-demo as a live tenant product demo. Offline curated sample is not a live API session.\n",
            )

            self.assertEqual(G.live_demo_see_it_ladder_honesty_violations(root), [])

    def test_live_product_demo_claim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Our /live-demo route is a live tenant product demo for buyers.\n",
            )

            violations = G.live_demo_see_it_ladder_honesty_violations(root)

            self.assertTrue(any("live / Real / tenant product demo" in item for item in violations))

    def test_offline_as_live_api_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="The offline curated sample fallback is a live API session on /live-demo.\n",
            )

            violations = G.live_demo_see_it_ladder_honesty_violations(root)

            self.assertTrue(any("offline curated fallback" in item for item in violations))

    def test_ladder_done_while_open_rows_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(root, body="The see-it ladder is done for procurement.\n")

            violations = G.live_demo_see_it_ladder_honesty_violations(root)

            self.assertTrue(any("see-it ladder is done" in item for item in violations))

    def test_ladder_done_with_residual_caveat_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Treat ladder done while TB-1029 remains open as a review finding.\n",
            )

            self.assertEqual(G.live_demo_see_it_ladder_honesty_violations(root), [])


if __name__ == "__main__":
    unittest.main()
