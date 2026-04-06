using ArchLucid.Api.Auth.Models;
using ArchLucid.Host.Core.Configuration;

namespace ArchLucid.Api.Configuration;

/// <summary>Binds merged auth options (legacy + <c>ArchLucidAuth</c> override) for API startup.</summary>
public static class ArchLucidAuthConfigurationBridge
{
    /// <inheritdoc cref="ArchLucidConfigurationBridge.ArchLucidAuthSectionName" />
    public static ArchLucidAuthOptions Resolve(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        ArchLucidAuthOptions options = new();
        configuration.GetSection(ArchLucidAuthOptions.SectionName).Bind(options);
        IConfigurationSection lucid = configuration.GetSection(ArchLucidConfigurationBridge.ArchLucidAuthSectionName);

        if (lucid.Exists())
        {
            lucid.Bind(options);
        }

        return options;
    }
}
