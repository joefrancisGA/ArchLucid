from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_concurrent_execute_commit_honesty.py"
    spec = importlib.util.spec_from_file_location("_check_concurrent_execute_commit_honesty", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load concurrent execute/commit honesty guard.")

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
                "**TB-1270**",
                "first-wins",
                "409",
                "process-idempotent",
                "M-221",
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
                "CONCURRENT_EXECUTE_AND_COMMIT_RACE_CONTRACT.md",
                "TB-1270",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestConcurrentExecuteCommitHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.concurrent_execute_commit_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_pa_one_pager(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "First-wins commit under CAS.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1270" in item or "first-wins" in item for item in violations))

    def test_exactly_once_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "We deliver exactly-once commit for every architecture package.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("exactly-once" in item.lower() for item in violations))

    def test_retry_never_spends_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Retries never spend LLM tokens at the provider.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("retry" in item.lower() or "never spend" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Unsafe |\n| First-wins CAS | "Exactly-once commit end-to-end" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
