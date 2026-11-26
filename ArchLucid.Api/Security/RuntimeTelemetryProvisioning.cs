using System.Security.Cryptography;
using System.Text.Json;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Security;

// Explicit opt-in server provisioning. The exact runtime scope maps to an authorized
// evidence run; a project role by itself is insufficient. No request-supplied paths.
internal static class RuntimeTelemetryProvisioning
{
    internal static string ScopeKey(RuntimeObservationRequest request) =>
        Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(request)));

    internal static IConfigurationSection Scope(IConfiguration config, RuntimeObservationRequest request) =>
        config.GetSection("SecureNow:RuntimeTelemetry:Scopes:" + ScopeKey(request));

    internal static bool Enabled(IConfiguration config) =>
        bool.TryParse(config["SecureNow:RuntimeTelemetry:Enabled"], out bool enabled) && enabled;
}
