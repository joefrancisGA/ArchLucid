"""Unit + drift tests for CD BUILD_ID / OCI image label contract."""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]

if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from oci_build_identity import (
    OCI_LABEL_CREATED,
    OCI_LABEL_REVISION,
    OCI_LABEL_SOURCE,
    OCI_LABEL_TITLE,
    OCI_LABEL_VERSION,
    assert_immutable_image_tag,
    assert_workflows_declare_build_identity,
    build_oci_labels,
    format_docker_buildx_labels,
    resolve_image_tag,
)

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestOciBuildIdentity(unittest.TestCase):
    def test_resolve_image_tag_defaults_to_build_id(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"

        self.assertEqual(resolve_image_tag(build_id), build_id)
        self.assertEqual(resolve_image_tag(build_id, None), build_id)
        self.assertEqual(resolve_image_tag(build_id, "  "), build_id)

    def test_resolve_image_tag_allows_non_latest_override(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"

        self.assertEqual(resolve_image_tag(build_id, "1.2.3-rc10"), "1.2.3-rc10")

    def test_resolve_image_tag_rejects_mutable_latest(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"

        with self.assertRaises(ValueError):
            resolve_image_tag(build_id, "latest")

        with self.assertRaises(ValueError):
            resolve_image_tag(build_id, "latest-staging")

        with self.assertRaises(ValueError):
            assert_immutable_image_tag("latest-production")

    def test_build_oci_labels_uses_build_id_for_revision_and_version(self) -> None:
        build_id = "abcdef0123456789abcdef0123456789abcdef01"
        labels = build_oci_labels(
            build_id=build_id,
            source_repository_url="https://github.com/example/ArchLucid",
            title="archlucid-api",
            created_rfc3339="2026-07-16T15:00:00Z",
        )

        self.assertEqual(labels[OCI_LABEL_REVISION], build_id)
        self.assertEqual(labels[OCI_LABEL_VERSION], build_id)
        self.assertEqual(labels[OCI_LABEL_TITLE], "archlucid-api")
        self.assertEqual(labels[OCI_LABEL_SOURCE], "https://github.com/example/ArchLucid")
        self.assertEqual(labels[OCI_LABEL_CREATED], "2026-07-16T15:00:00Z")

        formatted = format_docker_buildx_labels(labels)
        self.assertIn(f"{OCI_LABEL_REVISION}={build_id}", formatted)
        self.assertNotIn("secret", formatted.lower())

    def test_cd_workflows_declare_build_id_and_oci_labels(self) -> None:
        errors = assert_workflows_declare_build_identity(REPO_ROOT)
        self.assertEqual(errors, [], msg="\n".join(errors))

    def test_assert_workflows_detects_missing_ci_build_number(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            workflow_dir = root / ".github" / "workflows"
            workflow_dir.mkdir(parents=True)
            stub = (
                "BUILD_ID=deadbeef\n"
                "env.BUILD_ID\n"
                "BUILD_SHA=${{ env.BUILD_ID }}\n"
                "NEXT_PUBLIC_BUILD_COMMIT_SHA=${{ env.BUILD_ID }}\n"
                "ARCHLUCID_BUILD_COMMIT_SHA=$BUILD_ID\n"
                "archlucid-ui\n"
                "org.opencontainers.image.revision=${{ env.BUILD_ID }}\n"
                "org.opencontainers.image.source=https://example.com\n"
                "org.opencontainers.image.title=archlucid-api\n"
                "org.opencontainers.image.created=2026-01-01T00:00:00Z\n"
                "org.opencontainers.image.version=${{ env.BUILD_ID }}\n"
            )
            (workflow_dir / "cd.yml").write_text(stub, encoding="utf-8")
            (workflow_dir / "cd-staging-on-merge.yml").write_text(stub, encoding="utf-8")

            errors = assert_workflows_declare_build_identity(root)
            self.assertTrue(any("NEXT_PUBLIC_CI_BUILD_NUMBER" in error for error in errors))

    def test_assert_workflows_detects_missing_revision_label(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            workflow_dir = root / ".github" / "workflows"
            workflow_dir.mkdir(parents=True)
            stub = (
                "BUILD_ID=deadbeef\n"
                "BUILD_SHA=${{ env.BUILD_ID }}\n"
                "NEXT_PUBLIC_BUILD_COMMIT_SHA=${{ env.BUILD_ID }}\n"
                "ARCHLUCID_BUILD_COMMIT_SHA=$BUILD_ID\n"
                "archlucid-ui\n"
                "org.opencontainers.image.source=https://example.com\n"
                "org.opencontainers.image.title=archlucid-api\n"
                "org.opencontainers.image.created=2026-01-01T00:00:00Z\n"
                "org.opencontainers.image.version=${{ env.BUILD_ID }}\n"
            )
            (workflow_dir / "cd.yml").write_text(stub, encoding="utf-8")
            (workflow_dir / "cd-staging-on-merge.yml").write_text(stub, encoding="utf-8")

            errors = assert_workflows_declare_build_identity(root)
            self.assertTrue(any("revision" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
