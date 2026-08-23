#!/usr/bin/env bash
set -euo pipefail

# Idempotent Cloud Agent bootstrap: install the .NET SDK version pinned in global.json.
# Used by .cursor/environment.json install phase.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GLOBAL_JSON="${REPO_ROOT}/global.json"
INSTALL_DIR="${DOTNET_ROOT:-${HOME}/.dotnet}"
MARKER="# archlucid-dotnet"

if [[ ! -f "${GLOBAL_JSON}" ]]; then
  echo "Expected ${GLOBAL_JSON} for SDK pin." >&2
  exit 1
fi

SDK_VERSION="$(python3 -c "import json; print(json.load(open('${GLOBAL_JSON}'))['sdk']['version'])")"

if [[ -x "${INSTALL_DIR}/dotnet" ]]; then
  INSTALLED="$("${INSTALL_DIR}/dotnet" --version 2>/dev/null || true)"

  if [[ "${INSTALLED}" == "${SDK_VERSION}" ]]; then
    echo "dotnet SDK ${SDK_VERSION} already installed at ${INSTALL_DIR}"
    exit 0
  fi
fi

echo "Installing dotnet SDK ${SDK_VERSION} to ${INSTALL_DIR}..."
curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
chmod +x /tmp/dotnet-install.sh
/tmp/dotnet-install.sh --version "${SDK_VERSION}" --install-dir "${INSTALL_DIR}"

persist_path() {
  local profile="$1"

  if [[ -f "${profile}" ]] && grep -q "${MARKER}" "${profile}" 2>/dev/null; then
    return 0
  fi

  {
    echo ""
    echo "${MARKER}"
    echo "export DOTNET_ROOT=\"${INSTALL_DIR}\""
    echo 'export PATH="$DOTNET_ROOT:$PATH"'
  } >> "${profile}"
}

touch "${HOME}/.bashrc"
touch "${HOME}/.profile"
persist_path "${HOME}/.bashrc"
persist_path "${HOME}/.profile"

export DOTNET_ROOT="${INSTALL_DIR}"
export PATH="${DOTNET_ROOT}:${PATH}"

"${INSTALL_DIR}/dotnet" --version
echo "dotnet SDK ready at ${INSTALL_DIR}"
