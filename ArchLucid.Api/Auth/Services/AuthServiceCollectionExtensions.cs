using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Auth.Scim;
using ArchLucid.Api.Authentication;
using ArchLucid.Api.Configuration;
using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Services;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

public static class AuthServiceCollectionExtensions
{
    /// <summary>Well-known scheme name used when <c>ArchLucidAuth:Mode</c> is <c>ApiKey</c>.</summary>
    public const string ApiKeySchemeName = "ApiKey";

    public static IServiceCollection AddArchLucidAuth(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        // JwtBearer configuration via Options.Configure<IConfiguration> needs IConfiguration in DI; bare
        // ServiceCollections omit it. Hosts already register IConfiguration, so TryAdd does not replace production wiring.
        services.TryAddSingleton(configuration);

        services.Configure<ArchLucidAuthOptions>(configuration.GetSection(ArchLucidAuthOptions.SectionName));
        services.PostConfigure<ArchLucidAuthOptions>(
            ArchLucidAuthConfigurationBridge.NormalizeModeForJwtLocalSigning);
        services.Configure<ApiKeyAuthenticationOptions>(
            configuration.GetSection(ApiKeyAuthenticationOptions.SectionPath));

        ArchLucidAuthOptions authOptions = ArchLucidAuthConfigurationBridge.Resolve(configuration);

        services.Configure<ArchLucidSamlAuthOptions>(
            configuration.GetSection(ArchLucidSamlAuthOptions.ConfigurationSectionPath));

        if (string.Equals(authOptions.Mode, "JwtBearer", StringComparison.OrdinalIgnoreCase))
        {
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(static _ => { })
                .AddScheme<AuthenticationSchemeOptions, ScimBearerAuthenticationHandler>(
                    ScimBearerDefaults.AuthenticationScheme,
                    _ =>
                    {
                    });

            // Register as IConfigureOptions<> (enumerable); registering only IConfigureNamedOptions<> is not picked up by OptionsFactory.
            services.TryAddEnumerable(
                ServiceDescriptor.Singleton<IConfigureOptions<JwtBearerOptions>, ArchLucidJwtBearerOptionsConfigurer>());
        }

        else if (string.Equals(authOptions.Mode, "ApiKey", StringComparison.OrdinalIgnoreCase))

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = ApiKeySchemeName;
                    options.DefaultChallengeScheme = ApiKeySchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
                    ApiKeySchemeName,
                    _ =>
                    {
                    })
                .AddScheme<AuthenticationSchemeOptions, ScimBearerAuthenticationHandler>(
                    ScimBearerDefaults.AuthenticationScheme,
                    _ =>
                    {
                    });

        else

            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = DevelopmentBypassAuthenticationHandler.SchemeName;
                    options.DefaultChallengeScheme = DevelopmentBypassAuthenticationHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, DevelopmentBypassAuthenticationHandler>(
                    DevelopmentBypassAuthenticationHandler.SchemeName,
                    _ =>
                    {
                    })
                .AddScheme<AuthenticationSchemeOptions, ScimBearerAuthenticationHandler>(
                    ScimBearerDefaults.AuthenticationScheme,
                    _ =>
                    {
                    });

        services.AddScoped<IRoleSyncService, NoOpRoleSyncService>();

        services.AddHttpContextAccessor();

        services.AddSingleton<IAuthDiagnosticsRingBuffer, AuthDiagnosticsRingBuffer>();
        services.AddScoped<IClaimsTransformation, ArchLucidRoleClaimsTransformation>();

        return services;
    }
}
