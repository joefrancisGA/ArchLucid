from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_anti_gates_alone_finops_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_anti_gates_alone_finops_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load anti-gates-alone FinOps honesty guard.")

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
                "**TB-1287**",
                "LlmCompletionAccountingClient",
                "**$15**",
                "M-225",
                "**TB-1288**",
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
                "LLM_COST_CONTROL_PLANE_BEYOND_BUDGET_GATES_CONTRACT.md",
                "TB-1287",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestAntiGatesAloneFinopsHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.anti_gates_alone_finops_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_pa_one_pager(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Decorator chokepoint accounting.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1287" in item or "LlmCompletionAccountingClient" in item for item in violations))

    def test_gates_alone_finops_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Warn/kill + monthly cap alone are mature FinOps for every tenant.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("mature finops" in item.lower() or "warn/kill" in item.lower() for item in violations))

    def test_call_site_reserve_bypass_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Call-site reserve prevents bypass by any new completion path.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("call-site" in item.lower() or "bypass" in item.lower() for item in violations))

    def test_stale_cohort_cap_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "Golden cohort budget is $50/month for live eval harness spend.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"))

            self.assertTrue(any("$50" in item or "cohort" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Too strong |\n| Chokepoint accounting | "Warn/kill + monthly cap = FinOps" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
