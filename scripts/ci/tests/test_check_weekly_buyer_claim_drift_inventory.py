from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_weekly_buyer_claim_drift_inventory.py"
    spec = importlib.util.spec_from_file_location(
        "_check_weekly_buyer_claim_drift_inventory",
        script,
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load weekly buyer-claim drift inventory guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_inventory(root: Path, *, body: str | None = None) -> None:
    path = root / G.INVENTORY_REL
    path.parent.mkdir(parents=True, exist_ok=True)

    if body is not None:
        path.write_text(body, encoding="utf-8")
        return

    rows: list[str] = [
        "# Weekly buyer-claim drift — SEND vs rewrite (2026-07-27)",
        "## Critical — rewrite this week",
    ]

    for index in range(1, 7):
        rows.append(
            f"| **C{index}** | surface | **REWRITE** | **TB-1343** / **TB-1367** |"
        )

    rows.extend(
        [
            "## High — SEND or rewrite before sponsor/procurement use",
        ]
    )

    for index in range(1, 8):
        rows.append(
            f"| **H{index}** | surface | **HOLD** | **M-190** / **G-REAL-05** |"
        )

    rows.extend(
        [
            "## Medium — keep OK if labeled; watch drift from this week’s doc folds",
        ]
    )

    for index in range(1, 5):
        rows.append(f"| **M{index}** | surface | note | **OK** |")

    rows.extend(
        [
            "## Orchestration",
            "Do **not** reopen Done **TB-135**/**TB-136**.",
            "**TB-1464** owns CI against reintroducing C1–C6 class phrases.",
            "GTM **M-263** / **M-264**.",
        ]
    )

    path.write_text("\n".join(rows), encoding="utf-8")


def _write_pa_one_pager(root: Path) -> None:
    path = root / G.PA_ONE_PAGER_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md\n",
        encoding="utf-8",
    )


def _write_procurement_packet(root: Path) -> None:
    path = root / "docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "\n".join(
            [
                "## Weekly buyer-claim drift {#weekly-buyer-claim-drift-m-264}",
                "TB-1463 / TB-1464 own inventory currency and language guards.",
                "Full tables: [`../library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md`](../library/WEEKLY_BUYER_CLAIM_DRIFT_2026_07_27.md).",
            ]
        ),
        encoding="utf-8",
    )


class TestWeeklyBuyerClaimDriftInventory(unittest.TestCase):
    def test_repo_passes(self):
        self.assertEqual(G.weekly_buyer_claim_drift_inventory_errors(_REPO), [])

    def test_missing_inventory_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_procurement_packet(root)

            errors = G.weekly_buyer_claim_drift_inventory_errors(root)

            self.assertTrue(any("missing inventory" in item for item in errors))

    def test_missing_critical_marker_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_inventory(root, body="TB-1463 M-263 M-264 **C1** only")
            _write_procurement_packet(root)
            _write_pa_one_pager(root)

            errors = G.weekly_buyer_claim_drift_inventory_errors(root)

            self.assertTrue(any("C6" in item for item in errors))

    def test_missing_procurement_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_inventory(root)
            _write_pa_one_pager(root)

            errors = G.weekly_buyer_claim_drift_inventory_errors(root)

            self.assertTrue(
                any(
                    "weekly-buyer-claim-drift-m-264" in item or "missing procurement packet" in item
                    for item in errors
                )
            )

    def test_minimal_fixture_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_inventory(root)
            _write_procurement_packet(root)
            _write_pa_one_pager(root)

            self.assertEqual(G.weekly_buyer_claim_drift_inventory_errors(root), [])


if __name__ == "__main__":
    unittest.main()
