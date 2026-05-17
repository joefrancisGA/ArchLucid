using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Configuration;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

/// <summary>
///     Applies ArchLucid JWT bearer settings for the named <c>Bearer</c> scheme after framework configurators.
///     Using <see cref="IConfigureNamedOptions{TOptions}" /> keeps ordering reliable across hosts and Options versions
///     (<c>AddJwtBearer</c> alone can leave <see cref="JwtBearerOptions" /> at defaults if configurators run out of order).
/// </summary>
internal sealed class ArchLucidJwtBearerOptionsConfigurer : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly IConfiguration _configuration;

    public ArchLucidJwtBearerOptionsConfigurer(IConfiguration configuration)
    {
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    public void Configure(string? name, JwtBearerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (!string.Equals(name, JwtBearerDefaults.AuthenticationScheme, StringComparison.Ordinal))
            return;

        ArchLucidAuthOptions jwtAuthOptions = ArchLucidAuthConfigurationBridge.Resolve(_configuration);
        ArchLucidJwtBearerConfiguration.Apply(options, jwtAuthOptions, _configuration);
    }

    public void Configure(JwtBearerOptions options)
    {
        Configure(JwtBearerDefaults.AuthenticationScheme, options);
    }
}
