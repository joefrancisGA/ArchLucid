#!/usr/bin/env bash
set -euo pipefail

# Idempotent Cloud Agent bootstrap for ArchLucid.
# Installs the pinned .NET SDK, Node.js 22, PowerShell 7 + Pester 5,
# restores the API, and installs archlucid-ui dependencies.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="${NUGET_PACKAGES:-${HOME}/.nuget/packages}"
export PATH="/usr/local/bin:${PATH}"

NODE_VERSION="22.23.3"
PWSH_VERSION="7.4.6"
INSTALL_DIR="${DOTNET_ROOT:-${HOME}/.dotnet}"
export DOTNET_ROOT="${INSTALL_DIR}"

install_node() {
  if [[ -x /usr/local/bin/node && -x /usr/local/bin/npm ]]; then
    local current
    current="$(/usr/local/bin/node -v 2>/dev/null || true)"
    if [[ "${current}" == "v${NODE_VERSION}" ]]; then
      echo "Node.js ${current} already installed at /usr/local"
      return 0
    fi
  fi

  echo "Installing Node.js ${NODE_VERSION}..."
  curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz
  sudo tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 --no-same-owner
  hash -r
  /usr/local/bin/node -v
  /usr/local/bin/npm -v
}

install_dotnet() {
  local global_json="${REPO_ROOT}/global.json"
  if [[ ! -f "${global_json}" ]]; then
    echo "Expected ${global_json} for SDK pin." >&2
    exit 1
  fi

  local sdk_version
  sdk_version="$(python3 -c "import json; print(json.load(open('${global_json}'))['sdk']['version'])")"

  local installed=""
  if [[ -x "${INSTALL_DIR}/dotnet" ]]; then
    installed="$("${INSTALL_DIR}/dotnet" --version 2>/dev/null || true)"
  fi

  if [[ "${installed}" != "${sdk_version}" ]]; then
    echo "Installing dotnet SDK ${sdk_version} to ${INSTALL_DIR}..."
    curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
    chmod +x /tmp/dotnet-install.sh
    /tmp/dotnet-install.sh --version "${sdk_version}" --install-dir "${INSTALL_DIR}"
  else
    echo "dotnet SDK ${sdk_version} already installed at ${INSTALL_DIR}"
  fi

  sudo ln -sf "${INSTALL_DIR}/dotnet" /usr/local/bin/dotnet
  "${INSTALL_DIR}/dotnet" --version
}

install_pwsh() {
  local pwsh_root="${HOME}/.local/pwsh"
  if [[ ! -x "${pwsh_root}/pwsh" ]]; then
    echo "Installing PowerShell ${PWSH_VERSION}..."
    mkdir -p "${pwsh_root}" "${HOME}/.local/bin"
    curl -fsSL "https://github.com/PowerShell/PowerShell/releases/download/v${PWSH_VERSION}/powershell-${PWSH_VERSION}-linux-x64.tar.gz" \
      | tar -xzf - -C "${pwsh_root}"
    chmod a+x "${pwsh_root}/pwsh"
  else
    echo "PowerShell already installed at ${pwsh_root}"
  fi

  ln -sf "${pwsh_root}/pwsh" "${HOME}/.local/bin/pwsh"
  sudo ln -sf "${pwsh_root}/pwsh" /usr/local/bin/pwsh

  /usr/local/bin/pwsh -NoProfile -Command "
    \$pester = Get-Module -ListAvailable -Name Pester |
      Where-Object { \$_.Version -ge [version]'5.0.0' -and \$_.Version -lt [version]'6.0.0' } |
      Select-Object -First 1
    if (\$null -eq \$pester) {
      Install-Module Pester -Scope CurrentUser -Force -SkipPublisherCheck -MinimumVersion 5.0.0 -MaximumVersion 5.99.99
    } else {
      Write-Host \"Pester \$(\$pester.Version) already installed\"
    }
  "
}

write_profile() {
  sudo tee /etc/profile.d/archlucid-cloud.sh >/dev/null <<'EOF'
export DOTNET_ROOT="${HOME}/.dotnet"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="${HOME}/.nuget/packages"
export PATH="/usr/local/bin:${DOTNET_ROOT}:${HOME}/.local/bin:${PATH}"
EOF
}

install_node
install_dotnet
install_pwsh
write_profile

echo "Restoring and building ArchLucid.Api (Debug)..."
dotnet restore ArchLucid.Api/ArchLucid.Api.csproj
dotnet build ArchLucid.Api/ArchLucid.Api.csproj -c Debug --verbosity minimal

echo "Installing archlucid-ui dependencies..."
npm ci --prefix archlucid-ui
python3 scripts/ci/assert_single_npm_dependency_version.py @tanstack/query-core --prefix archlucid-ui

echo "Cloud Agent install complete."
