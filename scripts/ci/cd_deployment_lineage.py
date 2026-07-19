#!/usr/bin/env python3
"""CD deployment lineage helpers: digest refs, summary Markdown, workflow drift checks.

Self-test: ``python -m unittest discover -s scripts/ci/tests -p "test_cd_deployment_lineage.py"``.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

WORKFLOW_RELATIVE_PATHS = (
    ".github/workflows/cd.yml",
    ".github/workflows/cd-staging-on-merge.yml",
)

# Shared by cd.yml and cd-staging-on-merge.yml
LINEAGE_MARKERS = (
    "Require immutable digests before deploy",
    "Pre-deploy registry manifest check",
    "Verify deployed revisions use the SHA-tagged image",
    "Deployment lineage summary",
    "API_IMAGE_DIGEST",
    "needs.build-push-images.outputs",
    "Capture last-known-good release identity",
    "cd_plan_rollback.py",
)

# Manual rollback path exists only on workflow_dispatch CD
CD_YML_ONLY_MARKERS = (
    "rollback_build_id",
    "Roll back to last-known-good after failed smoke",
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def require_non_empty(name: str, value: str | None) -> str:
    if value is None or not str(value).strip():
        raise ValueError(f"{name} is required for deploy lineage")

    return str(value).strip()


def require_digest(name: str, digest: str | None) -> str:
    normalized = require_non_empty(name, digest)

    if not normalized.startswith("sha256:"):
        raise ValueError(f"{name} must be a sha256 digest (got: {normalized!r})")

    return normalized


def build_digest_image_ref(registry: str, repository: str, digest: str) -> str:
    registry_n = require_non_empty("registry", registry).rstrip("/")
    repository_n = require_non_empty("repository", repository)
    digest_n = require_digest("digest", digest)

    return f"{registry_n}/{repository_n}@{digest_n}"


def build_tag_image_ref(registry: str, repository: str, image_tag: str) -> str:
    registry_n = require_non_empty("registry", registry).rstrip("/")
    repository_n = require_non_empty("repository", repository)
    tag_n = require_non_empty("image_tag", image_tag)

    if tag_n == "latest" or tag_n.startswith("latest-"):
        raise ValueError(f"image_tag must not be mutable latest* (got: {tag_n!r})")

    return f"{registry_n}/{repository_n}:{tag_n}"


def format_lineage_summary_markdown(
    *,
    commit_sha: str,
    build_id: str,
    target_environment: str,
    image_tag: str,
    api_tag_ref: str,
    api_digest_ref: str,
    ui_tag_ref: str,
    ui_digest_ref: str,
    worker_digest_ref: str,
    build_result: str,
    deploy_result: str,
    verify_result: str,
    smoke_result: str,
) -> str:
    lines = [
        "## Deployment lineage",
        f"- Commit SHA: `{require_non_empty('commit_sha', commit_sha)}`",
        f"- BUILD_ID: `{require_non_empty('build_id', build_id)}`",
        f"- Target environment: `{require_non_empty('target_environment', target_environment)}`",
        f"- Image tag: `{require_non_empty('image_tag', image_tag)}`",
        f"- API artifact (tag): `{require_non_empty('api_tag_ref', api_tag_ref)}`",
        f"- API artifact (digest): `{require_non_empty('api_digest_ref', api_digest_ref)}`",
        f"- Frontend artifact (tag): `{require_non_empty('ui_tag_ref', ui_tag_ref)}`",
        f"- Frontend artifact (digest): `{require_non_empty('ui_digest_ref', ui_digest_ref)}`",
        f"- Worker artifact (digest): `{require_non_empty('worker_digest_ref', worker_digest_ref)}`",
        f"- Job results: build={build_result}, deploy={deploy_result}, verify={verify_result}, smoke={smoke_result}",
        "",
        "Deployment success requires digest-pinned deploy + revision image verify + smoke — not push alone.",
    ]

    return "\n".join(lines) + "\n"


def format_lineage_summary_json(
    *,
    commit_sha: str,
    build_id: str,
    target_environment: str,
    image_tag: str,
    api_tag_ref: str,
    api_digest_ref: str,
    ui_tag_ref: str,
    ui_digest_ref: str,
    worker_digest_ref: str,
    build_result: str,
    deploy_result: str,
    verify_result: str,
    smoke_result: str,
) -> str:
    payload = {
        "commitSha": require_non_empty("commit_sha", commit_sha),
        "buildId": require_non_empty("build_id", build_id),
        "targetEnvironment": require_non_empty("target_environment", target_environment),
        "imageTag": require_non_empty("image_tag", image_tag),
        "apiArtifactTag": require_non_empty("api_tag_ref", api_tag_ref),
        "apiArtifactDigest": require_non_empty("api_digest_ref", api_digest_ref),
        "frontendArtifactTag": require_non_empty("ui_tag_ref", ui_tag_ref),
        "frontendArtifactDigest": require_non_empty("ui_digest_ref", ui_digest_ref),
        "workerArtifactDigest": require_non_empty("worker_digest_ref", worker_digest_ref),
        "jobResults": {
            "build": build_result,
            "deploy": deploy_result,
            "verify": verify_result,
            "smoke": smoke_result,
        },
    }

    return json.dumps(payload, indent=2) + "\n"


def assert_workflows_declare_deployment_lineage(repo: Path | None = None) -> list[str]:
    """Drift-check CD workflows for digest-required deploy + lineage summary."""
    root = repo if repo is not None else repo_root()
    errors: list[str] = []

    for relative in WORKFLOW_RELATIVE_PATHS:
        path = root / relative

        if not path.is_file():
            errors.append(f"missing workflow: {relative}")
            continue

        text = path.read_text(encoding="utf-8")

        for marker in LINEAGE_MARKERS:
            if marker not in text:
                # staging-on-merge is a single job (no needs.build-push-images.outputs)
                if marker == "needs.build-push-images.outputs" and "cd-staging-on-merge" in relative:
                    if "steps.build_push_api.outputs.digest" not in text:
                        errors.append(
                            f"{relative}: missing build-push digest wiring for deploy"
                        )
                    continue

                errors.append(f"{relative}: missing lineage marker {marker!r}")

        if relative.endswith("cd.yml"):
            for marker in CD_YML_ONLY_MARKERS:
                if marker not in text:
                    errors.append(f"{relative}: missing CD-only marker {marker!r}")

        if "sha256:" not in text and "API_IMAGE_DIGEST" in text:
            # digests come from action outputs; workflows should still require sha256 shape in scripts
            pass

        if 'API_IMAGE="${ACR_LOGIN_SERVER}/archlucid-api:${IMAGE_TAG}"' in text:
            # Tag-only construction is OK as fallback scaffolding only when digest-required
            # guard precedes it. Require digest-first assign for the deploy path.
            if "archlucid-api@${API_IMAGE_DIGEST}" not in text and "archlucid-api@${{ env.API_IMAGE_DIGEST }}" not in text:
                if "archlucid-api@${API_IMAGE_DIGEST}" not in text:
                    errors.append(f"{relative}: deploy must use digest-pinned API image ref")

        if "exit 0" in text and "Verify deployed revisions" in text:
            # verify step must not soft-skip when deploy_ran=true — enforced by marker + script
            if "deploy_ran" not in text and "DEPLOY_RAN" not in text:
                errors.append(
                    f"{relative}: image verify must gate skips with deploy_ran/DEPLOY_RAN"
                )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assert-workflows",
        action="store_true",
        help="Fail if CD workflows drift from deployment lineage contract.",
    )
    parser.add_argument(
        "--require-digest",
        metavar="DIGEST",
        help="Fail unless DIGEST is a non-empty sha256: digest.",
    )
    parser.add_argument(
        "--digest-name",
        default="digest",
        help="Label used in --require-digest errors.",
    )
    parser.add_argument(
        "--write-summary",
        action="store_true",
        help="Write lineage Markdown (and optional JSON) from env-style args.",
    )
    parser.add_argument("--commit-sha", default="")
    parser.add_argument("--build-id", default="")
    parser.add_argument("--target-environment", default="")
    parser.add_argument("--image-tag", default="")
    parser.add_argument("--api-tag-ref", default="")
    parser.add_argument("--api-digest-ref", default="")
    parser.add_argument("--ui-tag-ref", default="")
    parser.add_argument("--ui-digest-ref", default="")
    parser.add_argument("--worker-digest-ref", default="")
    parser.add_argument("--build-result", default="unknown")
    parser.add_argument("--deploy-result", default="unknown")
    parser.add_argument("--verify-result", default="unknown")
    parser.add_argument("--smoke-result", default="unknown")
    parser.add_argument("--summary-path", type=Path, default=None)
    parser.add_argument("--json-path", type=Path, default=None)
    parser.add_argument("--repo-root", type=Path, default=None)
    args = parser.parse_args(argv)

    if args.require_digest is not None:
        try:
            require_digest(args.digest_name, args.require_digest)
        except ValueError as exc:
            print(f"cd_deployment_lineage: FAILED — {exc}", file=sys.stderr)
            return 1

        print(f"cd_deployment_lineage: OK — {args.digest_name} is a sha256 digest.")
        return 0

    if args.write_summary:
        try:
            markdown = format_lineage_summary_markdown(
                commit_sha=args.commit_sha,
                build_id=args.build_id,
                target_environment=args.target_environment,
                image_tag=args.image_tag,
                api_tag_ref=args.api_tag_ref,
                api_digest_ref=args.api_digest_ref,
                ui_tag_ref=args.ui_tag_ref,
                ui_digest_ref=args.ui_digest_ref,
                worker_digest_ref=args.worker_digest_ref,
                build_result=args.build_result,
                deploy_result=args.deploy_result,
                verify_result=args.verify_result,
                smoke_result=args.smoke_result,
            )
            json_text = format_lineage_summary_json(
                commit_sha=args.commit_sha,
                build_id=args.build_id,
                target_environment=args.target_environment,
                image_tag=args.image_tag,
                api_tag_ref=args.api_tag_ref,
                api_digest_ref=args.api_digest_ref,
                ui_tag_ref=args.ui_tag_ref,
                ui_digest_ref=args.ui_digest_ref,
                worker_digest_ref=args.worker_digest_ref,
                build_result=args.build_result,
                deploy_result=args.deploy_result,
                verify_result=args.verify_result,
                smoke_result=args.smoke_result,
            )
        except ValueError as exc:
            print(f"cd_deployment_lineage: FAILED — {exc}", file=sys.stderr)
            return 1

        if args.summary_path is not None:
            args.summary_path.parent.mkdir(parents=True, exist_ok=True)
            args.summary_path.write_text(markdown, encoding="utf-8")

        if args.json_path is not None:
            args.json_path.parent.mkdir(parents=True, exist_ok=True)
            args.json_path.write_text(json_text, encoding="utf-8")

        print(markdown, end="")
        return 0

    if args.assert_workflows:
        errors = assert_workflows_declare_deployment_lineage(args.repo_root)

        if errors:
            print("cd_deployment_lineage: FAILED — workflow drift:", file=sys.stderr)

            for error in errors:
                print(f"  {error}", file=sys.stderr)

            return 1

        print(
            "cd_deployment_lineage: OK — CD workflows declare digest-required deploy lineage "
            f"({len(WORKFLOW_RELATIVE_PATHS)} file(s))."
        )
        return 0

    parser.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
