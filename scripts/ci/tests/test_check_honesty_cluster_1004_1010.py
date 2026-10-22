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


MANIFEST = _load_guard("check_committed_manifest_substitute_honesty.py", "_check_committed_manifest_substitute_honesty")
NETARCH = _load_guard("check_netarchtest_isolation_honesty.py", "_check_netarchtest_isolation_honesty")
AUTHORITY = _load_guard("check_authority_agenttask_path_honesty.py", "_check_authority_agenttask_path_honesty")
APPEND = _load_guard("check_append_only_sealed_evidence_honesty.py", "_check_append_only_sealed_evidence_honesty")


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestCommittedManifestSubstituteHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = MANIFEST.committed_manifest_substitute_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_substitute_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                MANIFEST.CONTRACT_REL,
                [
                    "**TB-1003**",
                    "**TB-1004**",
                    "M-154",
                    "M-155",
                    "Forbidden substitutes",
                    "Explicit non-claims",
                    "review-backed",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "The findings list is the signed architecture package for every pilot.\n",
            )

            violations = MANIFEST.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("findings" in item.lower() for item in violations))


class TestNetarchtestIsolationHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = NETARCH.netarchtest_isolation_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_netarch_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                NETARCH.CONTRACT_REL,
                [
                    "**TB-1005**",
                    "**TB-1006**",
                    "M-156",
                    "M-157",
                    "Compile-time held",
                    "Explicit non-claims",
                    "ArchitectureConstraintCompatibilityStubCatalog",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "NetArchTest proves tenant isolation for every deployment.\n",
            )

            violations = NETARCH.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))
            self.assertTrue(any("netarch" in item.lower() for item in violations))


class TestAuthorityAgenttaskPathHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = AUTHORITY.authority_agenttask_path_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_always_execute_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                AUTHORITY.CONTRACT_REL,
                [
                    "**TB-1007**",
                    "**TB-1008**",
                    "M-158",
                    "M-159",
                    "Forbidden / must-not-finish-with",
                    "Explicit non-claims",
                ],
            )
            _write_scan_target(root, AUTHORITY.FLOW_REL, "Flow A1\nAUTHORITY_VS_AGENTTASK_LOOP_CANONICAL_PATH_CONTRACT\n")
            _write_scan_target(
                root,
                Path("docs/library/API_CONTRACTS.md"),
                "Every create requires execute before the review can progress.\n",
            )

            violations = AUTHORITY.scan_doc_claims(root, Path("docs/library/API_CONTRACTS.md"))
            self.assertTrue(any("execute" in item.lower() for item in violations))


class TestAppendOnlySealedEvidenceHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = APPEND.append_only_sealed_evidence_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_editable_audit_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                APPEND.CONTRACT_REL,
                [
                    "**TB-1009**",
                    "**TB-1010**",
                    "M-160",
                    "M-161",
                    "Non-claims",
                    "CI anchors for **TB-1010**",
                    "INV-011",
                ],
            )
            registry = root / APPEND.SEALED_REGISTRY_REL
            registry.parent.mkdir(parents=True, exist_ok=True)
            registry.write_text("class SealedEvidenceTableRegistry {}\n", encoding="utf-8")
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "Operators can edit the audit log to correct historical entries.\n",
            )

            violations = APPEND.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("audit" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
