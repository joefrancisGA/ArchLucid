#!/usr/bin/env python3
"""CD application rollback helpers: last-known-good identity, schema gate, reports.

Self-test: ``python -m unittest discover -s scripts/ci/tests -p "test_cd_rollback.py"``.
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

from cd_post_deploy_product_smoke import extract_build_identity_from_html

SCHEMA_LKG = "archlucid.cd-last-known-good.v1"
SCHEMA_REPORT = "archlucid.cd-rollback-report.v1"

# Heuristic: non-additive DDL that makes rolling an older app binary onto a newer DB unsafe.
_DESTRUCTIVE_SQL_RE = re.compile(
    r"(?is)\b("
    r"DROP\s+TABLE|DROP\s+COLUMN|DROP\s+INDEX|DROP\s+CONSTRAINT|"
    r"ALTER\s+TABLE\b[^;]*\bDROP\b|"
    r"sp_rename|"
    r"ALTER\s+COLUMN\b[^;]*\bNOT\s+NULL\b"
    r")\b"
)

_DIGEST_RE = re.compile(r"(sha256:[0-9a-f]{64})", re.IGNORECASE)
_MIGRATION_NAME_RE = re.compile(r"^(\d{3})_.*\.sql$", re.IGNORECASE)


@dataclass(frozen=True)
class SchemaCompatResult:
    compatible: bool
    reason: str
    destructive_migrations: tuple[str, ...] = ()


@dataclass(frozen=True)
class AutoRollbackDecision:
    should_run: bool
    reason: str


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def extract_digest_from_image(image: str | None) -> str | None:
    if not isinstance(image, str) or not image.strip():
        return None

    match = _DIGEST_RE.search(image.strip())

    if match is None:
        return None

    return match.group(1).lower()


def extract_build_id_from_env_entries(entries: Any) -> str | None:
    if not isinstance(entries, list):
        return None

    for entry in entries:
        if not isinstance(entry, dict):
            continue

        name = str(entry.get("name") or "").strip()

        if name not in {"ARCHLUCID_BUILD_COMMIT_SHA", "BUILD_SHA", "NEXT_PUBLIC_BUILD_COMMIT_SHA"}:
            continue

        value = entry.get("value")

        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def build_component_record(
    *,
    role: str,
    app_name: str | None,
    revision: str | None,
    image: str | None,
    build_id: str | None,
) -> dict[str, Any]:
    digest = extract_digest_from_image(image)

    return {
        "role": role,
        "appName": app_name or "",
        "revision": revision or "",
        "image": image or "",
        "digest": digest or "",
        "buildId": build_id or "",
    }


def build_lkg_payload(
    *,
    environment: str,
    captured_at_utc: str | None = None,
    api: dict[str, Any],
    worker: dict[str, Any] | None = None,
    ui: dict[str, Any] | None = None,
    source: str = "container-apps-active-revision",
) -> dict[str, Any]:
    components = {"api": api}

    if worker is not None:
        components["worker"] = worker

    if ui is not None:
        components["ui"] = ui

    return {
        "schema": SCHEMA_LKG,
        "environment": environment,
        "capturedAtUtc": captured_at_utc or utc_now_iso(),
        "source": source,
        "components": components,
    }


def load_json_object(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))

    if not isinstance(payload, dict):
        raise ValueError(f"Expected JSON object in {path}")

    return payload


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def sql_looks_destructive(sql_text: str) -> bool:
    if not sql_text or not sql_text.strip():
        return False

    return _DESTRUCTIVE_SQL_RE.search(sql_text) is not None


def migration_basename(path: str) -> str:
    return Path(path.replace("\\", "/")).name


def is_forward_migration_basename(name: str) -> bool:
    return _MIGRATION_NAME_RE.match(name) is not None


def evaluate_schema_compat(
    *,
    lkg_build_id: str,
    failed_build_id: str,
    migrations_added: Iterable[tuple[str, str]],
) -> SchemaCompatResult:
    """Block rollback when failed deploy introduced non-additive DDL after LKG.

    ``migrations_added`` is an iterable of ``(relative_path, sql_text)`` for forward
    migrations present at ``failed_build_id`` but not at ``lkg_build_id``.
    """
    if not lkg_build_id.strip():
        return SchemaCompatResult(False, "last-known-good BUILD_ID is missing")

    if not failed_build_id.strip():
        return SchemaCompatResult(False, "failed BUILD_ID is missing")

    if lkg_build_id.strip() == failed_build_id.strip():
        return SchemaCompatResult(True, "LKG and failed BUILD_ID are identical")

    destructive: list[str] = []

    for relative_path, sql_text in migrations_added:
        name = migration_basename(relative_path)

        if not is_forward_migration_basename(name):
            continue

        if sql_looks_destructive(sql_text):
            destructive.append(relative_path.replace("\\", "/"))

    if destructive:
        return SchemaCompatResult(
            False,
            "Non-additive migrations landed after last-known-good; automatic app rollback is unsafe "
            "(human intervention / DB restore guidance required).",
            tuple(sorted(destructive)),
        )

    return SchemaCompatResult(
        True,
        "No destructive forward migrations detected between LKG and failed BUILD_ID",
    )


class GitSchemaScanError(Exception):
    """Raised when the schema gate cannot resolve git SHAs (fail closed)."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def _run_git(repo_root: Path, args: list[str]) -> tuple[int, str, str]:
    completed = subprocess.run(
        ["git", "-C", str(repo_root), *args],
        check=False,
        capture_output=True,
        text=True,
    )

    return completed.returncode, completed.stdout or "", completed.stderr or ""


def ensure_git_commit_reachable(
    *,
    repo_root: Path,
    commit_sha: str,
    fetch_remote: str = "origin",
) -> None:
    """Fail closed when a BUILD_ID SHA is missing from a shallow checkout."""
    sha = commit_sha.strip()

    if not sha:
        raise GitSchemaScanError("git commit SHA is empty — schema gate cannot run")

    code, _, _ = _run_git(repo_root, ["cat-file", "-e", f"{sha}^{{commit}}"])

    if code == 0:
        return

    # Shallow CI checkouts often omit the LKG SHA; deepen before refusing.
    fetch_code, _, fetch_err = _run_git(
        repo_root,
        ["fetch", "--depth", "1", fetch_remote, sha],
    )

    if fetch_code != 0:
        raise GitSchemaScanError(
            f"Cannot resolve git SHA {sha!r} for schema gate (shallow clone / missing object). "
            f"Deepen fetch failed ({fetch_err.strip() or 'unknown error'}). "
            "Human intervention required — do not skip the schema gate."
        )

    code, _, err = _run_git(repo_root, ["cat-file", "-e", f"{sha}^{{commit}}"])

    if code != 0:
        raise GitSchemaScanError(
            f"Cannot resolve git SHA {sha!r} for schema gate after fetch "
            f"({err.strip() or 'object still missing'}). Human intervention required."
        )


def collect_migrations_added_via_git(
    *,
    repo_root: Path,
    lkg_build_id: str,
    failed_build_id: str,
    git_show: Callable[[str, str], str | None] | None = None,
    list_tree_files: Callable[[str, str], list[str]] | None = None,
    ensure_reachable: Callable[[str], None] | None = None,
) -> list[tuple[str, str]]:
    """Return (path, content) for Migrations/*.sql added between two git SHAs.

    Raises ``GitSchemaScanError`` when either SHA cannot be listed (fail closed).
    """

    def _ensure(sha: str) -> None:
        if ensure_reachable is not None:
            ensure_reachable(sha)
            return

        if list_tree_files is not None:
            return

        ensure_git_commit_reachable(repo_root=repo_root, commit_sha=sha)

    def _list(sha: str, prefix: str) -> list[str]:
        if list_tree_files is not None:
            return list_tree_files(sha, prefix)

        _ensure(sha)
        code, stdout, stderr = _run_git(
            repo_root,
            ["ls-tree", "-r", "--name-only", sha, prefix],
        )

        if code != 0:
            raise GitSchemaScanError(
                f"git ls-tree failed for {sha!r} ({stderr.strip() or 'unknown error'}). "
                "Schema gate cannot be skipped silently."
            )

        return [line.strip() for line in stdout.splitlines() if line.strip()]

    def _show(sha: str, path: str) -> str | None:
        if git_show is not None:
            return git_show(sha, path)

        code, stdout, _ = _run_git(repo_root, ["show", f"{sha}:{path}"])

        if code != 0:
            return None

        return stdout

    _ensure(lkg_build_id)
    _ensure(failed_build_id)

    prefix = "ArchLucid.Persistence/Migrations"
    old_set = {
        path
        for path in _list(lkg_build_id, prefix)
        if is_forward_migration_basename(migration_basename(path))
    }
    new_paths = [
        path
        for path in _list(failed_build_id, prefix)
        if is_forward_migration_basename(migration_basename(path)) and path not in old_set
    ]
    added: list[tuple[str, str]] = []

    for path in sorted(new_paths):
        content = _show(failed_build_id, path)

        if content is None:
            raise GitSchemaScanError(
                f"git show failed for {failed_build_id!r}:{path} — refusing to approve schema gate"
            )

        added.append((path, content))

    return added


def decide_auto_rollback(
    *,
    flag_enabled: bool,
    has_distinct_failed_revision: bool,
    lkg_present: bool,
    schema: SchemaCompatResult,
    smoke_url_configured: bool,
) -> AutoRollbackDecision:
    if not flag_enabled:
        return AutoRollbackDecision(False, "CD_ROLLBACK_ON_SMOKE_FAILURE is not true")

    if not smoke_url_configured:
        return AutoRollbackDecision(False, "SMOKE_TEST_BASE_URL missing — refusing blind rollback")

    if not has_distinct_failed_revision:
        return AutoRollbackDecision(False, "No distinct failed revision to deactivate/restore from")

    if not lkg_present:
        return AutoRollbackDecision(False, "Last-known-good artifact missing or incomplete")

    if not schema.compatible:
        return AutoRollbackDecision(False, f"Schema gate blocked rollback: {schema.reason}")

    return AutoRollbackDecision(True, "Auto-rollback approved")


def validate_target_artifact(
    *,
    build_id: str,
    api_digest: str | None,
    ui_digest: str | None,
    ui_required: bool,
) -> tuple[bool, str]:
    if not build_id.strip():
        return False, "rollback target BUILD_ID is required"

    if not api_digest or not str(api_digest).startswith("sha256:"):
        return False, f"API digest missing or invalid for BUILD_ID {build_id}"

    if ui_required and (not ui_digest or not str(ui_digest).startswith("sha256:")):
        return False, f"UI digest missing or invalid for BUILD_ID {build_id}"

    return True, "rollback target artifacts present"


def verify_runtime_build_id(*, expected: str, observed: str | None) -> tuple[bool, str]:
    if not expected.strip():
        return False, "expected BUILD_ID unset"

    if not observed or not str(observed).strip():
        return False, "runtime commitSha missing"

    if str(observed).strip() != expected.strip():
        return False, f"runtime commitSha={observed!r} != expected BUILD_ID={expected!r}"

    return True, "runtime BUILD_ID matches rollback target"


def verify_ui_public_shell_build_id(*, expected: str, html: str | None) -> tuple[bool, str]:
    """Verify UI public-shell HTML meta matches rollback target BUILD_ID."""
    if not expected.strip():
        return False, "expected BUILD_ID unset"

    if html is None or not str(html).strip():
        return False, "UI public-shell HTML missing"

    # Reuse the product-smoke meta extractor so CD and rollback stay aligned.
    observed = extract_build_identity_from_html(str(html))
    ok, reason = verify_runtime_build_id(expected=expected, observed=observed)

    if ok:
        return True, "UI public-shell BUILD_ID matches rollback target"

    return False, f"UI public-shell {reason}"


def build_rollback_report(
    *,
    environment: str,
    mode: str,
    failed_build_id: str,
    rollback_target_build_id: str,
    rollback_result: str,
    verification_result: str,
    schema: SchemaCompatResult | None = None,
    details: dict[str, Any] | None = None,
    generated_at_utc: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "schema": SCHEMA_REPORT,
        "generatedAtUtc": generated_at_utc or utc_now_iso(),
        "environment": environment,
        "mode": mode,
        "failedBuildId": failed_build_id,
        "rollbackTargetBuildId": rollback_target_build_id,
        "rollbackResult": rollback_result,
        "verificationResult": verification_result,
        "details": details or {},
    }

    if schema is not None:
        payload["schemaCompat"] = {
            "compatible": schema.compatible,
            "reason": schema.reason,
            "destructiveMigrations": list(schema.destructive_migrations),
        }

    return payload


def render_rollback_report_markdown(payload: dict[str, Any]) -> str:
    schema = payload.get("schemaCompat") or {}
    lines = [
        "# CD application rollback report",
        "",
        f"- Generated (UTC): `{payload.get('generatedAtUtc', '')}`",
        f"- Environment: `{payload.get('environment', '')}`",
        f"- Mode: `{payload.get('mode', '')}`",
        f"- Failed BUILD_ID: `{payload.get('failedBuildId', '')}`",
        f"- Rollback target BUILD_ID: `{payload.get('rollbackTargetBuildId', '')}`",
        f"- Rollback result: **{payload.get('rollbackResult', '')}**",
        f"- Verification result: **{payload.get('verificationResult', '')}**",
        "",
    ]

    if schema:
        lines.extend(
            [
                "## Schema compatibility",
                f"- Compatible: `{schema.get('compatible')}`",
                f"- Reason: {schema.get('reason')}",
            ]
        )
        destructive = schema.get("destructiveMigrations") or []

        if destructive:
            lines.append("- Destructive migrations:")

            for path in destructive:
                lines.append(f"  - `{path}`")

        lines.append("")

    details = payload.get("details") or {}

    if details:
        lines.append("## Details")

        for key, value in details.items():
            lines.append(f"- {key}: `{value}`")

        lines.append("")

    lines.extend(
        [
            "---",
            "Original deploy/smoke failure remains a failed workflow outcome even when rollback succeeds.",
            "See `docs/library/DEPLOYMENT_CD_PIPELINE.md` § Application rollback.",
        ]
    )

    return "\n".join(lines)


def lkg_primary_build_id(lkg: dict[str, Any]) -> str:
    components = lkg.get("components")

    if not isinstance(components, dict):
        return ""

    api = components.get("api")

    if isinstance(api, dict) and isinstance(api.get("buildId"), str):
        return api["buildId"].strip()

    return ""


def lkg_has_usable_api(lkg: dict[str, Any]) -> bool:
    components = lkg.get("components")

    if not isinstance(components, dict):
        return False

    api = components.get("api")

    if not isinstance(api, dict):
        return False

    revision = str(api.get("revision") or "").strip()
    digest = str(api.get("digest") or "").strip()
    build_id = str(api.get("buildId") or "").strip()

    return bool(revision) and (bool(digest) or bool(build_id))
