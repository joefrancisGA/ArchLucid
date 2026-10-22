using ArchLucid.Persistence.Cosmos;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Shared Cosmos DB configuration predicates for host validation and client construction (TB-906).
/// </summary>
public static class CosmosDbConfigurationProbe
{
    public const string ManagedIdentityAuthenticationMode = "ManagedIdentity";

    public const string ConnectionStringAuthenticationMode = "ConnectionString";

    /// <summary>
    ///     <see langword="true" /> when <c>CosmosDb:AuthenticationMode</c> is <c>ManagedIdentity</c>.
    /// </summary>
    public static bool UsesManagedIdentity(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        return UsesManagedIdentity(
            configuration[$"{CosmosDbOptions.SectionName}:AuthenticationMode"]);
    }

    /// <summary>
    ///     <see langword="true" /> when <see cref="CosmosDbOptions.AuthenticationMode" /> is <c>ManagedIdentity</c>.
    /// </summary>
    public static bool UsesManagedIdentity(CosmosDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        return UsesManagedIdentity(options.AuthenticationMode);
    }

    /// <summary>
    ///     Polyglot Cosmos features are credentialed when a connection string or managed-identity endpoint is present.
    /// </summary>
    public static bool IsPolyglotCredentialConfigured(CosmosDbOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (UsesManagedIdentity(options))
            return !string.IsNullOrWhiteSpace(options.AccountEndpoint);

        return !string.IsNullOrWhiteSpace(options.ConnectionString);
    }

    internal static bool UsesManagedIdentity(string? authenticationMode)
    {
        return string.Equals(
            authenticationMode?.Trim(),
            ManagedIdentityAuthenticationMode,
            StringComparison.OrdinalIgnoreCase);
    }
}
