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


TF_AUTHORITY = _load_guard(
    "check_container_apps_terraform_authority_honesty.py",
    "_check_container_apps_terraform_authority_honesty",
)
POLICY_PACK = _load_guard(
    "check_policy_pack_evaluation_hybrid_honesty.py",
    "_check_policy_pack_evaluation_hybrid_honesty",
)
REVIEW_100X = _load_guard(
    "check_review_volume_100x_capacity_honesty.py",
    "_check_review_volume_100x_capacity_honesty",
)
WNTP_UI = _load_guard(
    "check_wntp_buyer_ui_honesty.py",
    "_check_wntp_buyer_ui_honesty",
)


def _write_contract(root: Path, rel: Path, markers: list[str]) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(markers), encoding="utf-8")


def _write_scan_target(root: Path, rel: Path, body: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(body, encoding="utf-8")


class TestContainerAppsTerraformAuthorityHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = TF_AUTHORITY.container_apps_terraform_authority_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_tf_state_sot_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                TF_AUTHORITY.CONTRACT_REL,
                [
                    "**TB-1317**",
                    "**TB-1318**",
                    "M-233",
                    "Explicit non-claims",
                    "CI anchors for **TB-1318**",
                    "lifecycle.ignore_changes",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/POSITIONING.md"),
                "Terraform state is the source of truth for Container Apps.\n",
            )
            violations = TF_AUTHORITY.scan_doc_claims(root, Path("docs/go-to-market/POSITIONING.md"))
            self.assertTrue(any("source of truth" in item.lower() for item in violations))


class TestPolicyPackEvaluationHybridHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = POLICY_PACK.policy_pack_evaluation_hybrid_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_compile_per_pack_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                POLICY_PACK.CONTRACT_REL,
                [
                    "**TB-1324**",
                    "**TB-1325**",
                    "M-235",
                    "Explicit non-claims",
                    "CI anchors for **TB-1325**",
                    "RuleBasedDecisionEngine",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
                "Each new HIPAA pack requires a new C# decision engine.\n",
            )
            violations = POLICY_PACK.scan_doc_claims(
                root,
                Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
            )
            self.assertTrue(any("hipaa" in item.lower() for item in violations))


class TestReviewVolume100xCapacityHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = REVIEW_100X.review_volume_100x_capacity_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_sql_fails_first_overclaim_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                REVIEW_100X.CONTRACT_REL,
                [
                    "**TB-1336**",
                    "**TB-1337**",
                    "M-237",
                    "Explicit non-claims",
                    "CI anchors for **TB-1337**",
                    "LLM quota",
                ],
            )
            _write_scan_target(
                root,
                Path("docs/go-to-market/trust-center.md"),
                "At 100x reviews SQL manifest storage fails first.\n",
            )
            violations = REVIEW_100X.scan_doc_claims(root, Path("docs/go-to-market/trust-center.md"))
            self.assertTrue(any("100" in item.lower() for item in violations))


class TestWntpBuyerUiHonesty(unittest.TestCase):
    def test_repo_passes(self):
        violations = WNTP_UI.wntp_buyer_ui_honesty_violations(_REPO)
        self.assertEqual(violations, [], msg="\n".join(violations))

    def test_soc2_certified_in_ui_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            _write_contract(
                root,
                WNTP_UI.CONTRACT_REL,
                [
                    "**TB-1343**",
                    "**TB-1344**",
                    "M-239",
                    "CI anchors for **TB-1344**",
                    "Forbidden without negation",
                ],
            )
            ui_rel = Path("archlucid-ui/src/lib/billing-help-guide-content.ts")
            _write_scan_target(root, ui_rel, 'export const copy = "We are SOC 2 certified today.";\n')
            violations = WNTP_UI.scan_ui_file(root, ui_rel)
            self.assertTrue(any("soc 2" in item.lower() for item in violations))


if __name__ == "__main__":
    unittest.main()
