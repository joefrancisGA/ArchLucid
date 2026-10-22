from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_live_vs_nightly_tripwire_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_live_vs_nightly_tripwire_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load live vs nightly tripwire honesty guard.")

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
                "**Status:** **Done** (TB-1506)",
                "TB-683 nightly scores frozen exemplars.",
                "does **not** call production AOAI.",
                "no shipped live canary loop.",
                "Prometheus rate alerts only.",
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
                "## Tripwire {#live-vs-nightly-finding-quality-tripwire-m-276}",
                "TB-1506 engineering map.",
                "TB-683 does **not** call Azure OpenAI.",
                "Do not claim nightly eval catches model revs.",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_targets(root: Path, *, body: str) -> None:
    _write_contract(root)
    _write_procurement_packet(root)

    for rel in G.DOCS_TO_SCAN:
        if rel.as_posix() == "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md":
            continue

        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body, encoding="utf-8")


class TestLiveVsNightlyTripwireHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.live_vs_nightly_tripwire_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_safe_fixture_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Do not claim nightly real-mode eval catches Azure model revs.\n",
            )

            self.assertEqual(G.live_vs_nightly_tripwire_honesty_violations(root), [])

    def test_nightly_calls_prod_aoai_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="Our real-mode-eval-nightly workflow calls production Azure OpenAI every night.\n",
            )

            violations = G.live_vs_nightly_tripwire_honesty_violations(root)

            self.assertTrue(any("real-mode-eval-nightly" in violation for violation in violations))

    def test_always_before_customers_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="We always detect quality degradation before customers notice.\n",
            )

            violations = G.live_vs_nightly_tripwire_honesty_violations(root)

            self.assertTrue(any("before customers" in violation for violation in violations))

    def test_live_real_mode_monitoring_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(root, body="Nightly provides live real-mode monitoring for production tenants.\n")

            violations = G.live_vs_nightly_tripwire_honesty_violations(root)

            self.assertTrue(any("live real-mode monitoring" in violation for violation in violations))

    def test_allowlist_marker_skips_violation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_scan_targets(
                root,
                body="We always detect quality before customers. live-vs-nightly-tripwire-honesty: allow\n",
            )

            self.assertEqual(G.live_vs_nightly_tripwire_honesty_violations(root), [])


if __name__ == "__main__":
    unittest.main()
