"""Unit + drift tests for CD deployment lineage contract."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from cd_deployment_lineage import (
    assert_workflows_declare_deployment_lineage,
    build_digest_image_ref,
    build_tag_image_ref,
    format_lineage_summary_markdown,
    require_digest,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCdDeploymentLineage(unittest.TestCase):
    def test_require_digest_accepts_sha256(self) -> None:
        digest = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        self.assertEqual(require_digest("api", digest), digest)

    def test_require_digest_rejects_empty_and_tag(self) -> None:
        with self.assertRaises(ValueError):
            require_digest("api", "")

        with self.assertRaises(ValueError):
            require_digest("api", "latest-dev")

        with self.assertRaises(ValueError):
            require_digest("api", "abcdef")

    def test_build_digest_and_tag_refs(self) -> None:
        digest = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        tag_ref = build_tag_image_ref("myacr.azurecr.io", "archlucid-api", digest[:12])
        digest_ref = build_digest_image_ref("myacr.azurecr.io", "archlucid-api", digest)

        self.assertEqual(tag_ref, f"myacr.azurecr.io/archlucid-api:{digest[:12]}")
        self.assertEqual(digest_ref, f"myacr.azurecr.io/archlucid-api@{digest}")

        with self.assertRaises(ValueError):
            build_tag_image_ref("myacr.azurecr.io", "archlucid-api", "latest-staging")

    def test_format_lineage_summary_includes_required_fields(self) -> None:
        digest = "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
        md = format_lineage_summary_markdown(
            commit_sha="abc123",
            build_id="abc123",
            target_environment="staging",
            image_tag="abc123",
            api_tag_ref="reg/archlucid-api:abc123",
            api_digest_ref=f"reg/archlucid-api@{digest}",
            ui_tag_ref="reg/archlucid-ui:abc123",
            ui_digest_ref=f"reg/archlucid-ui@{digest}",
            worker_digest_ref=f"reg/archlucid-api@{digest}",
            build_result="success",
            deploy_result="success",
            verify_result="success",
            smoke_result="success",
        )

        self.assertIn("## Deployment lineage", md)
        self.assertIn("BUILD_ID: `abc123`", md)
        self.assertIn("Frontend artifact (digest)", md)
        self.assertIn("not push alone", md)

    def test_cd_workflows_declare_deployment_lineage(self) -> None:
        errors = assert_workflows_declare_deployment_lineage(REPO_ROOT)
        self.assertEqual(errors, [], msg="\n".join(errors))

    def test_assert_workflows_detects_missing_verify_gate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            workflow_dir = root / ".github" / "workflows"
            workflow_dir.mkdir(parents=True)
            shared = "\n".join(
                [
                    "Require immutable digests before deploy",
                    "Pre-deploy registry manifest check",
                    "Verify deployed revisions use the SHA-tagged image",
                    "Deployment lineage summary",
                    "API_IMAGE_DIGEST",
                    "needs.build-push-images.outputs",
                    "Capture last-known-good release identity",
                    "cd_plan_rollback.py",
                    'API_IMAGE="${ACR_LOGIN_SERVER}/archlucid-api@${API_IMAGE_DIGEST}"',
                    "exit 0",
                ]
            )
            cd_stub = shared + "\nrollback_build_id\nRoll back to last-known-good after failed smoke\n"
            (workflow_dir / "cd.yml").write_text(cd_stub, encoding="utf-8")
            (workflow_dir / "cd-staging-on-merge.yml").write_text(
                shared.replace("needs.build-push-images.outputs", "steps.build_push_api.outputs.digest"),
                encoding="utf-8",
            )

            errors = assert_workflows_declare_deployment_lineage(root)
            self.assertTrue(any("deploy_ran" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
