from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard(script_name: str, module_name: str):
    script = _CI / script_name
    spec = importlib.util.spec_from_file_location(module_name, script)

    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {script_name}.")

    sys.path.insert(0, str(_CI))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


RETRIEVAL = _load_guard(
    "check_retrieval_tenancy_hit_guarantee_honesty.py",
    "_check_retrieval_tenancy_hit_guarantee_honesty",
)
FINALIZE = _load_guard(
    "check_transactional_finalize_outbox_honesty.py",
    "_check_transactional_finalize_outbox_honesty",
)
GATE_SOD = _load_guard(
    "check_pre_finalize_gate_sod_honesty.py",
    "_check_pre_finalize_gate_sod_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestRetrievalTenancyHitGuaranteeHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = RETRIEVAL.retrieval_tenancy_hit_guarantee_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_per_tenant_index_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                RETRIEVAL.CONTRACT_REL,
                [
                    "**TB-1001**",
                    "**TB-1002**",
                    "M-152",
                    "M-153",
                    "Explicit non-claims",
                    "CI anchors for **TB-1002**",
                    "BuildRequiredScopeFilter",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Each tenant gets a dedicated Azure AI Search index for isolation.\n",
            )

            violations = RETRIEVAL.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("dedicated" in item.lower() for item in violations))


class TestTransactionalFinalizeOutboxHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = FINALIZE.transactional_finalize_outbox_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_commit_equals_indexed_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                FINALIZE.CONTRACT_REL,
                [
                    "**TB-1011**",
                    "**TB-1012**",
                    "M-162",
                    "M-163",
                    "Non-claims",
                    "CI anchors for **TB-1012**",
                    "Never silent best-effort",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Commit success means Search indexed immediately for every buyer.\n",
            )

            violations = FINALIZE.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))
            self.assertTrue(any("indexed" in item.lower() for item in violations))


class TestPreFinalizeGateSodHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = GATE_SOD.pre_finalize_gate_sod_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_pack_certification_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                GATE_SOD.CONTRACT_REL,
                [
                    "**TB-1022**",
                    "**TB-1023**",
                    "M-172",
                    "M-173",
                    "Non-claims",
                    "CI anchors for **TB-1023**",
                    "PreCommitGateEnabled",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Policy packs are HIPAA certification for your architecture reviews.\n",
            )

            violations = GATE_SOD.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("certification" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
