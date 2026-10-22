#!/usr/bin/env python3
"""Immutable CD build identity helpers (commit SHA) and OCI label contracts.

Self-test: ``python -m unittest discover -s scripts/ci/tests -p "test_oci_build_identity.py"``.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

OCI_LABEL_REVISION = "org.opencontainers.image.revision"
OCI_LABEL_SOURCE = "org.opencontainers.image.source"
OCI_LABEL_TITLE = "org.opencontainers.image.title"
OCI_LABEL_CREATED = "org.opencontainers.image.created"
OCI_LABEL_VERSION = "org.opencontainers.image.version"

REQUIRED_OCI_LABEL_KEYS = (
    OCI_LABEL_REVISION,
    OCI_LABEL_SOURCE,
    OCI_LABEL_TITLE,
    OCI_LABEL_CREATED,
    OCI_LABEL_VERSION,
)

WORKFLOW_RELATIVE_PATHS = (
    ".github/workflows/cd.yml",
    ".github/workflows/cd-staging-on-merge.yml",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_image_tag(build_id: str, image_tag_override: str | None = None) -> str:
    """Default IMAGE_TAG to BUILD_ID; optional override must not be a mutable latest* tag."""
    if build_id is None or not str(build_id).strip():
        raise ValueError("build_id is required")

    normalized_build_id = str(build_id).strip()
    override = (image_tag_override or "").strip()

    if not override:
        return normalized_build_id

    assert_immutable_image_tag(override)

    return override


def assert_immutable_image_tag(image_tag: str) -> None:
    """Reject mutable ``latest`` / ``latest-*`` as the deploy/primary image tag."""
    if image_tag is None or not str(image_tag).strip():
        raise ValueError("image_tag is required")

    normalized = str(image_tag).strip()

    if normalized == "latest" or normalized.startswith("latest-"):
        raise ValueError(
            f"IMAGE_TAG must not be a mutable latest* tag (got: {normalized!r}); "
            "use the commit SHA BUILD_ID (or another immutable tag)."
        )


def build_oci_labels(
    *,
    build_id: str,
    source_repository_url: str,
    title: str,
    created_rfc3339: str,
) -> dict[str, str]:
    """Build the OCI label map stamped onto ArchLucid container images."""
    if not str(build_id).strip():
        raise ValueError("build_id is required")

    if not str(source_repository_url).strip():
        raise ValueError("source_repository_url is required")

    if not str(title).strip():
        raise ValueError("title is required")

    if not str(created_rfc3339).strip():
        raise ValueError("created_rfc3339 is required")

    revision = str(build_id).strip()

    return {
        OCI_LABEL_REVISION: revision,
        OCI_LABEL_SOURCE: str(source_repository_url).strip(),
        OCI_LABEL_TITLE: str(title).strip(),
        OCI_LABEL_CREATED: str(created_rfc3339).strip(),
        OCI_LABEL_VERSION: revision,
    }


def format_docker_buildx_labels(labels: dict[str, str]) -> str:
    """Format labels for docker/build-push-action ``labels: |`` multiline input."""
    return "\n".join(f"{key}={value}" for key, value in labels.items())


def assert_workflows_declare_build_identity(repo: Path | None = None) -> list[str]:
    """Drift-check CD workflows for BUILD_ID + OCI label wiring. Returns error strings."""
    root = repo if repo is not None else repo_root()
    errors: list[str] = []

    for relative in WORKFLOW_RELATIVE_PATHS:
        path = root / relative

        if not path.is_file():
            errors.append(f"missing workflow: {relative}")
            continue

        text = path.read_text(encoding="utf-8")

        if "BUILD_ID=" not in text and "BUILD_ID:" not in text:
            errors.append(f"{relative}: missing BUILD_ID assignment")

        if "env.BUILD_ID" not in text and "${BUILD_ID}" not in text:
            errors.append(f"{relative}: BUILD_ID is not referenced for stamp/deploy")

        for key in REQUIRED_OCI_LABEL_KEYS:
            if key not in text:
                errors.append(f"{relative}: missing OCI label key {key}")

        if "org.opencontainers.image.revision=${{ env.BUILD_ID }}" not in text:
            errors.append(
                f"{relative}: OCI revision label must use ${{{{ env.BUILD_ID }}}}"
            )

        if "BUILD_SHA=${{ env.BUILD_ID }}" not in text:
            errors.append(f"{relative}: BUILD_SHA build-arg must use env.BUILD_ID")

        if "NEXT_PUBLIC_BUILD_COMMIT_SHA=${{ env.BUILD_ID }}" not in text:
            # API-only workflow steps may omit UI; staging + manual CD both build UI.
            if "archlucid-ui" in text:
                errors.append(
                    f"{relative}: NEXT_PUBLIC_BUILD_COMMIT_SHA must use env.BUILD_ID"
                )

        if "NEXT_PUBLIC_CI_BUILD_NUMBER=${{ github.run_number }}" not in text:
            if "archlucid-ui" in text:
                errors.append(
                    f"{relative}: NEXT_PUBLIC_CI_BUILD_NUMBER must use github.run_number"
                )

        if "ARCHLUCID_BUILD_COMMIT_SHA=$BUILD_ID" not in text:
            errors.append(
                f"{relative}: deploy env must set ARCHLUCID_BUILD_COMMIT_SHA=$BUILD_ID"
            )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assert-workflows",
        action="store_true",
        help="Fail if CD workflows drift from BUILD_ID / OCI label contract.",
    )
    parser.add_argument(
        "--assert-image-tag",
        metavar="TAG",
        help="Fail if TAG is a mutable latest* value.",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Override repository root (tests).",
    )
    args = parser.parse_args(argv)

    if args.assert_image_tag is not None:
        try:
            assert_immutable_image_tag(args.assert_image_tag)
        except ValueError as exc:
            print(f"oci_build_identity: FAILED — {exc}", file=sys.stderr)
            return 1

        print(f"oci_build_identity: OK — image tag {args.assert_image_tag!r} is immutable.")
        return 0

    if args.assert_workflows:
        errors = assert_workflows_declare_build_identity(args.repo_root)

        if errors:
            print("oci_build_identity: FAILED — workflow drift:", file=sys.stderr)

            for error in errors:
                print(f"  {error}", file=sys.stderr)

            return 1

        print(
            "oci_build_identity: OK — CD workflows declare BUILD_ID and OCI labels "
            f"({len(WORKFLOW_RELATIVE_PATHS)} file(s))."
        )
        return 0

    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
