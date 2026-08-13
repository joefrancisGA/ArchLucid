from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_policy_pack_customer_rule_sandbox_honesty.py"
    spec = importlib.util.spec_from_file_location(
        "_check_policy_pack_customer_rule_sandbox_honesty",
        script,
    )

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load policy-pack customer-rule sandbox honesty guard.")

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
                "**TB-1624**",
                "**TB-1625**",
                "M-298",
                "WASM",
                "RuleSetHash",
                "EffectiveGovernanceAtCommit",
                "DecisionRuleCriteriaEvaluator",
                "**TB-1324**",
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
                "POLICY_PACK_CUSTOMER_RULE_SANDBOX_PIN_BLAST_RADIUS_CLAIM_MAP.md",
                "TB-1624",
            ]
        ),
        encoding="utf-8",
    )


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestPolicyPackCustomerRuleSandboxHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = G.policy_pack_customer_rule_sandbox_honesty_violations(_REPO)

        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_missing_contract_anchor_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_pa_one_pager(root)
            _write_scan_target(root, G.DOCS_TO_SCAN[0], "Declarative in-process rules only.\n")

            violations = G.contract_violations(root)

            self.assertTrue(any("TB-1624" in item or "TB-1625" in item for item in violations))

    def test_wasm_sandbox_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Customer policy-pack rules execute in a secure WASM sandbox for every tenant.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"))

            self.assertTrue(any("wasm" in item.lower() for item in violations))

    def test_pack_json_rce_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Pack JSON is arbitrary code enabling RCE for governance plugins.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))

            self.assertTrue(any("rce" in item.lower() or "script" in item.lower() for item in violations))

    def test_broken_packs_cannot_affect_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
                "Broken packs cannot affect reviews in ArchLucid workspaces.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"))

            self.assertTrue(any("broken" in item.lower() for item in violations))

    def test_malicious_pack_platform_wide_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                "A malicious pack takes down the platform and other tenants overnight.\n",
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertTrue(any("platform" in item.lower() or "tenant" in item.lower() for item in violations))

    def test_execute_time_pin_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
                "Policy pack versions are durably pinned at execute for every run.\n",
            )

            violations = G.scan_doc_claims(
                root,
                Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
            )

            self.assertTrue(any("pin" in item.lower() or "execute" in item.lower() for item in violations))

    def test_forbidden_example_table_row_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(root)
            _write_pa_one_pager(root)
            _write_scan_target(
                root,
                Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
                '| Safe | Too strong |\n| --- | --- |\n| Honest summary | "Rules run in a WASM sandbox" |\n',
            )

            violations = G.scan_doc_claims(root, Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"))

            self.assertEqual(violations, [])


if __name__ == "__main__":
    unittest.main()
