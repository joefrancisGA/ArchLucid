#!/usr/bin/env bash
set -euo pipefail

# Pull official .NET bases with the registry API GET path before BuildKit metadata (HEAD-heavy).
# Builds can fail with: unexpected status from HEAD ... mcr.microsoft.com/... 403 Forbidden
# (MCR rate limits / WAF quirks; microsoft/aspire#16035, microsoft/containerregistry#188).

DOTNET_SDK_IMAGE="${DOTNET_SDK_IMAGE:-mcr.microsoft.com/dotnet/sdk:10.0.201-alpine3.23}"
DOTNET_ASPNET_IMAGE="${DOTNET_ASPNET_IMAGE:-mcr.microsoft.com/dotnet/aspnet:10.0-alpine3.23}"

echo "Prefetch DOTNET_SDK_IMAGE=${DOTNET_SDK_IMAGE}"
docker pull "${DOTNET_SDK_IMAGE}"

echo "Prefetch DOTNET_ASPNET_IMAGE=${DOTNET_ASPNET_IMAGE}"
docker pull "${DOTNET_ASPNET_IMAGE}"
