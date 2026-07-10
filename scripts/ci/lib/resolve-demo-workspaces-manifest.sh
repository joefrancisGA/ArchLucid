#!/usr/bin/env bash
# Resolves demo workspaces fixture manifest to an absolute path (independent of caller cwd).
# Env: ARCHLUCID_DEMO_WORKSPACES_MANIFEST or DEMO_WORKSPACES_MANIFEST (repo-relative or absolute).

resolve_demo_workspaces_manifest_path() {
  local lib_dir repo_root configured candidate default alt
  lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  repo_root="$(cd "${lib_dir}/../../.." && pwd)"
  configured="${ARCHLUCID_DEMO_WORKSPACES_MANIFEST:-${DEMO_WORKSPACES_MANIFEST:-fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json}}"

  if [[ "${configured}" = /* ]]; then
    candidate="${configured}"
  elif [[ -f "${repo_root}/${configured}" ]]; then
    candidate="${repo_root}/${configured}"
  elif [[ -f "${configured}" ]]; then
    candidate="${configured}"
  else
    candidate="${repo_root}/${configured}"
  fi

  if [[ -f "${candidate}" ]]; then
    echo "${candidate}"
    return 0
  fi

  default="${repo_root}/fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json"
  alt="${repo_root}/scripts/ci/fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json"

  if [[ -f "${default}" ]]; then
    echo "${default}"
    return 0
  fi

  if [[ -f "${alt}" ]]; then
    echo "${alt}"
    return 0
  fi

  echo "::error::Demo workspaces manifest not found: ${configured} (repo root: ${repo_root})" >&2
  return 1
}
