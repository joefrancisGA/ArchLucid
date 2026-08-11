from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_shared_aoai_tpm_noisy_neighbor_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_shared_aoai_tpm_noisy_neighbor_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load shared-AOAI-TPM noisy-neighbor honesty guard.")

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
                "**TB-1577**",
                "**TB-1578**",
                "M-296",
                "WFQ",
                "Partial / Failed",
                "**TB-1336**",
                "**TB-1299**",
                "**TB-947**",
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
                "SHARED_AOAI_TPM_NOISY_NEIGHBOR_FAIRNESS_CLAIM_MAP.md",
                "TB-1577",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestSharedAoaiTpmNoisyNeighborHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.shared_aoai_tpm_noisy_neighbor_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_pa_one_pager(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Spend caps are not TPM fairness.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1577" in item or "TB-1578" in item for item in violations))

    def test_fair_share_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "ArchLucid provides per-tenant fair share of shared AOAI TPM under contention.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("fair share" in item.lower() for item in violations))

    def test_token_budget_isolation_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Token budgets isolate tenants from each other's AOAI load completely.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("isolat" in item.lower() for item in violations))

    def test_replicas_fix_noisy_neighbor_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "More CA replicas fix noisy-neighbor LLM contention for every tenant.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"))

            self.assertTrue(any("replica" in item.lower() for item in violations))

    def test_silent_starvation_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                "Under shared TPM saturation tenant B silently starves while dashboards stay green.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertTrue(any("starv" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Too strong |\n| --- | --- |\n| Honest summary | "Per-tenant fair share of TPM" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
