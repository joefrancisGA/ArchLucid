using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

/// <summary>Reads ArchLucidAuth settings without referencing Host.Core (CLI stays dependency-light).</summary>
internal static class AuthSsoPreflightConfigurationReader
{
    private const string AuthSection = "ArchLucidAuth";

    internal static string? ResolveAuthValue(IConfiguration configuration, string relativeKey) =>
        configuration[$"{AuthSection}:{relativeKey}"]?.Trim();
}
