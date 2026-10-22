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


POLLY = _load_guard("check_polly_run_completeness_honesty.py", "_check_polly_run_completeness_honesty")
TRUST = _load_guard("check_llm_trust_boundary_honesty.py", "_check_llm_trust_boundary_honesty")
TENANT = _load_guard(
    "check_tenant_identity_header_rederive_honesty.py",
    "_check_tenant_identity_header_rederive_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestPollyRunCompletenessHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = POLLY.polly_run_completeness_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                POLLY.CONTRACT_REL,
                ["**TB-995**", "**TB-996**", "M-146", "M-147", "Polly / CB covers?", "Explicit non-claims"],
            )
            _write_contract(root, POLLY.LLM_RETRY_REL, ["POLLY_VS_RUN_LEVEL_SEMANTICS_CONTRACT.md", "TB-995", "TB-996"])
            cache_path = root / POLLY.CACHE_CLIENT_REL
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache_path.write_text("// TB-940 schema admission\n", encoding="utf-8")
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Polly retries always guarantee complete multi-agent runs.\n",
            )

            violations = POLLY.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))
            self.assertTrue(any("run completion" in item.lower() or "polly" in item.lower() for item in violations))


class TestLlmTrustBoundaryHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = TRUST.llm_trust_boundary_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_injection_proof_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                TRUST.CONTRACT_REL,
                [
                    "**TB-997**",
                    "**TB-998**",
                    "M-148",
                    "M-149",
                    "Structurally impossible",
                    "Explicit non-claims",
                    "injection-proof",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Customer architecture PDFs are injection-proof after upload.\n",
            )

            violations = TRUST.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("injection-proof" in item.lower() for item in violations))


class TestTenantIdentityHeaderRederiveHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = TENANT.tenant_identity_header_rederive_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_header_as_tenant_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                TENANT.CONTRACT_REL,
                [
                    "**TB-999**",
                    "**TB-1000**",
                    "M-150",
                    "M-151",
                    "Forbidden re-derive",
                    "Explicit non-claims",
                    "x-tenant-id",
                ],
            )
            arch_path = root / TENANT.ARCH001_REL
            arch_path.parent.mkdir(parents=True, exist_ok=True)
            arch_path.write_text("// Arch001Descriptor tenant boundary\n", encoding="utf-8")
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "In production, x-tenant-id establishes tenant identity for every API call.\n",
            )

            violations = TENANT.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("x-tenant-id" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
