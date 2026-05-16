using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Configuration;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

/// <summary>
/// Applies JWT bearer validation parameters after the merged host <see cref="IConfiguration"/> is stable.
/// Startup must not freeze <see cref="ArchLucidAuthOptions"/> inside <see cref="AuthServiceCollectionExtensions.AddArchLucidAuth" />
/// closures; WebApplicationFactory can layer <see cref="ArchLucid.Api.Auth.Models.ArchLucidAuthOptions.JwtSigningPublicKeyPemPath" />
/// after <c>Program</c> binds services — an empty PEM at registration time yields broken OIDC settings and 401 on valid local JWTs.
/// </summary>
internal sealed class ArchLucidJwtBearerOptionsConfigurer(IConfiguration configuration) : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    public void Configure(JwtBearerOptions options) =>
        Configure(JwtBearerDefaults.AuthenticationScheme, options);

    public void Configure(string? name, JwtBearerOptions options)
    {
        if (!string.Equals(name, JwtBearerDefaults.AuthenticationScheme, StringComparison.Ordinal))
            return;

        ArchLucidAuthOptions authOptions = ArchLucidAuthConfigurationBridge.Resolve(_configuration);

        ArchLucidJwtBearerConfiguration.Apply(options, authOptions, _configuration);
    }
}
