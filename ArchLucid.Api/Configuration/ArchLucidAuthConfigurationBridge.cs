using ArchLucid.Api.Auth.Models;

namespace ArchLucid.Api.Configuration;

/// <summary>Binds <c>ArchLucidAuth</c> options for API startup.</summary>
public static class ArchLucidAuthConfigurationBridge
{
    /// <summary>
    ///     Loads <see cref="ArchLucidAuthOptions" /> from <see cref="ArchLucidAuthOptions.SectionName" />,
    ///     then applies <see cref="NormalizeModeForJwtLocalSigning" />.
    /// </summary>
    public static ArchLucidAuthOptions Resolve(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        ArchLucidAuthOptions options = new();
        configuration.GetSection(ArchLucidAuthOptions.SectionName).Bind(options);

        NormalizeModeForJwtLocalSigning(options);

        return options;
    }

    /// <summary>
    ///     Forces <see cref="ArchLucidAuthOptions.Mode" /> to <c>JwtBearer</c> when
    ///     <see cref="ArchLucidAuthOptions.JwtSigningPublicKeyPemPath" /> selects local PEM validation — otherwise
    ///     <c>appsettings.Development.json</c> can layer <c>DevelopmentBypass</c> after WebApplicationFactory
    ///     in-memory overrides so Bearer tokens are not validated (401) in JWT integration tests.
    /// </summary>
    public static void NormalizeModeForJwtLocalSigning(ArchLucidAuthOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string pemPath = options.JwtSigningPublicKeyPemPath?.Trim() ?? string.Empty;

        if (pemPath.Length == 0)
            return;

        options.Mode = "JwtBearer";
    }
}
