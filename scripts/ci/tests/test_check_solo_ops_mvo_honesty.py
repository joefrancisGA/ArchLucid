from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_solo_ops_mvo_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_solo_ops_mvo_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load solo-ops MVO honesty guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


def _write_mvo_doc(root: Path, *, body: str) -> None:
    path = root / G.MVO_DOC_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def _write_p0_rules(root: Path, *, body: str) -> None:
    path = root / G.P0_RULES_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def _write_backlog(root: Path, *, body: str) -> None:
    path = root / G.TECH_BACKLOG_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestSoloOpsMvoHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.solo_ops_mvo_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_mvo_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_mvo_doc(root, body="TB-957 enablement only.\n")
            _write_p0_rules(
                root,
                body='action { action_group_id = azurerm_monitor_action_group.critical[0].id }\n',
            )
            _write_backlog(root, body="| TB-958 | open row | P1 | S |\n")

            violations = G.mvo_doc_violations(root)

            self.assertTrue(any("TB-991" in item or "TB-958" in item for item in violations))

    def test_p0_ops_wiring_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_p0_rules(
                root,
                body='action { action_group_id = azurerm_monitor_action_group.ops[0].id }\n',
            )

            violations = G.p0_rules_wiring_violations(root)

            self.assertTrue(any("ops" in item for item in violations))

    def test_affirmative_per_tenant_claim_fails_when_gap_open(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_mvo_doc(
                root,
                body="\n".join(
                    [
                        "TB-958",
                        "TB-959",
                        "Do not promise",
                        "critical action group",
                        "Report Problem",
                        "Honesty boundaries",
                        "TB-991",
                    ]
                ),
            )
            _write_p0_rules(
                root,
                body='action { action_group_id = azurerm_monitor_action_group.critical[0].id }\n',
            )
            _write_backlog(root, body="| TB-958 | still open | P1 | S |\n| TB-959 | still open | P1 | S |\n")
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "Every tenant failure pages before support opens a ticket.\n",
            )

            violations = G.solo_ops_mvo_honesty_violations(root)

            self.assertTrue(any("Every tenant failure pages" in item for item in violations))


if __name__ == "__main__":
    unittest.main()
