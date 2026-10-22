namespace ArchLucid.Api.Tests;

/// <summary>
///     Process-wide auth env overrides for integration hosts. <see cref="Program" /> calls
///     <c>AddEnvironmentVariables()</c> after JSON files, so env wins over in-memory settings when the host starts.
///     Call <see cref="Clear" /> before DevelopmentBypass / ApiKey hosts; pair mode-specific <see cref="Apply" /> or
///     <see cref="ApplyApiKey" /> with <see cref="Clear" /> on factory dispose so JWT and ApiKey profiles do not leak
///     across <see cref="Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory{TEntryPoint}" /> instances in one process.
/// </summary>
internal static class JwtIntegrationTestEnvironmentOverrides
{
    private static readonly string[] Keys =
    [
        "ArchLucidAuth__Mode",
        "ArchLucidAuth__Authority",
        "ArchLucidAuth__Audience",
        "ArchLucidAuth__JwtSigningPublicKeyPemPath",
        "ArchLucidAuth__JwtLocalIssuer",
        "ArchLucidAuth__JwtLocalAudience",
        "Authentication__ApiKey__Enabled",
        "Authentication__ApiKey__DevelopmentBypassAll",
        "Authentication__ApiKey__AdminKey",
        "Authentication__ApiKey__ReadOnlyKey"
    ];

    internal static void Apply(string publicPemPath, string issuer, string audience)
    {
        Environment.SetEnvironmentVariable("ArchLucidAuth__Mode", "JwtBearer");
        Environment.SetEnvironmentVariable("ArchLucidAuth__Authority", string.Empty);
        Environment.SetEnvironmentVariable("ArchLucidAuth__Audience", string.Empty);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtSigningPublicKeyPemPath", publicPemPath);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalIssuer", issuer);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalAudience", audience);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__DevelopmentBypassAll", "false");
        Environment.SetEnvironmentVariable("Authentication__ApiKey__Enabled", null);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__AdminKey", null);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__ReadOnlyKey", null);
    }

    internal static void ApplyApiKey(string adminKey, string readOnlyKey)
    {
        Environment.SetEnvironmentVariable("ArchLucidAuth__Mode", "ApiKey");
        Environment.SetEnvironmentVariable("ArchLucidAuth__Authority", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__Audience", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtSigningPublicKeyPemPath", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalIssuer", null);
        Environment.SetEnvironmentVariable("ArchLucidAuth__JwtLocalAudience", null);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__Enabled", "true");
        Environment.SetEnvironmentVariable("Authentication__ApiKey__DevelopmentBypassAll", "false");
        Environment.SetEnvironmentVariable("Authentication__ApiKey__AdminKey", adminKey);
        Environment.SetEnvironmentVariable("Authentication__ApiKey__ReadOnlyKey", readOnlyKey);
    }

    internal static void Clear()
    {
        foreach (string key in Keys)
            Environment.SetEnvironmentVariable(key, null);
    }
}
