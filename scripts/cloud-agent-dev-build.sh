#!/usr/bin/env bash
# Shared dev-host MSBuild argument for Cloud Agent install and start.
#
# Directory.Build.props sets TreatWarningsAsErrors. Current trunk Persistence
# reports ARCH006, ARCH006a, and ARCH006b (tenant-scope SQL the analyzer cannot
# accept). Those warnings fail `dotnet build` / `dotnet run`, so the in-memory
# API never listens. %3B is the MSBuild escape for ';' inside one property.
# The push corset does not pass this property; CI still treats the warnings as errors.

cloud_agent_dev_build_args() {
  printf '%s' '-p:WarningsNotAsErrors=ARCH006%3BARCH006a%3BARCH006b'
}
